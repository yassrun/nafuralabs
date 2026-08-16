/**
 * CH-06-TECHNICAL-seau · documents-seau-config · AC-1, AC-2
 * État initial : sources config + init MinIO.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

function read(rel) {
  return fs.readFileSync(path.join(REPO, rel), "utf8").replace(/\r\n/g, "\n");
}

test("documents-seau-config", () => {
  const yml = read(
    "nafura-platform/sources/backend/documents/src/main/resources/application-documents.yml"
  );
  assert.match(yml, /documents:\s*\n(?:  .*\n)*  minio:\s*\n(?:    .*\n)*    bucket:\s*documents\b/);
  assert.match(yml, /app:\s*\n(?:  .*\n)*  storage:\s*\n(?:    .*\n)*    s3:\s*\n(?:      .*\n)*      bucket:\s*documents\b/);

  const storage = read(
    "nafura-platform/sources/backend/documents/src/main/java/ma/nafura/doc_manager/attachment/StorageConfig.java"
  );
  assert.match(storage, /app\.storage\.s3\.bucket:documents/);

  const init = read("nafura-platform/ops/k8s/base/infra/minio-init-job.yaml");
  assert.match(init, /mc mb myminio\/documents --ignore-existing/);
  assert.doesNotMatch(init, /nafura-documents/);
  assert.doesNotMatch(init, /nafura-erp/);

  const vault = read("nafura-platform/ops/k8s/base/infra/vault-init-job.yaml");
  assert.match(vault, /bucket=documents\b/);
  assert.doesNotMatch(vault, /bucket=nafura-documents/);
});
