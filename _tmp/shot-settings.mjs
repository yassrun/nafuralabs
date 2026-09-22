const outDir = "c:/nf/nafuralabs/_tmp";
const base = "http://127.0.0.1:4300";

const session = await fetch("http://127.0.0.1:8082/api/public/sandbox/session", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ email: "admin@sandbox.local" }),
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
const net = [];
function send(method, params = {}) {
  const msgId = ++id;
  ws.send(JSON.stringify({ id: msgId, method, params }));
  return new Promise((resolve, reject) => {
    pending.set(msgId, { resolve, reject });
  });
}
ws.addEventListener("message", (event) => {
  const msg = JSON.parse(event.data);
  if (msg.method === "Network.responseReceived") {
    const { url, status } = msg.params.response;
    if (url.includes("user-settings") || url.includes("/api/")) {
      net.push(`${status} ${url}`);
    }
  }
  if (msg.method === "Network.loadingFailed") {
    net.push(`FAIL ${msg.params.errorText} ${msg.params.requestId}`);
  }
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    if (msg.error) reject(new Error(JSON.stringify(msg.error)));
    else resolve(msg.result);
  }
});

await send("Network.enable");
await send("Page.enable");
await send("Runtime.enable");
await send("Emulation.setDeviceMetricsOverride", {
  width: 1440,
  height: 900,
  deviceScaleFactor: 1,
  mobile: false,
});

await send("Page.navigate", { url: base + "/" });
await new Promise((r) => setTimeout(r, 800));
await send("Runtime.evaluate", {
  expression: `sessionStorage.setItem('sandbox.lab.session', ${JSON.stringify(JSON.stringify(session))}); 'ok'`,
});
await send("Page.navigate", { url: base + "/user-settings" });
await new Promise((r) => setTimeout(r, 2500));

const text = await send("Runtime.evaluate", {
  expression: `document.body.innerText.slice(0, 1500)`,
  returnByValue: true,
});
const fails = await send("Runtime.evaluate", {
  expression: `performance.getEntriesByType('resource').filter(e => e.name.includes('user-settings') || e.name.includes('/api/')).map(e => e.name + ' ' + e.responseStatus).join('\\n')`,
  returnByValue: true,
});
console.log("--- TEXT ---");
console.log(text.result.value);
console.log("--- NET ---");
console.log(net.join("\n") || "(none)");
console.log("--- PERF ---");
console.log(fails.result.value);

const { data } = await send("Page.captureScreenshot", { format: "png" });
await import("node:fs").then((fs) =>
  fs.writeFileSync(`${outDir}/settings.png`, Buffer.from(data, "base64")),
);
ws.close();
