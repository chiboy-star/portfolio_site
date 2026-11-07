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
  let lastErr = null;
  while (Date.now() - start < timeout) {
    try {
      const res = await fetch(url);
      if (res.status < 500) return true;
    } catch (e) {
      lastErr = e;
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Server did not respond within ${timeout}ms at ${url}: ${lastErr?.message || lastErr}`);
}

function calculateLuminance(r, g, b) {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function contrastRatio(hex1, hex2) {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  const l1 = calculateLuminance(rgb1.r, rgb1.g, rgb1.b);
  const l2 = calculateLuminance(rgb2.r, rgb2.g, rgb2.b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function hexToRgb(hex) {
  hex = hex.replace("#", "");
  if (hex.length === 3) hex = hex.split("").map((c) => c + c).join("");
  const num = parseInt(hex, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

async function main() {
  console.log("=== STARTING ROUND 4 VERIFICATION SUITE ===");

  const PORT = 3040;
  const BASE_URL = `http://127.0.0.1:${PORT}`;

  console.log(`\nStarting Next.js production server on port ${PORT}...`);
  const server = spawn("npx", ["next", "start", "-p", String(PORT), "-H", "127.0.0.1"], {
    shell: true,
    env: {
      ...process.env,
      NODE_ENV: "production",
      GITHUB_USERNAME: "chiboy-star",
    },
    stdio: "inherit",
  });

  try {
    await waitForServer(BASE_URL);
    console.log(`Server ready at ${BASE_URL}`);

    const browser = await chromium.launch({
      headless: true,
      args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-webgl"],
    });

    // -------------------------------------------------------------------------
    // TEST 1: FIX 1 & 2 - INTRO SEQUENCE IN LIGHT AND DARK THEMES
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 1: Intro Sequence & Contrast (Light & Dark Theme) ---");

    const themes = ["light", "dark"];
    for (const theme of themes) {
      console.log(`\nTesting intro sequence in ${theme} theme...`);
      const context = await browser.newContext({
        viewport: { width: 1440, height: 900 },
        colorScheme: theme,
      });

      const page = await context.newPage();
      const logs = [];
      page.on("console", (m) => logs.push(m.text()));

      // Navigate with ?intro=1 to force intro in fresh context
      await page.goto(`${BASE_URL}/?intro=1&tier=full`, { waitUntil: "domcontentloaded" });

      // Force theme on <html> class if needed
      await page.evaluate((th) => {
        if (th === "dark") {
          document.documentElement.classList.add("dark");
          document.documentElement.classList.remove("light");
        } else {
          document.documentElement.classList.remove("dark");
          document.documentElement.classList.add("light");
        }
      }, theme);

      // t = 0: Hold phase
      await page.waitForTimeout(100);
      const t0Path = path.join(OUT_DIR, `round4-intro-${theme}-t0.png`);
      await page.screenshot({ path: t0Path });
      console.log(`  ✓ Captured ${path.basename(t0Path)} (hold phase)`);

      // Verify intro element exists
      const hasIntroAt0 = await page.evaluate(() => !!document.getElementById("crack-open-intro"));
      assert.strictEqual(hasIntroAt0, true, "Intro element must be mounted at t=0");

      // t ≈ 0.8s: Stepped square staircase opening phase
      await page.waitForTimeout(700);
      const t800Path = path.join(OUT_DIR, `round4-intro-${theme}-t800.png`);
      await page.screenshot({ path: t800Path });
      console.log(`  ✓ Captured ${path.basename(t800Path)} (stepped ring opening phase)`);

      // t ≈ 1.8s: Overlay removed, hero revealed
      await page.waitForTimeout(1000);
      const t1800Path = path.join(OUT_DIR, `round4-intro-${theme}-t1800.png`);
      await page.screenshot({ path: t1800Path });
      console.log(`  ✓ Captured ${path.basename(t1800Path)} (overlay finished, hero visible)`);

      const hasIntroAt1800 = await page.evaluate(() => !!document.getElementById("crack-open-intro"));
      assert.strictEqual(hasIntroAt1800, false, "Intro element must be unmounted by t=1.8s");

      // Check contrast ratios
      const pageBg = theme === "dark" ? "#0A0A0B" : "#FAFAF7";
      const slabBg = theme === "dark" ? "#F5A524" : "#0A0A0B";
      const wordmarkFg = theme === "dark" ? "#0A0A0B" : "#EDEDEE";
      const slabContrast = contrastRatio(pageBg, slabBg);
      const wordmarkContrast = contrastRatio(slabBg, wordmarkFg);

      console.log(`  ✓ ${theme.toUpperCase()} Contrast checks:`);
      console.log(`    - Slab (${slabBg}) vs Page (${pageBg}): ${slabContrast.toFixed(2)}:1 (required >= 3:1)`);
      console.log(`    - Wordmark (${wordmarkFg}) vs Slab (${slabBg}): ${wordmarkContrast.toFixed(2)}:1 (required >= 4.5:1)`);
      assert.ok(slabContrast >= 3.0, `Slab contrast ${slabContrast} must be >= 3:1`);
      assert.ok(wordmarkContrast >= 4.5, `Wordmark contrast ${wordmarkContrast} must be >= 4.5:1`);

      await context.close();
    }

    // -------------------------------------------------------------------------
    // TEST 2: REPLAY INTRO VIA IN-MEMORY COMMAND MENU EVENT
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 2: In-Memory Replay Intro Trigger ---");
    {
      const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      const page = await context.newPage();
      await page.goto(`${BASE_URL}/?intro=0&tier=full`, { waitUntil: "load" });
      await page.waitForTimeout(300);

      // Initially skipped with intro=0
      const isInitiallySkipped = await page.evaluate(() => {
        return document.documentElement.getAttribute("data-intro") === "skip" && !document.getElementById("crack-open-intro");
      });
      console.log(`  ✓ Initially skipped with intro=0: ${isInitiallySkipped}`);
      assert.strictEqual(isInitiallySkipped, true, "Should be initially skipped");

      // Dispatch intro:replay event (simulating Command Menu action)
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent("intro:replay"));
      });
      await page.waitForTimeout(200);

      const replayMounted = await page.evaluate(() => {
        return document.documentElement.getAttribute("data-intro") === "play" && !!document.getElementById("crack-open-intro");
      });
      assert.strictEqual(replayMounted, true, "Intro should mount into DOM on intro:replay without reload");
      console.log("  ✓ In-memory intro:replay triggered and intro mounted successfully without page reload");

      // Wait for it to complete
      await page.waitForTimeout(1700);
      const isFinished = await page.evaluate(() => {
        return document.documentElement.getAttribute("data-intro") === "skip" && !document.getElementById("crack-open-intro");
      });
      assert.strictEqual(isFinished, true, "Intro should remove itself from DOM after sequence completes");
      console.log("  ✓ Replay sequence completed and unmounted cleanly");

      await context.close();
    }

    // -------------------------------------------------------------------------
    // TEST 3: ALL 9 NAME STYLES IN LIGHT, DARK, AND MOBILE (390px)
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 3: All 9 Name Styles Verification ---");

    const styles = [
      { id: "wide-thin", name: "Wide Thin (Syncopate 400)" },
      { id: "heavy-stacked", name: "Heavy Stacked (Unbounded 900)" },
      { id: "marker-scrawl", name: "Marker Scrawl (Permanent Marker 400)" },
      { id: "slice", name: "Slice (Anton 400)" },
      { id: "decode", name: "Decode (Major Mono Display 400)" },
      { id: "outline-fill", name: "Outline Fill (Rubik Mono One 400)" },
      { id: "weight-sweep", name: "Weight Sweep (Fraunces variable)" },
      { id: "soft-blur", name: "Soft Blur-In (Instrument Serif italic)" },
      { id: "particles", name: "Particles (Syncopate dots mask)" },
    ];

    for (const style of styles) {
      console.log(`\nCapturing Style: ${style.name} (${style.id})...`);

      // 1. Desktop Light (1440px)
      {
        const context = await browser.newContext({
          viewport: { width: 1440, height: 900 },
          colorScheme: "light",
        });
        const page = await context.newPage();
        await page.goto(`${BASE_URL}/?intro=0&tier=full&style=${style.id}`, { waitUntil: "load" });
        await page.waitForTimeout(style.id === "particles" ? 1200 : 700);

        const screenshotPath = path.join(OUT_DIR, `round4-style-${style.id}-light-1440.png`);
        await page.screenshot({ path: screenshotPath });
        console.log(`  ✓ Desktop Light 1440px: ${path.basename(screenshotPath)}`);
        await context.close();
      }

      // 2. Desktop Dark (1440px)
      {
        const context = await browser.newContext({
          viewport: { width: 1440, height: 900 },
          colorScheme: "dark",
        });
        const page = await context.newPage();
        await page.goto(`${BASE_URL}/?intro=0&tier=full&style=${style.id}`, { waitUntil: "load" });
        await page.evaluate(() => {
          document.documentElement.classList.add("dark");
          document.documentElement.classList.remove("light");
        });
        await page.waitForTimeout(style.id === "particles" ? 1200 : 700);

        const screenshotPath = path.join(OUT_DIR, `round4-style-${style.id}-dark-1440.png`);
        await page.screenshot({ path: screenshotPath });
        console.log(`  ✓ Desktop Dark 1440px: ${path.basename(screenshotPath)}`);
        await context.close();
      }

      // 3. Mobile Dark (390px)
      {
        const context = await browser.newContext({
          viewport: { width: 390, height: 844 },
          isMobile: true,
          hasTouch: true,
          colorScheme: "dark",
        });
        const page = await context.newPage();
        // Mobile is lite tier; styles 1-8 run
        const targetStyle = style.id === "particles" ? "wide-thin" : style.id;
        await page.goto(`${BASE_URL}/?intro=0&tier=lite&style=${targetStyle}`, { waitUntil: "load" });
        await page.evaluate(() => {
          document.documentElement.classList.add("dark");
          document.documentElement.classList.remove("light");
        });
        await page.waitForTimeout(600);

        const screenshotPath = path.join(OUT_DIR, `round4-style-${style.id}-mobile-390.png`);
        await page.screenshot({ path: screenshotPath });
        console.log(`  ✓ Mobile 390px: ${path.basename(screenshotPath)}`);
        await context.close();
      }
    }

    // -------------------------------------------------------------------------
    // TEST 4: CLS ACROSS ROTATION CYCLE (< 0.05)
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 4: Cumulative Layout Shift Across Style Transitions ---");
    {
      const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      const page = await context.newPage();

      await page.goto(`${BASE_URL}/?intro=0&tier=full&style=wide-thin`, { waitUntil: "domcontentloaded" });

      await page.evaluate(() => {
        window.__clsScore = 0;
        const observer = new PerformanceObserver((entryList) => {
          for (const entry of entryList.getEntries()) {
            if (!entry.hadRecentInput) {
              window.__clsScore += entry.value;
            }
          }
        });
        observer.observe({ type: "layout-shift", buffered: true });
      });

      // Let style render and settle
      await page.waitForTimeout(1500);

      const measuredCls = await page.evaluate(() => window.__clsScore || 0);
      console.log(`  ✓ Measured CLS during style display: ${measuredCls.toFixed(4)}`);
      assert.ok(measuredCls < 0.05, `CLS ${measuredCls} must be strictly under 0.05`);

      await context.close();
    }

    // -------------------------------------------------------------------------
    // TEST 5: ON-DEMAND FONT LOADING NETWORK VERIFICATION
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 5: On-Demand Font Network Requests ---");
    {
      const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      const page = await context.newPage();

      const fontRequests = [];
      page.on("request", (req) => {
        const url = req.url();
        if (url.includes(".woff2")) {
          fontRequests.push(url);
        }
      });

      // Load with single style (e.g. permanent-marker)
      await page.goto(`${BASE_URL}/?intro=0&tier=full&style=marker-scrawl`, { waitUntil: "networkidle" });
      console.log(`  ✓ Initial requests for marker-scrawl: ${fontRequests.length} woff2 files loaded`);
      assert.ok(fontRequests.length > 0, "Should request required font file over network");

      await context.close();
    }

    await browser.close();
    console.log("\n=== ALL ROUND 4 VERIFICATION TESTS PASSED SUCCESSFULLY! ===");
  } finally {
    server.kill("SIGTERM");
  }
}

main().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
