import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Permissions the backend enforces: @RequirePermission full strings and @SecuredResource scopes + CRUD actions. */
export function backendPermissions() {
  const root = fileURLToPath(new URL('../../../backend/', import.meta.url));
  const permissions = new Set();
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === 'build' || entry.name === 'test') continue;
      const full = join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith('Controller.java')) {
        const source = readFileSync(full, 'utf8');
        for (const match of source.matchAll(/@RequirePermission\(value = "([^"]+)", fullPermission = true\)/g)) permissions.add(match[1]);
        const secured = source.match(/@SecuredResource\(domain = "([^"]+)", feature = "([^"]+)", resource = "([^"]+)"\)/);
        if (secured) {
          for (const action of ['read', 'create', 'update', 'delete']) permissions.add(`${secured[1]}.${secured[2]}.${secured[3]}.${action}`);
        }
      }
    }
  };
  walk(root);
  return permissions;
}
