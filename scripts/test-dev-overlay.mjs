import { spawn } from "child_process";
import { chromium } from "playwright";
import assert from "assert";

async function waitForServer(url, timeout = 45000) {
  const start = Date.now();
  let lastErr = null;
  while (Date.now() - start < timeout) {
    try {
      const res = await fetch(url);
      if (res.status < 500) {
        console.log(`Server responded with status ${res.status}`);
        return true;
      }
    } catch (e) {
      lastErr = e;
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`Server did not respond within ${timeout}ms at ${url}: ${lastErr?.message || lastErr}`);
}

async function main() {
  console.log("=== DIAGNOSING DEV OVERLAY & CONSOLE ISSUES ===");
  const PORT = 3058;
  const BASE_URL = `http://127.0.0.1:${PORT}`;

  const devServer = spawn("npx", ["next", "dev", "-p", String(PORT), "-H", "127.0.0.1"], {
    shell: true,
    stdio: "inherit",
    env: { ...process.env, PORT: String(PORT) },
  });

  try {
    await waitForServer(BASE_URL);
    console.log(`Dev server ready at ${BASE_URL}`);

    const browser = await chromium.launch({
      headless: true,
      args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-webgl"],
    });

    const tiers = ["full", "lite", "minimal"];

    for (const tier of tiers) {
      console.log(`\nTesting in development with ?tier=${tier}...`);
      const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      const page = await context.newPage();

      const errorsAndWarnings = [];

      page.on("console", (msg) => {
        const type = msg.type();
        const text = msg.text();
        if (text.includes("GL Driver Message")) return;
        if (type === "error" || type === "warning") {
          errorsAndWarnings.push(`[Console ${type}] ${text}`);
        }
      });

      page.on("pageerror", (err) => {
        errorsAndWarnings.push(`[PageError] ${err.message}`);
      });

      await page.goto(`${BASE_URL}/?tier=${tier}`, { waitUntil: "load" });
      await page.waitForTimeout(3000);

      // Trigger intro replay
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent("intro:replay"));
      });
      await page.waitForTimeout(2000);

      // Check if nextjs dev overlay has issues
      const issueDetails = await page.evaluate(() => {
        const portal = document.querySelector("nextjs-portal");
        if (!portal || !portal.shadowRoot) return null;
        const badge = portal.shadowRoot.querySelector("[data-nextjs-dialog-header], [data-nextjs-toast]");
        const textNodes = Array.from(portal.shadowRoot.querySelectorAll("*"))
          .map((e) => e.innerText || e.textContent)
          .filter((t) => t && (t.includes("issue") || t.includes("Error") || t.includes("Warning")));
        return {
          hasBadge: !!badge,
          texts: [...new Set(textNodes)],
        };
      });

      console.log(`  Tier: ${tier}`);
      console.log(`  Errors/Warnings count: ${errorsAndWarnings.length}`);
      if (errorsAndWarnings.length > 0) {
        console.error("  Reported console errors/warnings:", errorsAndWarnings);
      }
      console.log("  Overlay issue details:", issueDetails);

      assert.strictEqual(
        errorsAndWarnings.length,
        0,
        `Tier ${tier} had console errors or warnings: ${JSON.stringify(errorsAndWarnings)}`
      );

      await context.close();
    }

    await browser.close();
    console.log("\n=== DEV OVERLAY CHECK PASSED: ZERO ISSUES ===");
  } finally {
    try {
      if (devServer && devServer.pid) {
        spawn("taskkill", ["/PID", String(devServer.pid), "/T", "/F"], { shell: true });
      }
    } catch {}
  }
}

main().catch((e) => {
  console.error("Diagnosis failed:", e);
  process.exit(1);
});
