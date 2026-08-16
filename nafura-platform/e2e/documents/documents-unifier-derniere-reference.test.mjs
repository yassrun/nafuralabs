/**
 * CH-07-EVOL-unifier · documents-unifier-derniere-reference · AC-4
 * État initial : A, pièce + tenu, même empreinte, puis retraits.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { runDocumentsJunit } from "./_gradle.mjs";

test("documents-unifier-derniere-reference", () => {
  const r = runDocumentsJunit();
  assert.equal(r.status, 0, r.out);
  assert.ok(r.methods.includes("unifierDerniereReference"), r.out);
});
