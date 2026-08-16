/**
 * Lance les tests JUnit du module document-extraction, une fois par run.
 * Run : node --test nafura-platform/e2e/document-extraction/*.test.mjs
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
  "document-extraction/build/test-results/test"
);
const LOCK = path.join(RESULTS, "..", "lecture-e2e.lock");

const TESTS = [
  "ma.nafura.platform.documents.docextractor.plan.PlanCascadeTest.heuristicThenCacheCascadeUsesSameValidator",
  "ma.nafura.platform.documents.docextractor.plan.PlanCascadeTest.cacheIsIsolatedPerTenant",
  "ma.nafura.platform.documents.docextractor.service.StatelessExtractionServiceTest.gridSpreadsheetUsesHeuristicPlanWithoutCallingLlm",
  "ma.nafura.platform.documents.docextractor.service.StatelessExtractionServiceTest.listClientSpreadsheetUsesHeuristicPlanWithoutCallingLlm",
  "ma.nafura.platform.documents.docextractor.service.StatelessExtractionServiceTest.gridCompileDoesNotSendRowValuesToLlm",
  "ma.nafura.platform.documents.docextractor.service.StatelessExtractionServiceTest.imageWithoutGridSkipsHeuristicAndKeepsModelPath",
];

function methodNamesFromXml() {
  if (!fs.existsSync(RESULTS)) return [];
  const names = [];
  for (const f of fs.readdirSync(RESULTS)) {
    if (!f.startsWith("TEST-") || !f.endsWith(".xml")) continue;
    const xml = fs.readFileSync(path.join(RESULTS, f), "utf8");
    for (const m of xml.matchAll(/<testcase\s+name="([^"]+)"/g)) {
      names.push(m[1].replace(/\(\)$/, ""));
    }
  }
  return names;
}

function runGradle() {
  const args = [":platform:document-extraction:test"];
  for (const t of TESTS) args.push("--tests", t);
  return spawnSync(
    process.platform === "win32" ? "gradlew.bat" : "./gradlew",
    args,
    { cwd: BACKEND, encoding: "utf8", shell: true }
  );
}

export function runLectureJunit() {
  const existing = methodNamesFromXml();
  const needed = TESTS.map((t) => t.split(".").pop());
  if (needed.every((n) => existing.includes(n))) {
    return { ok: true, status: 0, out: "junit-xml-cache", methods: existing };
  }

  fs.mkdirSync(path.dirname(LOCK), { recursive: true });
  const started = Date.now();
  while (fs.existsSync(LOCK) && Date.now() - started < 180_000) {
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 500);
  }
  const again = methodNamesFromXml();
  if (needed.every((n) => again.includes(n))) {
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
