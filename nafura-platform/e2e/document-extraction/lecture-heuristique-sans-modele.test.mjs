/**
 * CH-00-INIT-lecture · lecture-heuristique-sans-modele · AC-1
 * État initial : xlsx grille + schéma titres connus.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { runLectureJunit } from "./_gradle.mjs";

test("lecture-heuristique-sans-modele", () => {
  const r = runLectureJunit();
  assert.equal(r.status, 0, r.out);
  assert.ok(r.methods.includes("gridSpreadsheetUsesHeuristicPlanWithoutCallingLlm"), r.out);
  assert.ok(r.methods.includes("listClientSpreadsheetUsesHeuristicPlanWithoutCallingLlm"), r.out);
  assert.ok(r.methods.includes("heuristicThenCacheCascadeUsesSameValidator"), r.out);
});
