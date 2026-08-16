/**
 * CH-01-EVOL-octets-uniques · documents-meme-fichier-deux-tenants · AC-2
 * État initial : mêmes octets, A puis B.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { runDocumentsJunit } from "./_gradle.mjs";

test("documents-meme-fichier-deux-tenants", () => {
  const r = runDocumentsJunit();
  assert.equal(r.status, 0, r.out);
  assert.ok(r.methods.includes("memeFichierDeuxTenants"), r.out);
});
