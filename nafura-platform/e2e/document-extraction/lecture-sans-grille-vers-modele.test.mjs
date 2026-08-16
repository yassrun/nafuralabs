/**
 * CH-00-INIT-lecture · lecture-sans-grille-vers-modele · AC-5 · AC-6
 * État initial : image / scan sans grille détectée.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { runLectureJunit } from "./_gradle.mjs";

test("lecture-sans-grille-vers-modele", () => {
  const r = runLectureJunit();
  assert.equal(r.status, 0, r.out);
  assert.ok(r.methods.includes("imageWithoutGridSkipsHeuristicAndKeepsModelPath"), r.out);
  assert.ok(r.methods.includes("gridCompileDoesNotSendRowValuesToLlm"), r.out);
});
