# WhatsApp Web VoIP resources

These three files are WhatsApp Web's own calling engine, unmodified. They are
here because `lib/Voip/` runs that engine to place and join calls; nothing in
this directory was written, generated, minified, packed or encrypted by this
project.

| File | Size | SHA-256 |
|---|---|---|
| `whatsapp.wasm` | 9 819 554 B | `5f1350997c0bf3213782a7bdd3c846529d328552bfa7b87f10224f021346ce35` |
| `loader.js` | 155 436 B | `f26ed41f30313d790b3022476b7e88c6d99941909c30d0a35c15619d98826bad` |
| `worker-modules.js` | 826 071 B | `4f52cd02c8310a19820176362d292687b02c4a9cf81cc78fbf8e5cc4a28f4e99` |

Verify with `sha256sum lib/assets/wasm/*`.

## Why a scanner may flag them

`loader.js` and `worker-modules.js` are minified browser bundles, and
`whatsapp.wasm` is a 9 MB binary, so a supply-chain scanner will call this
directory obfuscated code plus a large binary blob. That is a description of
the shape, not a finding. What matters is what the code can reach, and that is
checkable:

- **No dynamic code execution of its own.** Neither bundle contains `eval(` or
  `new Function`. The one `require(` in `worker-modules.js` is
  `window.top.require(...)`, a browser-side Facebook module registry lookup.
- **No child processes, no `process.env` reads.**
- **No outbound endpoints.** The only URLs in either file are documentation and
  legal links (`emscripten.org`, `facebook.com/legal/...`).
- **The WASM cannot reach the network.** Its imports are 216 `env` callbacks
  and 7 `wasi_snapshot_preview1` entries. The two that carry traffic —
  `sendSignalingXMPP_js_sync` and `call_sendto` — are calls *into* JavaScript:
  the module hands bytes to `lib/Voip/signaling.js` and
  `lib/Voip/relay-transport.js`, which send them over the WhatsApp socket the
  bot already authenticated. The module opens no socket itself.
- The `fetch` and `XMLHttpRequest` occurrences are emscripten's own loader
  paths for fetching a `.wasm` over HTTP in a browser. `lib/Voip/wasm-engine.js`
  hands the bytes over from disk, so those branches never run here.

What this project does around them is worth knowing too, because it is what a
scanner will attribute to the package: `wasm-engine.js` runs the loader inside
a `node:vm` context with a `worker_threads` pool, and `audio-feeder.js` spawns
`ffmpeg` to decode outgoing audio. Both are inherent to running a WebRTC engine
outside a browser.

## Refreshing them

They come from a logged-in WhatsApp Web session:
`WAWebVoipWebWasmWorkerResource` names the worker bundle URL, and the WASM sits
behind a `bx` resource id that only resolves once the page has booted, so the
fetch needs a real browser rather than a plain HTTP request. Replace all three
together — a `loader.js` from one release and a `worker-modules.js` from
another will not agree on bindings — and update the table above.
