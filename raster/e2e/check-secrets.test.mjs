/**
 * PLT-13 — aucun secret dans un fichier suivi.
 * Run: node --test raster/e2e/check-secrets.test.mjs
 */
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import {
  SECRET_ALLOW,
  check,
  checkTrackedSecrets,
  isTrackedSecret,
} from "../check.mjs";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

function collect(files) {
  const errors = [];
  checkTrackedSecrets(files, (at, msg) => errors.push({ at, msg }));
  return errors;
}

test("un secret dans la liste suivie est une erreur (recommit → check 1)", () => {
  for (const f of [
    "creds.env",
    "deepseek_api_key.txt",
    "foo.env",
    "certs/tls.pem",
    "store.p12",
    "keystore.jks",
  ]) {
    const errors = collect([f]);
    assert.equal(errors.length, 1, f);
    assert.equal(errors[0].at, f);
  }
});

test("l'exception unique README n'est pas une erreur", () => {
  assert.equal(isTrackedSecret(SECRET_ALLOW), false);
  assert.equal(collect([SECRET_ALLOW]).length, 0);
});

test("un source ordinaire n'est pas une erreur", () => {
  assert.equal(collect(["raster/check.mjs", "NAFURALABS.md"]).length, 0);
});

test("l'index git courant ne contient aucun secret", () => {
  const { errors } = check();
  const secretHits = errors.filter((e) => /fichier secret suivi/.test(e.msg));
  assert.deepEqual(secretHits, []);
});

test("git ls-files du repo ne matche aucun motif", () => {
  const out = execFileSync("git", ["ls-files", "-z"], {
    cwd: REPO,
    encoding: "buffer",
  });
  const files = out.toString("utf8").split("\0").filter(Boolean);
  assert.equal(collect(files).length, 0);
});
