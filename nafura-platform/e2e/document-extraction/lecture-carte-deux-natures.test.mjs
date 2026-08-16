/**
 * CH-00-INIT-lecture · lecture-carte-deux-natures · AC-4
 * État initial : un brouillon avec les deux natures (Villa : 4 + 75).
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const WEB = path.join(REPO, "nafura-platform/sources/web/app/document-extraction");

test("lecture-carte-deux-natures", () => {
  const model = fs.readFileSync(
    path.join(WEB, "models/extraction.model.ts"),
    "utf8"
  );
  assert.match(model, /export function summarizeDoubts/);
  assert.match(model, /extraction: number/);
  assert.match(model, /sourceGap: number/);
  assert.doesNotMatch(model, /percent\s*:/);

  const review = fs.readFileSync(
    path.join(WEB, "smart-import/components/smart-import-review-dialog.component.ts"),
    "utf8"
  );
  assert.match(review, /data-nature="EXTRACTION"/);
  assert.match(review, /data-nature="SOURCE_GAP"/);
  assert.match(review, /doubtSummary\(\)\.extraction/);
  assert.match(review, /doubtSummary\(\)\.sourceGap/);
  assert.doesNotMatch(review, /extraction \+ sourceGap/);
  assert.doesNotMatch(review, /39\s*%/);

  const lists = fs.readFileSync(
    path.join(WEB, "smart-import/components/smart-import-doubt-lists.component.ts"),
    "utf8"
  );
  assert.match(lists, /data-nature="EXTRACTION"/);
  assert.match(lists, /data-nature="SOURCE_GAP"/);
});
