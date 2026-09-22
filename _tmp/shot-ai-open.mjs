import fs from "node:fs";
const targets = await fetch("http://127.0.0.1:9333/json/list").then((r) => r.json());
const page = targets.find((t) => t.type === "page");
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolve) => ws.addEventListener("open", resolve));
let id = 0;
const pending = new Map();
function send(method, params = {}) {
  const msgId = ++id;
  ws.send(JSON.stringify({ id: msgId, method, params }));
  return new Promise((resolve, reject) => pending.set(msgId, { resolve, reject }));
}
ws.addEventListener("message", (event) => {
  const msg = JSON.parse(event.data);
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    if (msg.error) reject(new Error(JSON.stringify(msg.error)));
    else resolve(msg.result);
  }
});
await send("Runtime.enable");
await send("Page.enable");
await send("Runtime.evaluate", {
  expression: `document.querySelector('nf-ai-toggle button, .naf-shell__ai-toggle, button[aria-label*="assistant" i], button[aria-label*="Assistant"]')?.click() || document.querySelectorAll('button')[Array.from(document.querySelectorAll('button')).findIndex(b => (b.getAttribute('aria-label')||'').toLowerCase().includes('assistant'))]?.click()`,
});
await new Promise((r) => setTimeout(r, 500));
const opened = await send("Runtime.evaluate", {
  expression: `(() => {
    const btn = [...document.querySelectorAll('button')].find(b => /assistant|ia|ai/i.test(b.getAttribute('aria-label') || b.textContent || ''));
    btn?.click();
    const ai = document.querySelector('.nf-app-shell-ai-panel');
    const r = ai?.getBoundingClientRect();
    return { clicked: btn?.getAttribute('aria-label') || null, ai: r && { x: r.x, w: r.width, h: r.height, open: ai.classList.contains('is-open') } };
  })()`,
  returnByValue: true,
});
console.log(JSON.stringify(opened.result.value));
await new Promise((r) => setTimeout(r, 400));
const { data } = await send("Page.captureScreenshot", { format: "png" });
fs.writeFileSync("c:/nf/nafuralabs/_tmp/ai-open.png", Buffer.from(data, "base64"));
ws.close();
