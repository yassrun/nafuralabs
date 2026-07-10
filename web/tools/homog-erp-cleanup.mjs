#!/usr/bin/env node
/** Second-pass cleanup: broken buttons, hex fallbacks, remaining hex. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const WEB_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SCOPES = [
  'app/applications/erp/pages/inventory',
  'app/applications/erp/pages/achats',
  'app/applications/erp/pages/administration',
  'app/applications/erp/pages/ventes',
  'app/applications/erp/pages/approbations',
  'app/applications/erp/onboarding',
  'app/applications/erp/shell',
  'app/applications/erp/etudes',
  'app/applications/erp/ventes',
  'app/applications/erp/inventory',
  'app/applications/erp/chantiers',
];

const EXTRA_HEX = {
  '#f9fafb': 'var(--nf-color-bg-subtle)',
  '#f3f4f6': 'var(--nf-color-bg-muted)',
  '#ef4444': 'var(--nf-color-danger-500)',
  '#b45309': 'var(--nf-color-warning-700)',
  '#1976d2': 'var(--nf-color-primary-500)',
  '#9ca3af': 'var(--nf-color-text-muted)',
  '#0288d1': 'var(--nf-color-primary-600)',
  '#0277bd': 'var(--nf-color-primary-700)',
  '#f57c00': 'var(--nf-color-warning-600)',
  '#e65100': 'var(--nf-color-warning-700)',
  '#fef3c7': 'var(--nf-color-warning-100)',
  '#fcd34d': 'var(--nf-color-warning-300)',
  '#ede9fe': 'var(--nf-color-primary-100)',
  '#6d28d9': 'var(--nf-color-primary-800)',
  '#333': 'var(--nf-text-primary)',
  '#333333': 'var(--nf-text-primary)',
  '#059669': 'var(--nf-color-success-600)',
  '#374151': 'var(--nf-text-primary)',
  '#4f46e5': 'var(--nf-color-primary-600)',
  '#fde68a': 'var(--nf-color-warning-200)',
  '#fecaca': 'var(--nf-color-danger-200)',
  '#fffbeb': 'var(--nf-color-warning-50)',
  '#f0f9ff': 'var(--nf-color-primary-50)',
  '#bae6fd': 'var(--nf-color-primary-200)',
  '#0369a1': 'var(--nf-color-primary-700)',
  '#f0fdf4': 'var(--nf-color-success-50)',
  '#0f766e': 'var(--nf-color-teal-700, var(--nf-color-success-700))',
  '#67e8f9': 'var(--nf-color-info-300, var(--nf-color-primary-300))',
  '#f0fdfa': 'var(--nf-color-success-50)',
  '#ecfdf5': 'var(--nf-color-success-50)',
  '#bfdbfe': 'var(--nf-color-primary-200)',
  '#854d0e': 'var(--nf-color-warning-800)',
  '#fef2f2': 'var(--nf-color-danger-50)',
  '#fff5f5': 'var(--nf-color-danger-50)',
  '#fff7ed': 'var(--nf-color-warning-50)',
  '#1b5b65': 'var(--nf-color-teal-800, var(--nf-color-primary-800))',
  '#555': 'var(--nf-color-text-secondary)',
  '#555555': 'var(--nf-color-text-secondary)',
  '#e5e5e5': 'var(--nf-color-border)',
  '#a63': 'var(--nf-color-warning-700)',
  '#c5cbd3': 'var(--nf-color-border)',
  '#f6f7f9': 'var(--nf-color-bg-muted)',
  '#1a56db': 'var(--nf-color-primary-600)',
  '#e2e6ec': 'var(--nf-color-border)',
  '#eef1f5': 'var(--nf-color-bg-muted)',
  '#cfd6df': 'var(--nf-color-border)',
  '#4b5563': 'var(--nf-color-text-secondary)',
  '#000': 'black',
  '#000000': 'black',
  '#999': 'var(--nf-color-text-muted)',
  '#999999': 'var(--nf-color-text-muted)',
  '#ccc': 'var(--nf-color-border)',
  '#cccccc': 'var(--nf-color-border)',
  '#1a1a1a': 'var(--nf-text-primary)',
  '#e0e0e0': 'var(--nf-color-border)',
  '#f5f5f5': 'var(--nf-color-bg-muted)',
  '#d0d7de': 'var(--nf-color-border)',
  '#d7dee4': 'var(--nf-color-border)',
  '#fcfffe': 'var(--nf-color-bg-subtle)',
  '#fff1e3': 'var(--nf-color-warning-50)',
  '#ffe2d2': 'var(--nf-color-warning-100)',
  '#f0bc93': 'var(--nf-color-warning-300)',
  '#7d3f18': 'var(--nf-color-warning-800)',
};

function walkDir(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkDir(full, files);
    else if (/\.(html|scss|ts)$/.test(entry.name)) files.push(full);
  }
  return files;
}

function cleanup(content) {
  let out = content;

  // Fix broken mat-icon-button codemod artifacts
  out = out.replace(
    /<nf-button([^>]*?)icon="([^"]+)"([^>]*?)\(click\)="([^"]+)"([^>]*?)\(clicked\)="[^"]+"[^>]*><\/nf-icon><\/nf-button>/gi,
    '<nf-button$1icon="$2" iconLibrary="lucide"$3(clicked)="$4"$5></nf-button>',
  );
  out = out.replace(/<nf-button([^>]*?)>\s*<nf-icon name="([^"]+)"><\/nf-icon>\s*/gi, '<nf-button$1 icon="$2" iconLibrary="lucide" ');
  out = out.replace(/\s\(click\)="([^"]+)"/g, (m, handler) => {
    // keep if already has clicked
    return m;
  });
  out = out.replace(/(<nf-button[^>]*)\s\(click\)="([^"]+)"/gi, '$1 (clicked)="$2"');
  out = out.replace(/(<nf-button[^>]*)\s\(clicked\)="([^"]+)"([^>]*)\s\(clicked\)="([^"]+)"/gi, '$1 (clicked)="$2"$3');

  // Strip duplicate (click) when (clicked) exists on nf-button
  out = out.replace(/(<nf-button[^>]*)\s\(click\)="[^"]+"([^>]*)\s\(clicked\)="/gi, '$1$2 (clicked)="');

  // Remove color="primary" invalid attr on nf-button
  out = out.replace(/\s+color="primary"/g, '');

  // Replace hex in var fallbacks: var(--token, #hex) -> var(--token)
  out = out.replace(/var\((--[a-zA-Z0-9-]+),\s*#[0-9a-fA-F]{3,6}\)/g, 'var($1)');

  // Remaining standalone hex
  out = out.replace(/#([0-9a-fA-F]{3,6})\b/g, (match) => {
    const key = match.toLowerCase();
    return EXTRA_HEX[key] ?? match;
  });

  // Fix circular var fallbacks
  out = out.replace(/var\((--[a-zA-Z0-9-]+),\s*var\(\1\)\)/g, 'var($1)');

  // Replace margin-top inline spacing with class (parametres-fiscal)
  out = out.replace(/\sstyle="margin-top:\s*1rem"/g, ' class="toggle-list--spaced"');

  // col width inline styles → data attribute for scss (etudes tables)
  out = out.replace(/<col style="width:\s*([^"]+)"\s*\/>/g, '<col class="col-w" data-w="$1" />');

  return out;
}

let n = 0;
for (const scope of SCOPES) {
  for (const file of walkDir(path.join(WEB_ROOT, scope))) {
    const orig = fs.readFileSync(file, 'utf8');
    const next = cleanup(orig);
    if (next !== orig) {
      fs.writeFileSync(file, next);
      n++;
    }
  }
}
console.log(`Cleanup pass: ${n} files updated`);
