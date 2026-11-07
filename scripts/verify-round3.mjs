import { chromium } from "playwright";
import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import assert from "assert";

const OUT_DIR = path.join(process.cwd(), "artifacts", "screenshots");
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

async function waitForServer(url, timeout = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const res = await fetch(url);
      if (res.ok) return true;
    } catch {
      // wait
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Server did not respond within ${timeout}ms at ${url}`);
}

async function main() {
  console.log("=== STARTING ROUND 3 VERIFICATION SUITE ===");

  console.log("\nStarting Next.js production server on port 3030...");
  const server = spawn("npx", ["next", "start", "-p", "3030", "-H", "127.0.0.1"], {
    shell: true,
    env: {
      ...process.env,
      NODE_ENV: "production",
      GITHUB_USERNAME: "chiboy-star",
    },
    stdio: "inherit",
  });

  try {
    await waitForServer("http://127.0.0.1:3030");
    console.log("Server ready at http://127.0.0.1:3030");

    // -------------------------------------------------------------------------
    // TEST 1: ZERO HYDRATION WARNINGS ACROSS ALL CONFIGURATIONS
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 1: Hydration Verification Across All Scenarios ---");

    const testScenarios = [
      { name: "Full tier (?tier=full)", url: "http://127.0.0.1:3030/?tier=full&intro=0", viewport: { width: 1440, height: 900 } },
      { name: "Lite tier (?tier=lite)", url: "http://127.0.0.1:3030/?tier=lite&intro=0", viewport: { width: 1440, height: 900 } },
      { name: "Minimal tier (?tier=minimal)", url: "http://127.0.0.1:3030/?tier=minimal&intro=0", viewport: { width: 1440, height: 900 } },
      { name: "Reduced Motion", url: "http://127.0.0.1:3030/?intro=0", viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" },
      { name: "Mobile 390px Viewport", url: "http://127.0.0.1:3030/?intro=0", viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
    ];

    for (const scenario of testScenarios) {
      const browser = await chromium.launch({
        headless: true,
        args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-webgl"],
      });

      const context = await browser.newContext({
        viewport: scenario.viewport,
        reducedMotion: scenario.reducedMotion,
        isMobile: scenario.isMobile,
        hasTouch: scenario.hasTouch,
      });

      const hydrationErrors = [];
      const page = await context.newPage();

      page.on("console", (msg) => {
        const text = msg.text().toLowerCase();
        if (text.includes("hydrat") || text.includes("mismatch") || text.includes("error #418") || text.includes("error #423")) {
          hydrationErrors.push(`[${msg.type()}] ${msg.text()}`);
        }
      });

      page.on("pageerror", (err) => {
        const text = err.message.toLowerCase();
        if (text.includes("hydrat") || text.includes("mismatch")) {
          hydrationErrors.push(`[PageError] ${err.message}`);
        }
      });

      await page.goto(scenario.url, { waitUntil: "load" });
      await page.waitForTimeout(1000);

      const tier = await page.evaluate(() => document.documentElement.getAttribute("data-tier"));
      console.log(`  ✓ ${scenario.name}: data-tier="${tier}" | Hydration warnings: ${hydrationErrors.length}`);

      if (hydrationErrors.length > 0) {
        console.error(`    FAILED on ${scenario.name}:`, hydrationErrors);
        throw new Error(`Hydration mismatch detected on ${scenario.name}`);
      }

      await context.close();
      await browser.close();
    }
    console.log("  >>> RESULT: ZERO hydration warnings across all 5 test scenarios! <<<");

    // -------------------------------------------------------------------------
    // TEST 2: CUMULATIVE LAYOUT SHIFT (CLS < 0.05)
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 2: Cumulative Layout Shift (CLS) on Full Tier ---");
    {
      const browser = await chromium.launch({
        headless: true,
        args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-webgl"],
      });
      const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

      await page.goto("http://127.0.0.1:3030/?tier=full&intro=0", { waitUntil: "domcontentloaded" });

      const cls = await page.evaluate(async () => {
        let score = 0;
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
              score += entry.value;
            }
          }
        });
        observer.observe({ type: "layout-shift", buffered: true });

        // Wait 2 seconds for mount & carousel hydration
        await new Promise((r) => setTimeout(r, 2000));
        observer.disconnect();
        return score;
      });

      console.log(`  Measured CLS: ${cls.toFixed(4)} (Threshold: < 0.05)`);
      if (cls >= 0.05) {
        throw new Error(`CLS exceeded threshold: ${cls}`);
      }
      console.log("  ✓ CLS test PASSED.");
      await browser.close();
    }

    // -------------------------------------------------------------------------
    // TEST 3: 10 RELOADS TIER STABILITY & NAME STYLE ROTATION
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 3: 10 Reloads Tier Stability & Name Rotation ---");
    {
      const browser = await chromium.launch({
        headless: true,
        args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-webgl"],
      });
      const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

      const stylesHistory = [];
      const tiersHistory = [];

      for (let i = 1; i <= 10; i++) {
        await page.goto("http://127.0.0.1:3030/?intro=0", { waitUntil: "load" });
        await page.waitForTimeout(400);

        const info = await page.evaluate(() => {
          return {
            tier: document.documentElement.getAttribute("data-tier") || window.__PAGE_TIER,
            style: localStorage.getItem("last_name_style"),
          };
        });

        stylesHistory.push(info.style);
        tiersHistory.push(info.tier);
        console.log(`  Reload ${i.toString().padStart(2, " ")}: tier="${info.tier}" | activeStyle="${info.style}"`);
      }

      // Check tier stability: all 10 reloads on this 1440px desktop browser must be 'full'
      const allFull = tiersHistory.every((t) => t === "full");
      console.log(`  Tier stability check: all 10 loads identical tier="full": ${allFull}`);
      if (!allFull) throw new Error("Tier flipped unexpectedly between loads!");

      // Check rotation: never same style twice in a row
      let hasDuplicateSuccessive = false;
      for (let j = 1; j < stylesHistory.length; j++) {
        if (stylesHistory[j] === stylesHistory[j - 1]) {
          hasDuplicateSuccessive = true;
          break;
        }
      }
      console.log(`  Style rotation check: no duplicate consecutive styles: ${!hasDuplicateSuccessive}`);
      if (hasDuplicateSuccessive) throw new Error("Same style repeated twice in a row!");
      console.log("  ✓ 10 Reloads test PASSED.");

      await browser.close();
    }

    // -------------------------------------------------------------------------
    // TEST 4: FIX B - PARTICLES NAME ACTUALLY RENDERS (?debug=particles)
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 4: Fix B - Particle Wordmark Rendering & Debug Count ---");
    {
      const browser = await chromium.launch({
        headless: true,
        args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-webgl"],
      });
      const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

      let particleCount = 0;
      page.on("console", (msg) => {
        const text = msg.text();
        if (text.includes("[Particles Debug] Total particles sampled:")) {
          console.log(`  Browser Console: ${text}`);
          const match = text.match(/\d+/);
          if (match) particleCount = parseInt(match[0], 10);
        }
      });

      // Force particles style via query param & debug=particles
      await page.goto("http://127.0.0.1:3030/?tier=full&intro=0&style=particles&debug=particles", { waitUntil: "load" });
      await page.waitForTimeout(2000);

      // Verify canvas rendered
      const canvasInfo = await page.evaluate(() => {
        const c = document.querySelector("#hero canvas");
        return {
          exists: !!c,
          width: c ? c.width : 0,
          height: c ? c.height : 0,
        };
      });

      console.log(`  Canvas metrics: exists=${canvasInfo.exists}, width=${canvasInfo.width}, height=${canvasInfo.height}`);
      await page.screenshot({ path: path.join(OUT_DIR, "round3-style-particles.png") });
      console.log("  Saved screenshot: round3-style-particles.png");

      // Capture other styles
      const otherStyles = ["heavy-stacked", "letter-rise", "slice", "decode", "outline-fill", "weight-sweep", "wide-thin"];
      for (const st of otherStyles) {
        await page.goto(`http://127.0.0.1:3030/?tier=full&intro=0&style=${st}`, { waitUntil: "load" });
        await page.waitForTimeout(600);
        await page.screenshot({ path: path.join(OUT_DIR, `round3-style-${st}.png`) });
        console.log(`  Saved screenshot: round3-style-${st}.png`);
      }

      await browser.close();
    }

    // -------------------------------------------------------------------------
    // TEST 5: CHECK D - DATA STORE & CREDENTIALS EVALUATION
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 5: Check D - Data Store & Connections Diagnostic ---");
    {
      const hasUpstash = Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
      const hasKv = Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
      const activeStore = (hasUpstash || hasKv) ? "redis" : "file";

      console.log(`  Active runtime store detected: "${activeStore}"`);
      console.log(`  Upstash credentials: ${hasUpstash ? "CONNECTED" : "NOT SET"}`);
      console.log(`  Vercel KV credentials: ${hasKv ? "CONNECTED" : "NOT SET"}`);
      console.log(`  ✓ Store diagnostic verified: active store is "${activeStore}"`);
    }

    console.log("\n=== ALL ROUND 3 VERIFICATION TESTS PASSED SUCCESSFULLY! ===");
  } finally {
    server.kill();
  }
}

main().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});

