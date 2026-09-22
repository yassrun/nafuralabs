import fs from "node:fs";
const base = "http://127.0.0.1:4300";
const users = await fetch("http://127.0.0.1:8082/api/public/sandbox/users").then((r) => r.json());
const session = await fetch("http://127.0.0.1:8082/api/public/sandbox/session", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ email: users[0].email }),
}).then((r) => r.json());
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
await send("Page.enable");
await send("Runtime.enable");
await send("Page.navigate", { url: base + "/" });
await new Promise((r) => setTimeout(r, 600));
await send("Runtime.evaluate", {
  expression: `sessionStorage.setItem('sandbox.lab.session', ${JSON.stringify(JSON.stringify(session))}); location.href='${base}/';`,
});
await new Promise((r) => setTimeout(r, 1500));
await send("Runtime.evaluate", {
  expression: `document.querySelector('.nf-app-shell-top-bar-menu-button')?.click()`,
});
await new Promise((r) => setTimeout(r, 400));
const clicked = await send("Runtime.evaluate", {
  expression: `(() => {
    const side = document.querySelector('nf-app-shell-sidebar');
    const r = side?.getBoundingClientRect();
    return {
      drawer: side?.classList.contains('is-drawer') ?? false,
      box: r && { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
      text: side?.innerText?.slice(0, 240) ?? null,
    };
  })()`,
  returnByValue: true,
});
console.log(JSON.stringify(clicked.result.value, null, 2));
const { data } = await send("Page.captureScreenshot", { format: "png" });
fs.writeFileSync("c:/nf/nafuralabs/_tmp/menu-open.png", Buffer.from(data, "base64"));
ws.close();
