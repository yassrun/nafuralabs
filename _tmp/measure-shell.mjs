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
const expr = `(() => {
  const shell = document.querySelector('.nf-app-shell');
  const pick = (sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    return { sel, x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), display: s.display, bg: s.backgroundColor };
  };
  return {
    viewport: { w: innerWidth, h: innerHeight },
    shell: pick('.nf-app-shell'),
    classes: shell?.className,
    railHost: pick('nf-app-shell-context-rail'),
    rail: pick('.nf-context-rail'),
    sideHost: pick('nf-app-shell-sidebar'),
    side: pick('.nf-app-shell-sidebar'),
    top: pick('.nf-app-shell-top-bar'),
    main: pick('.nf-app-shell__content'),
    ai: pick('.nf-app-shell-ai-panel'),
  };
})()`;
const res = await send("Runtime.evaluate", { expression: expr, returnByValue: true });
console.log(JSON.stringify(res.result.value, null, 2));
ws.close();
