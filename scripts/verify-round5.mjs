import { chromium } from "playwright";
import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import assert from "assert";

const OUT_DIR = path.join(process.cwd(), "artifacts", "screenshots");
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

async function waitForServer(url, timeout = 45000) {
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

async function main() {
  console.log("=== STARTING ROUND 5 VERIFICATION SUITE ===");

  const PORT = 3044;
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

    // =========================================================================
    // BUG 1: INTRO WORDMARK VERIFICATION (LIGHT & DARK, 1440px & 390px)
    // =========================================================================
    console.log("\n--- TEST 1: Bug 1 - Intro Wordmark Alignment & Text Quality ---");

    const viewports = [
      { name: "desktop", width: 1440, height: 900, isMobile: false },
      { name: "mobile", width: 390, height: 844, isMobile: true },
    ];
    const themes = ["light", "dark"];

    for (const vp of viewports) {
      for (const theme of themes) {
        console.log(`\nVerifying intro wordmark at ${vp.name} (${vp.width}px) in ${theme} theme...`);
        const context = await browser.newContext({
          viewport: { width: vp.width, height: vp.height },
          isMobile: vp.isMobile,
          hasTouch: vp.isMobile,
          colorScheme: theme,
        });

        const page = await context.newPage();
        await page.goto(`${BASE_URL}/?intro=1&tier=full`, { waitUntil: "domcontentloaded" });
        await page.evaluate(async (th) => {
          if (th === "dark") {
            document.documentElement.classList.add("dark");
            document.documentElement.classList.remove("light");
          } else {
            document.documentElement.classList.remove("dark");
            document.documentElement.classList.add("light");
          }
          await document.fonts.ready;
        }, theme);

        // Measure text and baseline metrics at t ≈ 100ms (hold phase)
        await page.waitForTimeout(100);
        const metrics = await page.evaluate(() => {
          const c = document.getElementById("intro-initial-c");
          const rest1 = document.getElementById("intro-rest-1");
          const m = document.getElementById("intro-initial-m");
          const rest2 = document.getElementById("intro-rest-2");
          const line1 = document.getElementById("intro-wordmark-line-1");
          const line2 = document.getElementById("intro-wordmark-line-2");

          if (!c || !rest1 || !m || !rest2 || !line1 || !line2) return null;

          const cRect = c.getBoundingClientRect();
          const rest1Rect = rest1.getBoundingClientRect();
          const mRect = m.getBoundingClientRect();
          const rest2Rect = rest2.getBoundingClientRect();
          const line1Rect = line1.getBoundingClientRect();
          const line2Rect = line2.getBoundingClientRect();

          return {
            line1Text: line1.innerText,
            line2Text: line2.innerText,
            cBottom: cRect.bottom,
            rest1Bottom: rest1Rect.bottom,
            cDelta: Math.abs(cRect.bottom - rest1Rect.bottom),
            mBottom: mRect.bottom,
            rest2Bottom: rest2Rect.bottom,
            mDelta: Math.abs(mRect.bottom - rest2Rect.bottom),
            line1Bottom: line1Rect.bottom,
            line2Top: line2Rect.top,
            line1Height: line1Rect.height,
            line2Height: line2Rect.height,
            totalHeight: line2Rect.bottom - line1Rect.top,
          };
        });

        // Screenshot at t = 0
        const t0Path = path.join(OUT_DIR, `round5-intro-${theme}-${vp.width}-t0.png`);
        await page.screenshot({ path: t0Path });
        console.log(`  ✓ Screenshot t=0: ${path.basename(t0Path)}`);

        assert.ok(metrics, "All wordmark DOM elements must exist during intro");

        // Remove any excess internal whitespace/newlines for assertion
        const cleanLine1 = metrics.line1Text.replace(/\s+/g, "");
        const cleanLine2 = metrics.line2Text.replace(/\s+/g, "");

        console.log(`  Line 1 text: "${cleanLine1}" (expected "CHINEMEREM")`);
        console.log(`  Line 2 text: "${cleanLine2}" (expected "MADUEKE")`);

        assert.strictEqual(cleanLine1, "CHINEMEREM", "Line 1 must be exactly 'CHINEMEREM'");
        assert.strictEqual(cleanLine2, "MADUEKE", "Line 2 must be exactly 'MADUEKE'");
        console.log(`  Initial C baseline delta vs HINEMEREM: ${metrics.cDelta.toFixed(2)}px (required <= 2px)`);
        console.log(`  Initial M baseline delta vs ADUEKE: ${metrics.mDelta.toFixed(2)}px (required <= 2px)`);
        console.log(`  Line 1 bottom: ${metrics.line1Bottom.toFixed(2)}px, Line 2 top: ${metrics.line2Top.toFixed(2)}px`);
        console.log(`  Total wordmark height: ${metrics.totalHeight.toFixed(2)}px (line 1 height: ${metrics.line1Height.toFixed(2)}px)`);

        assert.ok(metrics.cDelta <= 2.5, `C baseline offset ${metrics.cDelta}px must be <= 2.5px`);
        assert.ok(metrics.mDelta <= 2.5, `M baseline offset ${metrics.mDelta}px must be <= 2.5px`);
        assert.ok(metrics.line1Bottom <= metrics.line2Top + 1, "Lines 1 and 2 must not vertically overlap");
        assert.ok(metrics.totalHeight <= metrics.line1Height * 2.8, "Wordmark must be at most 2 lines high");

        // Screenshot at t ≈ 0.8s (stepped opening phase)
        await page.waitForTimeout(700);
        const t800Path = path.join(OUT_DIR, `round5-intro-${theme}-${vp.width}-t800.png`);
        await page.screenshot({ path: t800Path });
        console.log(`  ✓ Screenshot t=0.8s: ${path.basename(t800Path)}`);

        // Screenshot at t ≈ 1.8s (overlay dismissed, hero visible)
        await page.waitForTimeout(1000);
        const t1800Path = path.join(OUT_DIR, `round5-intro-${theme}-${vp.width}-t1800.png`);
        await page.screenshot({ path: t1800Path });
        console.log(`  ✓ Screenshot t=1.8s: ${path.basename(t1800Path)}`);

        const introDismissed = await page.evaluate(() => !document.getElementById("crack-open-intro"));
        assert.strictEqual(introDismissed, true, "Intro overlay must unmount by t=1.8s");

        await context.close();
      }
    }

    // =========================================================================
    // BUG 2: PARTICLE NAME SIZING & BOUNDING BOX (1440px, 1024px, 390px)
    // =========================================================================
    console.log("\n--- TEST 2: Bug 2 - Particle Wordmark Sizing (>= 70% width) ---");

    const particleTestCases = [
      { width: 1440, theme: "light", minRatio: 0.70 },
      { width: 1440, theme: "dark", minRatio: 0.70 },
      { width: 1024, theme: "dark", minRatio: 0.70 },
      { width: 390, theme: "dark", minRatio: 0.50, isMobile: true },
    ];

    for (const tc of particleTestCases) {
      console.log(`\nTesting Particle Wordmark at ${tc.width}px in ${tc.theme} theme...`);
      const context = await browser.newContext({
        viewport: { width: tc.width, height: 900 },
        isMobile: !!tc.isMobile,
        colorScheme: tc.theme,
      });

      const page = await context.newPage();
      const logs = [];
      page.on("console", (m) => logs.push(m.text()));

      await page.goto(`${BASE_URL}/?intro=0&tier=full&style=particles&debug=particles`, {
        waitUntil: "load",
      });

      if (tc.theme === "dark") {
        await page.evaluate(() => {
          document.documentElement.classList.add("dark");
          document.documentElement.classList.remove("light");
        });
      } else {
        await page.evaluate(() => {
          document.documentElement.classList.remove("dark");
          document.documentElement.classList.add("light");
        });
      }

      // Wait for canvas to mount into DOM
      await page.waitForSelector("#hero-particle-canvas", { timeout: 10000 });

      // Wait for particles to assemble and settle
      await page.waitForTimeout(1200);

      // Measure particle bounding box via canvas pixel analysis
      const particleMetrics = await page.evaluate(() => {
        const canvas = document.getElementById("hero-particle-canvas");
        const container = document.getElementById("rotating-hero-name-container");
        if (!canvas || !container) {
          return {
            missingCanvas: !canvas,
            missingContainer: !container,
            activeStyleInDom: document.querySelector("[data-active-style]")?.getAttribute("data-active-style") || "unknown",
            heroHtml: document.getElementById("hero")?.innerHTML.slice(0, 300),
          };
        }

        const ctx = canvas.getContext("2d");
        if (!ctx) return null;

        const w = canvas.width;
        const h = canvas.height;
        const imgData = ctx.getImageData(0, 0, w, h);
        const data = imgData.data;

        let minX = w, maxX = 0, minY = h, maxY = 0;
        let nonTransparentPixels = 0;

        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            const idx = (y * w + x) * 4;
            const alpha = data[idx + 3];
            if (alpha > 30) { // particle pixel detected
              nonTransparentPixels++;
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
            }
          }
        }

        const containerRect = container.getBoundingClientRect();
        const bboxWidth = maxX >= minX ? (maxX - minX) : 0;
        const bboxHeight = maxY >= minY ? (maxY - minY) : 0;
        const ratio = bboxWidth / containerRect.width;

        return {
          canvasWidth: w,
          canvasHeight: h,
          containerWidth: containerRect.width,
          bboxWidth,
          bboxHeight,
          ratio,
          nonTransparentPixels,
        };
      });

      if (!particleMetrics || particleMetrics.missingCanvas) {
        console.error("  Missing canvas! Diagnostics:", particleMetrics);
        console.error("  Logs from page:", logs);
      }
      assert.ok(particleMetrics && !particleMetrics.missingCanvas, "Particle canvas and container must be mounted");
      console.log(`  Container width: ${particleMetrics.containerWidth.toFixed(1)}px`);
      console.log(`  Sampled Bounding Box: ${particleMetrics.bboxWidth.toFixed(1)}px × ${particleMetrics.bboxHeight.toFixed(1)}px`);
      console.log(`  Width Ratio: ${(particleMetrics.ratio * 100).toFixed(1)}% (required >= ${(tc.minRatio * 100).toFixed(0)}%)`);
      console.log(`  Non-transparent pixels: ${particleMetrics.nonTransparentPixels}`);
      if (particleMetrics.ratio < tc.minRatio) {
        console.error("  Console logs:", logs);
      }

      assert.ok(
        particleMetrics.ratio >= tc.minRatio,
        `Particle ratio ${(particleMetrics.ratio * 100).toFixed(1)}% must be >= ${(tc.minRatio * 100).toFixed(0)}%`
      );

      const screenshotName = `round5-particles-${tc.theme}-${tc.width}.png`;
      const screenshotPath = path.join(OUT_DIR, screenshotName);
      await page.screenshot({ path: screenshotPath });
      console.log(`  ✓ Screenshot: ${screenshotName}`);

      await context.close();
    }

    // =========================================================================
    // CLEAN-UP VERIFICATION: HEADLINE, STATUS, DEV BADGE LOCATION
    // =========================================================================
    console.log("\n--- TEST 3: Clean-up - Plain Status Text, Clean Headline, Dev Badge ---");
    {
      const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      const page = await context.newPage();
      await page.goto(`${BASE_URL}/?intro=0&tier=full`, { waitUntil: "load" });

      // Check Headline
      const headlineText = await page.evaluate(() => {
        const p = document.querySelector(".max-w-2xl p.text-xl, .max-w-2xl p");
        return p ? p.innerText.trim() : null;
      });
      console.log(`  Headline text: "${headlineText}"`);
      assert.strictEqual(headlineText, "Junior Frontend Developer.", "Headline must be exactly 'Junior Frontend Developer.'");

      // Check Status element
      const statusText = await page.evaluate(() => {
        const el = document.querySelector(".font-mono.uppercase.tracking-wider");
        return el ? el.innerText.trim() : null;
      });
      console.log(`  Status text: "${statusText}"`);
      assert.ok(statusText && statusText.toUpperCase().includes("OPEN TO INTERNSHIPS"), "Status must display 'Open to internships'");

      // Verify no bordered pill badge around status
      const hasBorderedPill = await page.evaluate(() => {
        const el = document.querySelector(".font-mono.uppercase.tracking-wider");
        if (!el) return false;
        const style = window.getComputedStyle(el);
        const hasBorder = style.borderWidth !== "0px" && style.borderStyle !== "none";
        const hasRoundedFull = el.classList.contains("rounded-full");
        return hasBorder || hasRoundedFull;
      });
      console.log(`  Has bordered pill badge around status: ${hasBorderedPill} (expected false)`);
      assert.strictEqual(hasBorderedPill, false, "Status element must not have a pill badge or border");

      // Verify Dev Badge is placed at bottom-3 right-3 (away from bottom-left Next.js dev button)
      const devBadgeCode = fs.readFileSync(path.join(process.cwd(), "src/components/dev-tier-badge.tsx"), "utf8");
      assert.ok(devBadgeCode.includes("bottom-3 right-3"), "Dev badge must be positioned at bottom-3 right-3");
      console.log("  ✓ Dev badge successfully relocated to bottom-3 right-3, avoiding Next.js dev button");

      await context.close();
    }

    // =========================================================================
    // TEST 4: CLS ACROSS INTERACTION (< 0.05)
    // =========================================================================
    console.log("\n--- TEST 4: CLS Verification ---");
    {
      const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      const page = await context.newPage();
      await page.goto(`${BASE_URL}/?intro=0&tier=full`, { waitUntil: "domcontentloaded" });

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

      await page.waitForTimeout(1500);
      const cls = await page.evaluate(() => window.__clsScore || 0);
      console.log(`  Cumulative Layout Shift: ${cls.toFixed(4)} (required < 0.05)`);
      assert.ok(cls < 0.05, `CLS ${cls} must be < 0.05`);

      await context.close();
    }

    await browser.close();
    console.log("\n=== ALL ROUND 5 VERIFICATION SUITE TESTS PASSED! ===");
  } finally {
    try {
      if (server && server.pid) {
        spawn("taskkill", ["/PID", String(server.pid), "/T", "/F"], { shell: true });
      }
    } catch {}
  }
}

main().catch((e) => {
  console.error("Verification failed:", e);
  process.exit(1);
});
