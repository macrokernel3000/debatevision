import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm, stat } from "node:fs/promises";
import { extname, join, normalize, resolve } from "node:path";
import { tmpdir } from "node:os";

const root = resolve(import.meta.dirname, "..");
const port = 5189;
const chromePath = process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const modes = ["item-survival", "reality-summon", "sales-command", "metaphor-compass", "importance-duel", "where-am-i", "debate-board", "card-dictionary"];
const drawModes = new Set(modes.slice(0, 5));
const sizes = [{ width: 390, height: 844 }, { width: 768, height: 1024 }, { width: 1280, height: 800 }];
const mime = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".svg": "image/svg+xml" };

function serve() {
  return createServer(async (request, response) => {
    const pathname = decodeURIComponent(new URL(request.url, `http://127.0.0.1:${port}`).pathname);
    const target = normalize(join(root, pathname === "/" ? "website/index.html" : pathname));
    if (!target.startsWith(root)) { response.writeHead(403).end(); return; }
    try {
      const info = await stat(target);
      const file = info.isDirectory() ? join(target, "index.html") : target;
      response.writeHead(200, { "content-type": `${mime[extname(file)] || "application/octet-stream"}; charset=utf-8` });
      response.end(await readFile(file));
    } catch { response.writeHead(404).end("Not found"); }
  }).listen(port, "127.0.0.1");
}

async function connect(wsUrl) {
  const socket = new WebSocket(wsUrl);
  await new Promise((resolveOpen, reject) => { socket.onopen = resolveOpen; socket.onerror = reject; });
  let id = 0;
  const pending = new Map();
  socket.onmessage = ({ data }) => {
    const message = JSON.parse(data);
    if (!message.id) return;
    const handler = pending.get(message.id);
    if (!handler) return;
    pending.delete(message.id);
    message.error ? handler.reject(new Error(message.error.message)) : handler.resolve(message.result);
  };
  return {
    call(method, params = {}) {
      const callId = ++id;
      socket.send(JSON.stringify({ id: callId, method, params }));
      return new Promise((resolveCall, reject) => pending.set(callId, { resolve: resolveCall, reject }));
    },
    close: () => socket.close()
  };
}

async function waitFor(test, timeout = 5000) {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    if (await test()) return;
    await new Promise((resolveWait) => setTimeout(resolveWait, 80));
  }
  throw new Error("等待網站狀態逾時");
}

async function run() {
  const profile = await mkdtemp(join(tmpdir(), "debatevision-smoke-"));
  const server = serve();
  const chrome = spawn(chromePath, ["--headless=new", "--disable-gpu", "--no-first-run", `--user-data-dir=${profile}`, "--remote-debugging-port=9229", "about:blank"], { stdio: "ignore" });
  let cdp;
  try {
    await waitFor(async () => { try { return (await fetch("http://127.0.0.1:9229/json/version")).ok; } catch { return false; } });
    const page = await (await fetch("http://127.0.0.1:9229/json/new?about:blank", { method: "PUT" })).json();
    cdp = await connect(page.webSocketDebuggerUrl);
    await cdp.call("Page.enable"); await cdp.call("Runtime.enable");
    const evaluate = async (expression) => (await cdp.call("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true })).result.value;
    const issues = [];
    for (const size of sizes) {
      await cdp.call("Emulation.setDeviceMetricsOverride", { ...size, deviceScaleFactor: 1, mobile: size.width <= 560 });
      await cdp.call("Page.navigate", { url: `http://127.0.0.1:${port}/website/` });
      await waitFor(async () => evaluate("document.readyState === 'complete' && Boolean(window.DEBATE_MODES)") );
      for (const mode of modes) {
        const result = await evaluate(`(() => {
          const mobile = innerWidth <= 560;
          const trigger = document.querySelector(mobile ? '[data-mobile-home-mode="${mode}"]' : '[data-mode="${mode}"]');
          if (!trigger) return { missing: true };
          trigger.click();
          if (${drawModes.has(mode)} && mobile) document.querySelector('[data-mobile-draw]')?.click();
          if (${drawModes.has(mode)} && !mobile) document.querySelector('#drawButton')?.click();
          return {
            active: document.body.dataset.activeMode,
            overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
            desktopLeak: mobile && [...document.querySelectorAll('[data-ui-surface="desktop"]')].some((el) => el.getBoundingClientRect().width > 0),
            mobileLeak: !mobile && [...document.querySelectorAll('[data-ui-surface="mobile"]')].some((el) => el.getBoundingClientRect().width > 0),
            broken: [...document.images].filter((img) => img.complete && img.naturalWidth === 0).length,
            resultReady: !${drawModes.has(mode)} || (mobile ? Boolean(document.querySelector('#mobileResultActions')?.textContent.trim()) : Boolean(document.querySelector('#cardGrid')?.textContent.trim()))
          };
        })()`);
        for (const [key, bad] of [["missing", result.missing], ["active", result.active !== mode], ["overflow", result.overflow], ["desktopLeak", result.desktopLeak], ["mobileLeak", result.mobileLeak], ["broken", result.broken > 0], ["resultReady", !result.resultReady]]) {
          if (bad) issues.push(`${size.width}x${size.height} ${mode}: ${key}`);
        }
        if (size.width <= 560) await evaluate("document.querySelector('[data-mobile-nav=\"home\"]')?.click()");
      }
    }
    if (issues.length) throw new Error(`瀏覽器 smoke 失敗：\n- ${issues.join("\n- ")}`);
    console.log(`瀏覽器 smoke 通過：${sizes.length} 個尺寸 × ${modes.length} 個活動。`);
  } finally {
    cdp?.close(); chrome.kill(); server.close(); await rm(profile, { recursive: true, force: true });
  }
}

run().catch((error) => { console.error(error.message); process.exitCode = 1; });
