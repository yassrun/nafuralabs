/**
 * CH-01-EVOL-octets-uniques · documents-meme-fichier-deux-pieces · AC-1
 * État initial : tenant A, un fichier, deux jointures.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { runDocumentsJunit } from "./_gradle.mjs";

test("documents-meme-fichier-deux-pieces", () => {
  const r = runDocumentsJunit();
  assert.equal(r.status, 0, r.out);
  assert.ok(r.methods.includes("memeFichierDeuxPieces"), r.out);
});
