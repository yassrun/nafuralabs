import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

/**
 * Spec 05 — une seule couche CRUD serveur.
 * Interdit tout nouvel usage de CrudService / JpaCrudService / CrudController / Exposed
 * hors du paquet framework (couche dépréciée) et du post-processeur d'audit Sektor.
 */

const repo = fileURLToPath(new URL('../../../../../', import.meta.url));
const backend = join(repo, 'nafura-platform/sources/backend');
const SKIP = new Set(['node_modules', 'build', '.gradle', 'bin', 'out']);

const ALLOW_PREFIXES = [
  'core/framework/src/main/java/ma/nafura/framework/service/crud/',
  'core/framework/src/main/java/ma/nafura/framework/api/controller/CrudController.java',
  'core/framework/src/main/java/ma/nafura/framework/crud/Exposed.java',
  'features/collaboration/audit/src/main/java/ma/nafura/audit/JpaCrudServiceAuditPostProcessor.java',
];

const FORBIDDEN = [
  {
    id: 'JpaCrudService',
    re: /\bextends\s+JpaCrudService\b|\bimport\s+ma\.nafura\.platform\.framework\.service\.crud\.JpaCrudService\b/,
    replacement: 'RecordController',
  },
  {
    id: 'CrudService',
    re: /\bextends\s+CrudService\b|\bimport\s+ma\.nafura\.platform\.framework\.service\.crud\.CrudService\b/,
    replacement: 'RecordController',
  },
  {
    id: 'CrudController',
    re: /\bextends\s+CrudController\b|\bimport\s+ma\.nafura\.platform\.framework\.api\.controller\.CrudController\b/,
    replacement: 'RecordController',
  },
  {
    id: 'Exposed',
    re: /\b@Exposed\b|\bimport\s+ma\.nafura\.platform\.framework\.crud\.Exposed\b/,
    replacement: 'RecordController + records/*.json',
  },
  {
    id: 'ControllerBase/ServiceBase',
    re: /\bextends\s+\w+(ControllerBase|ServiceBase)\b|\bimport\s+.*\.(controller|service)\.base\.\w+/,
    replacement: 'RecordController (sans *Base générés)',
  },
];

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(entry.name)) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) walk(path, out);
    else if (entry.name.endsWith('.java')) out.push(path);
  }
  return out;
}

function rel(path) {
  return relative(backend, path).split(sep).join('/');
}

function allowed(path) {
  const r = rel(path);
  return ALLOW_PREFIXES.some((prefix) => r === prefix || r.startsWith(prefix));
}

test('spec 05 — aucune ressource plateforme hors allowlist n’utilise l’ancienne couche CRUD', () => {
  assert.ok(existsSync(backend), `backend introuvable: ${backend}`);
  const violations = [];
  for (const file of walk(backend)) {
    if (allowed(file)) continue;
    const text = readFileSync(file, 'utf8');
    for (const rule of FORBIDDEN) {
      if (rule.re.test(text)) {
        violations.push(`${rel(file)} → ${rule.id} (utiliser ${rule.replacement})`);
      }
    }
  }
  assert.deepEqual(violations, [], violations.join('\n'));
});
