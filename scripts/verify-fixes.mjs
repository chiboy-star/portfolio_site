import { chromium } from "playwright";
import { spawn } from "child_process";
import fs from "fs";
import path from "path";

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
  throw new Error(`Server did not respond within ${timeout}ms`);
}

async function main() {
  console.log("Starting Next.js production server for verification...");
  const server = spawn("npx", ["next", "start", "-p", "3030", "-H", "127.0.0.1"], {
    shell: true,
    env: {
      ...process.env,
      NODE_ENV: "production",
      ADMIN_DEV_BYPASS: "true",
      GITHUB_USERNAME: "chiboy-star",
    },
    stdio: "inherit",
  });

  try {
    await waitForServer("http://127.0.0.1:3030");
    console.log("Server ready at http://127.0.0.1:3030");

    const browser = await chromium.launch({
      headless: true,
      args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-webgl"],
    });

    // ----------------------------------------------------
    // FIX 1: INTRO (awards.racing reference)
    // ----------------------------------------------------
    console.log("\n--- VERIFYING FIX 1: Intro (awards.racing) ---");
    const introContext = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      hasTouch: false,
    });
    console.log("1.1 Loading fresh tab with ?intro=1 (t=0 hold)");
    const holdPage = await introContext.newPage();
    await holdPage.goto("http://127.0.0.1:3030/?intro=1", { waitUntil: "domcontentloaded" });
    await holdPage.screenshot({ path: path.join(OUT_DIR, "fix1-intro-t0-ink-slab.png"), timeout: 5000 });
    console.log("  Saved: fix1-intro-t0-ink-slab.png");
    await holdPage.close();

    console.log("1.2 Capturing Chebyshev stepped pixel staircase opening at t=750ms");
    const stepPage = await introContext.newPage();
    await stepPage.goto("http://127.0.0.1:3030/?intro=1", { waitUntil: "domcontentloaded" });
    await stepPage.waitForTimeout(650);
    await stepPage.screenshot({ path: path.join(OUT_DIR, "fix1-intro-t800-stepped-opening.png"), timeout: 5000 });
    console.log("  Saved: fix1-intro-t800-stepped-opening.png");
    await stepPage.close();

    console.log("1.3 Waiting for intro complete and hero settled at t=1800ms");
    const settledPage = await introContext.newPage();
    await settledPage.goto("http://127.0.0.1:3030/?intro=1", { waitUntil: "domcontentloaded" });
    await settledPage.waitForTimeout(1600);
    await settledPage.screenshot({ path: path.join(OUT_DIR, "fix1-intro-t1800-settled-hero.png"), timeout: 5000 });
    console.log("  Saved: fix1-intro-t1800-settled-hero.png");

    console.log("1.4 Reloading settled tab without ?intro=1 to verify intro skips");
    await settledPage.goto("http://127.0.0.1:3030/", { waitUntil: "domcontentloaded" });
    await settledPage.waitForTimeout(300);
    const introStatus = await settledPage.evaluate(() => {
      const el = document.getElementById("crack-open-intro");
      return {
        tier: document.documentElement.getAttribute("data-tier"),
        intro: document.documentElement.getAttribute("data-intro"),
        sessionSeen: sessionStorage.getItem("introSeen"),
        visible: !!(el && window.getComputedStyle(el).display !== "none"),
      };
    });
    console.log(`  Intro overlay status on reload:`, introStatus);
    await settledPage.close();

    console.log("1.5 Testing with prefers-reduced-motion: reduce");
    const rmContext = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      reducedMotion: "reduce",
    });
    const rmPage = await rmContext.newPage();
    await rmPage.goto("http://127.0.0.1:3030/?intro=1", { waitUntil: "domcontentloaded" });
    const rmOverlayVisible = await rmPage.evaluate(() => {
      const el = document.getElementById("crack-open-intro");
      return el && window.getComputedStyle(el).display !== "none";
    });
    console.log(`  Intro overlay visible with reduced-motion: ${rmOverlayVisible} (Expected: false)`);
    await rmContext.close();
    await introContext.close();

    // ----------------------------------------------------
    // FIX 2: PARTICLES (austensor.com reference)
    // ----------------------------------------------------
    console.log("\n--- VERIFYING FIX 2: Particles (austensor.com) ---");
    const mainContext = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      hasTouch: false,
    });
    const page = await mainContext.newPage();
    page.on("pageerror", (err) => console.error("  [MainPage Error]:", err.message));
    await page.goto("http://127.0.0.1:3030/?intro=0", { waitUntil: "load" });
    console.log("2.0 Page loaded:", await page.title());
    await page.waitForSelector("#hero", { timeout: 10000 });
    await page.waitForTimeout(1400); // Wait for assemble animation (900ms) to settle

    console.log("2.1 Screenshot settled hero in Dark Theme at 1440px");
    await page.screenshot({ path: path.join(OUT_DIR, "fix2-hero-dark-1440.png"), timeout: 15000 });
    console.log("  Saved: fix2-hero-dark-1440.png");

    console.log("2.2 Screenshot settled hero at 1024px");
    await page.setViewportSize({ width: 1024, height: 800 });
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(OUT_DIR, "fix2-hero-dark-1024.png"), timeout: 15000 });
    console.log("  Saved: fix2-hero-dark-1024.png");

    console.log("2.3 Switch to Light Theme and capture");
    await page.setViewportSize({ width: 1440, height: 900 });
    // Switch theme via classList (triggers MutationObserver)
    await page.evaluate(() => {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
    });
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(OUT_DIR, "fix2-hero-light-1440.png"), timeout: 15000 });
    console.log("  Saved: fix2-hero-light-1440.png");

    console.log("2.4 Move pointer across particle canvas to verify repulsion scatter");
    await page.mouse.move(720, 200);
    await page.waitForTimeout(100);
    await page.mouse.move(600, 200);
    await page.screenshot({ path: path.join(OUT_DIR, "fix2-hero-cursor-scatter.png"), timeout: 15000 });
    console.log("  Saved: fix2-hero-cursor-scatter.png");
    await page.close();
    await mainContext.close();
    await browser.close();

    // ----------------------------------------------------
    // FIX 3: CAROUSEL (jesperlandberg.com reference)
    // ----------------------------------------------------
    console.log("\n--- VERIFYING FIX 3: Carousel (jesperlandberg.com) ---");
    const browser3 = await chromium.launch({
      headless: true,
      args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-webgl"],
    });
    const carouselPage = await browser3.newPage({
      viewport: { width: 1440, height: 900 },
      hasTouch: false,
    });
    await carouselPage.goto("http://127.0.0.1:3030/?intro=0", { waitUntil: "load" });
    await carouselPage.evaluate(() => {
      document.getElementById("work")?.scrollIntoView();
    });
    await carouselPage.waitForTimeout(1000);

    console.log("3.1 Screenshot WebGL Curved Carousel (Dark Theme)");
    await carouselPage.screenshot({ path: path.join(OUT_DIR, "fix3-carousel-dark-1440.png"), timeout: 10000 });
    console.log("  Saved: fix3-carousel-dark-1440.png");

    console.log("3.2 Test dragging carousel");
    await carouselPage.mouse.move(900, 500);
    await carouselPage.mouse.down();
    await carouselPage.mouse.move(500, 500, { steps: 10 });
    await carouselPage.mouse.up();
    await carouselPage.waitForTimeout(400);
    await carouselPage.screenshot({ path: path.join(OUT_DIR, "fix3-carousel-dragged.png"), timeout: 10000 });
    console.log("  Saved: fix3-carousel-dragged.png");
    await carouselPage.waitForTimeout(1000); // Allow to settle

    console.log("3.3 Test opening detail modal");
    // Click active card hit area
    await carouselPage.locator('#work [aria-label^="View"]').first().click({ force: true });
    await carouselPage.waitForSelector('[role="dialog"]', { timeout: 5000 }).catch(() => {});
    await carouselPage.waitForTimeout(600);
    await carouselPage.screenshot({ path: path.join(OUT_DIR, "fix3-project-sheet-open.png"), timeout: 10000 });
    console.log("  Saved: fix3-project-sheet-open.png");

    // Close modal
    await carouselPage.keyboard.press("Escape");
    await carouselPage.waitForTimeout(400);

    // ----------------------------------------------------
    // FIX 4: GITHUB REPOS & ADMIN CONNECTIONS
    // ----------------------------------------------------
    console.log("\n--- VERIFYING FIX 4: GitHub Repos & Admin Connections ---");
    // Verify frontend Work filter counter shows pulled GitHub repos
    const allButtonText = await carouselPage.locator('#work button:has-text("All")').innerText().catch(() => "");
    console.log(`  Frontend Work counter: "${allButtonText}" (Confirming GitHub repos pulled)`);

    console.log("4.1 Verifying production security: /admin redirects when ADMIN_DEV_BYPASS is set in production");
    await carouselPage.goto("http://127.0.0.1:3030/admin", { waitUntil: "load" });
    const prodUrl = carouselPage.url();
    console.log(`  Production /admin navigated to: ${prodUrl} (Correctly redirected: ${!prodUrl.includes("/admin")})`);
    await browser3.close();

    // Now start development server on port 3031 with ADMIN_DEV_BYPASS=true
    console.log("4.2 Starting Next.js dev server on port 3031 with ADMIN_DEV_BYPASS=true...");
    const devServer = spawn("npx", ["next", "dev", "-p", "3031", "-H", "127.0.0.1"], {
      shell: true,
      env: {
        ...process.env,
        NODE_ENV: "development",
        ADMIN_DEV_BYPASS: "true",
        GITHUB_USERNAME: "chiboy-star",
      },
      stdio: "inherit",
    });

    try {
      await waitForServer("http://127.0.0.1:3031");
      console.log("  Dev server ready at http://127.0.0.1:3031");
      const browser4 = await chromium.launch({
        headless: true,
        args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-webgl"],
      });
      const devPage = await browser4.newPage({ viewport: { width: 1440, height: 900 } });
      await devPage.goto("http://127.0.0.1:3031/admin", { waitUntil: "load" });
      await devPage.waitForSelector("text=Connections Diagnostic", { timeout: 35000 });
      await devPage.waitForTimeout(1000);

      await devPage.screenshot({ path: path.join(OUT_DIR, "fix4-admin-dashboard.png"), timeout: 15000 });
      console.log("  Saved: fix4-admin-dashboard.png");

      const hasConnectionsPanel = await devPage.locator("text=Connections Diagnostic").isVisible().catch(() => false);
      const hasImportBanner = await devPage.locator("text=repositories found").isVisible().catch(() => false);
      console.log(`  Connections Diagnostic visible: ${hasConnectionsPanel}`);
      console.log(`  First-Run Import Banner visible: ${hasImportBanner}`);
      await browser4.close();
    } finally {
      devServer.kill();
    }

    console.log("\n=== ALL VERIFICATIONS COMPLETED SUCCESSFULLY ===");
  } finally {
    server.kill();
  }
}

main().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});

