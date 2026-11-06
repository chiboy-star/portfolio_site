import { chromium } from "playwright";
import { spawn } from "child_process";

async function main() {
  const server = spawn("npx", ["next", "start", "-p", "3030", "-H", "127.0.0.1"], {
    shell: true,
    env: { ...process.env, NODE_ENV: "production" }
  });

  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch("http://127.0.0.1:3030");
      if (res.ok) break;
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }

  const browser = await chromium.launch({
    headless: true,
    args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-webgl"]
  });

  try {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 900 },
      colorScheme: "dark"
    });
    await page.goto("http://127.0.0.1:3030/?intro=0", { waitUntil: "load" });
    await page.evaluate(() => {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
      document.getElementById("work")?.scrollIntoView();
    });
    await page.waitForTimeout(1200);

    // Screenshot dark theme carousel
    await page.screenshot({ path: "artifacts/screenshots/fix3-carousel-dark-1440.png" });
    console.log("Saved fix3-carousel-dark-1440.png");

    // Click active card (first card before drag)
    await page.locator('#work button[aria-label^="View"]').first().click({ force: true });
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(800);
    await page.screenshot({ path: "artifacts/screenshots/fix3-project-sheet-open.png" });
    console.log("Saved fix3-project-sheet-open.png");
  } finally {
    await browser.close();
    server.kill();
  }
}

main().catch(console.error);
