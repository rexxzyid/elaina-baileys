/**
 * Fetch fresh WASM resources from a running WhatsApp Web browser instance.
 * Requires Chrome with remote debugging enabled on port 9222.
 *
 * Usage: node --experimental-websocket scripts/fetch-wasm-resources.mjs
 */
import { writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const RESOURCES_DIR = resolve(__dirname, "../src/lib/wasm-resources");
const DEBUGGER_URL = process.env.CALL_CHROME_DEBUGGER_JSON_URL || "http://127.0.0.1:9222/json/list";
const WASM_ID = process.env.CALL_BROWSER_WASM_ID || "32180";

async function main() {
  // Get page target
  const resp = await fetch(DEBUGGER_URL);
  const targets = await resp.json();
  const page = targets.find(t => t.type === "page" && t.url?.includes("web.whatsapp.com"));
  if (!page?.webSocketDebuggerUrl) throw new Error("No WhatsApp Web page found");

  // Connect via CDP
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let id = 1;
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const myId = id++;
    const handler = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id === myId) {
        ws.removeEventListener("message", handler);
        if (msg.error) reject(new Error(msg.error.message));
        else resolve(msg.result);
      }
    };
    ws.addEventListener("message", handler);
    ws.send(JSON.stringify({ id: myId, method, params }));
  });
  const evaluate = async (expression) => {
    const result = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.text || "eval error");
    return result.result.value;
  };

  await new Promise(r => ws.addEventListener("open", r));

  // Get resource URLs from browser
  const resourceInfo = await evaluate(`(() => {
    try {
      const resource = require("WAWebVoipWebWasmWorkerResource");
      return {
        workerUrl: resource?.url || null,
        wasmUrl: resource?.hsdp?.bxData?.["${WASM_ID}"]?.uri || null,
        availableIds: Object.keys(resource?.hsdp?.bxData || {}),
      };
    } catch(e) { return { error: e.message }; }
  })()`);

  if (resourceInfo.error) throw new Error(`Browser eval failed: ${resourceInfo.error}`);
  if (!resourceInfo.workerUrl) throw new Error("Worker URL not found in browser");
  if (!resourceInfo.wasmUrl) {
    console.log("Available WASM IDs:", resourceInfo.availableIds);
    throw new Error(`WASM URL not found for ID ${WASM_ID}`);
  }

  console.log("Fetching worker-modules.js from:", resourceInfo.workerUrl);
  const workerResp = await fetch(resourceInfo.workerUrl);
  const workerCode = await workerResp.text();
  writeFileSync(resolve(RESOURCES_DIR, "worker-modules.js"), workerCode);
  console.log(`  Written: worker-modules.js (${workerCode.length} bytes)`);

  console.log("Fetching whatsapp.wasm from:", resourceInfo.wasmUrl);
  const wasmResp = await fetch(resourceInfo.wasmUrl);
  const wasmBuffer = Buffer.from(await wasmResp.arrayBuffer());
  writeFileSync(resolve(RESOURCES_DIR, "whatsapp.wasm"), wasmBuffer);
  console.log(`  Written: whatsapp.wasm (${wasmBuffer.length} bytes)`);

  ws.close();
  console.log("\nDone! Resources updated.");
  process.exit(0);
}

main().catch(e => { console.error("Error:", e.message); process.exit(1); });
