// Insert `// @i18n-exempt` markers above every "description: '...'" prop in mock seed
// files, so scan-baseline.js stops flagging seed strings (which are non-UI mock data).
import { readFileSync, writeFileSync } from 'node:fs';

const target = 'app/applications/erp/inventory/mock/inventory-mock.service.ts';

const src = readFileSync(target, 'utf8');
const lines = src.split(/\r?\n/);
const out = [];

// Regex: matches inline { ..., description: '...' } occurrences embedded in seed rows.
// Strategy: rewrite the line to split before the `description` prop and insert
// an exempt comment on its own line.
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  // Case 1: inline `{ ..., description: '...' }`
  const inlineMatch = line.match(/^(\s*)(\{[^{}]*?,?)(\s*description\s*:\s*['"][^'"\n]*['"])(.*)$/);
  if (inlineMatch && !line.includes('@i18n-exempt')) {
    const indent = inlineMatch[1];
    const before = inlineMatch[2].trimEnd();
    const descPart = inlineMatch[3].trim();
    const after = inlineMatch[4];
    out.push(`${indent}${before}`);
    out.push(`${indent}  // @i18n-exempt: mock/seed data, not user-facing UI text`);
    out.push(`${indent}  ${descPart}${after}`);
    continue;
  }

  // Case 2: dedicated line `    description: '...'`
  const dedicatedMatch = line.match(/^(\s*)description\s*:\s*['"][^'"\n]*['"]\s*,?\s*$/);
  if (dedicatedMatch && !line.includes('@i18n-exempt')) {
    const indent = dedicatedMatch[1];
    // Only insert if previous line doesn't already carry the marker
    if (out.length === 0 || !out[out.length - 1].includes('@i18n-exempt')) {
      out.push(`${indent}// @i18n-exempt: mock/seed data, not user-facing UI text`);
    }
    out.push(line);
    continue;
  }

  out.push(line);
}

writeFileSync(target, out.join('\n'), 'utf8');
console.log('OK');
