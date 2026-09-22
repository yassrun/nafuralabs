const outDir = "c:/nf/nafuralabs/_tmp";
const base = "http://127.0.0.1:4300";

const users = await fetch("http://127.0.0.1:8082/api/public/sandbox/users").then((r) => r.json());
const email = users[0]?.email;
if (!email) throw new Error("no sandbox user");
const session = await fetch("http://127.0.0.1:8082/api/public/sandbox/session", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ email }),
}).then((r) => r.json());

const targets = await fetch("http://127.0.0.1:9333/json/list").then((r) => r.json());
const page = targets.find((t) => t.type === "page");
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  ws.addEventListener("open", resolve);
  ws.addEventListener("error", reject);
});

let id = 0;
const pending = new Map();
function send(method, params = {}) {
  const msgId = ++id;
  ws.send(JSON.stringify({ id: msgId, method, params }));
  return new Promise((resolve, reject) => {
    pending.set(msgId, { resolve, reject });
  });
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
await send("Emulation.setDeviceMetricsOverride", {
  width: 1440,
  height: 900,
  deviceScaleFactor: 1,
  mobile: false,
});

async function go(path) {
  await send("Page.navigate", { url: base + path });
  await new Promise((r) => setTimeout(r, 1200));
}

await go("/");
await send("Runtime.evaluate", {
  expression: `sessionStorage.setItem('sandbox.lab.session', ${JSON.stringify(JSON.stringify(session))}); 'ok'`,
});

async function shot(name, path) {
  await go(path);
  await new Promise((r) => setTimeout(r, 800));
  const { data } = await send("Page.captureScreenshot", { format: "png" });
  const file = `${outDir}/${name}.png`;
  await import("node:fs").then((fs) => fs.writeFileSync(file, Buffer.from(data, "base64")));
  const text = await send("Runtime.evaluate", {
    expression: `document.body.innerText.slice(0, 800)`,
    returnByValue: true,
  });
  console.log("SHOT", name, path);
  console.log(text.result.value);
}

await shot("home", "/");
await shot("achats", "/achats");
await shot("nafura", "/nafura/business-contexts");
ws.close();
