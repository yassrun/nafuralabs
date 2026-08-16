/**
 * Lance les tests JUnit du module documents (conservation), une fois par run.
 * Run : node --test nafura-platform/e2e/documents/*.test.mjs
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const BACKEND = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../sources/backend"
);
const RESULTS = path.join(
  BACKEND,
  "documents/build/test-results/test"
);
const LOCK = path.join(RESULTS, "..", "documents-e2e.lock");

const TESTS = [
  "ma.nafura.platform.collaboration.docmanager.DocumentsBaselineTest.joindreEtRendre",
  "ma.nafura.platform.collaboration.docmanager.DocumentsBaselineTest.deuxTenants",
  "ma.nafura.platform.collaboration.docmanager.DocumentsBaselineTest.retirerPiece",
  "ma.nafura.platform.collaboration.docmanager.DocumentsBaselineTest.originalCleTenant",
  "ma.nafura.platform.collaboration.docmanager.DocumentsDownloadTenantTest.downloadProprietaire",
  "ma.nafura.platform.collaboration.docmanager.DocumentsDownloadTenantTest.downloadAutreTenant",
  "ma.nafura.platform.collaboration.docmanager.DocumentsOctetsUniquesTest.memeFichierDeuxPieces",
  "ma.nafura.platform.collaboration.docmanager.DocumentsOctetsUniquesTest.memeFichierDeuxTenants",
  "ma.nafura.platform.collaboration.docmanager.DocumentsOctetsUniquesTest.retraitDerniereReference",
  "ma.nafura.platform.collaboration.docmanager.DocumentsOctetsUniquesTest.originalReutiliseOctets",
  "ma.nafura.platform.collaboration.docmanager.DocumentsUsageTenantTest.usageUnePiece",
  "ma.nafura.platform.collaboration.docmanager.DocumentsUsageTenantTest.usageDeuxPiecesMemeEmpreinte",
  "ma.nafura.platform.collaboration.docmanager.DocumentsUsageTenantTest.usageDeuxTenants",
  "ma.nafura.platform.collaboration.docmanager.DocumentsUsageTenantTest.usageApresRetrait",
  "ma.nafura.platform.collaboration.docmanager.DocumentsTailleMaxTest.tailleMaxAccepte",
  "ma.nafura.platform.collaboration.docmanager.DocumentsTailleMaxTest.tailleMaxRefusePiece",
  "ma.nafura.platform.collaboration.docmanager.DocumentsTailleMaxTest.tailleMaxRefuseOriginal",
  "ma.nafura.platform.collaboration.docmanager.DocumentsQuotaTest.quotaSousPlafond",
  "ma.nafura.platform.collaboration.docmanager.DocumentsQuotaTest.quotaDepasse",
  "ma.nafura.platform.collaboration.docmanager.DocumentsQuotaTest.quotaDedupPasse",
  "ma.nafura.platform.collaboration.docmanager.DocumentsUnifierTest.tenuPuisPiece",
  "ma.nafura.platform.collaboration.docmanager.DocumentsUnifierTest.piecePuisTenu",
  "ma.nafura.platform.collaboration.docmanager.DocumentsUnifierTest.unifierDeuxTenants",
  "ma.nafura.platform.collaboration.docmanager.DocumentsUnifierTest.unifierDerniereReference",
];

function xmlFiles() {
  if (!fs.existsSync(RESULTS)) return [];
  return fs.readdirSync(RESULTS).filter((f) => f.startsWith("TEST-") && f.endsWith(".xml"));
}

function methodNamesFromXml() {
  const names = [];
  for (const f of xmlFiles()) {
    const xml = fs.readFileSync(path.join(RESULTS, f), "utf8");
    for (const m of xml.matchAll(/<testcase\s+name="([^"]+)"/g)) {
      names.push(m[1].replace(/\(\)$/, ""));
    }
  }
  return names;
}

function xmlHasFailures() {
  return xmlFiles().some((f) => {
    const xml = fs.readFileSync(path.join(RESULTS, f), "utf8");
    return /failures="[1-9]/.test(xml) || /errors="[1-9]/.test(xml);
  });
}

function runGradle() {
  const args = [":platform:documents:test"];
  for (const t of TESTS) args.push("--tests", t);
  return spawnSync(
    process.platform === "win32" ? "gradlew.bat" : "./gradlew",
    args,
    { cwd: BACKEND, encoding: "utf8", shell: true }
  );
}

export function runDocumentsJunit() {
  const existing = methodNamesFromXml();
  const needed = TESTS.map((t) => t.split(".").pop());
  if (needed.every((n) => existing.includes(n)) && !xmlHasFailures()) {
    return { ok: true, status: 0, out: "junit-xml-cache", methods: existing };
  }

  fs.mkdirSync(path.dirname(LOCK), { recursive: true });
  const started = Date.now();
  while (fs.existsSync(LOCK) && Date.now() - started < 180_000) {
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 500);
  }
  const again = methodNamesFromXml();
  if (needed.every((n) => again.includes(n)) && !xmlHasFailures()) {
    return { ok: true, status: 0, out: "junit-xml-cache", methods: again };
  }

  fs.writeFileSync(LOCK, String(process.pid));
  try {
    const result = runGradle();
    const methods = methodNamesFromXml();
    const out = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
    return {
      ok: result.status === 0,
      status: result.status,
      out,
      methods,
    };
  } finally {
    try {
      fs.rmSync(LOCK);
    } catch {
      /* ignore */
    }
  }
}
