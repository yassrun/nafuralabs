#!/usr/bin/env node
/**
 * Standalone scanner that walks the codebase and applies the same hardcoded
 * string detection logic as the ESLint rule `no-hardcoded-string`.
 *
 * Used to capture the Phase 0 baseline before ESLint is fully wired into the
 * Angular build. Once `ng lint` is enabled in Phase 5, the official runner will
 * be `eslint --rulesdir eslint-rules ...`.
 *
 * Usage:
 *   node eslint-rules/scan-baseline.js              # scan app/**
 *   node eslint-rules/scan-baseline.js --json       # machine-readable
 *   node eslint-rules/scan-baseline.js path/to/dir  # explicit roots
 */

'use strict';

const fs = require('fs');
const path = require('path');

const rule = require('./no-hardcoded-string');
const {
  buildOptions,
  shouldFlagString,
  scanTemplateSource,
  isExemptFilename,
  DEFAULT_EXEMPT_GLOBS,
} = rule._internal;

const args = process.argv.slice(2);
const wantJson = args.includes('--json');
const explicit = args.filter((a) => !a.startsWith('--'));

const ROOT = path.resolve(__dirname, '..');
const ROOTS = explicit.length > 0 ? explicit : ['app'];
const opts = buildOptions({});

const EXEMPT_COMMENT = /@i18n-exempt|eslint-disable.*no-hardcoded-string/;

const findings = [];

// NOTE: the actual scan is kicked off at the bottom of the file, AFTER all
// regex/const declarations are evaluated (otherwise TDZ on CALL_PATTERNS,
// UI_PROP_RE, etc., because `walk` → `scanTsFile` → `scanCallSites` runs
// during the top-level evaluation).

function walk(dir) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'dist' ||
          entry.name === '.git' || entry.name === '.angular' ||
          entry.name === 'coverage') continue;
      walk(full);
    } else if (entry.isFile()) {
      const rel = path.relative(ROOT, full).replace(/\\/g, '/');
      if (isExemptFilename(rel, DEFAULT_EXEMPT_GLOBS)) continue;
      if (rel.endsWith('.html')) scanHtmlFile(full, rel);
      else if (rel.endsWith('.ts')) scanTsFile(full, rel);
    }
  }
}

function scanHtmlFile(full, rel) {
  let src;
  try { src = fs.readFileSync(full, 'utf8'); } catch { return; }
  const reports = scanTemplateSource(src, opts);
  for (const r of reports) {
    findings.push({ file: rel, ...r });
  }
}

function scanTsFile(full, rel) {
  let src;
  try { src = fs.readFileSync(full, 'utf8'); } catch { return; }
  const lineStarts = computeLineStarts(src);

  // 1. toast.<method>(...), confirm(...), alert(...), prompt(...), throw new Error(...)
  scanCallSites(src, lineStarts, rel);

  // 2. UI literal props: label / title / placeholder / description / tooltip
  scanUiProps(src, lineStarts, rel);

  // 3. *_LABELS const blocks
  scanLabelsConst(src, lineStarts, rel);

  // 4. Inline component templates
  scanInlineTemplates(src, lineStarts, rel);
}

function computeLineStarts(src) {
  const starts = [0];
  for (let i = 0; i < src.length; i++) {
    if (src.charCodeAt(i) === 10) starts.push(i + 1);
  }
  return starts;
}

function offsetToPos(offset, lineStarts) {
  let lo = 0;
  let hi = lineStarts.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >>> 1;
    if (lineStarts[mid] <= offset) lo = mid;
    else hi = mid - 1;
  }
  return { line: lo + 1, column: offset - lineStarts[lo] };
}

function lineHasExemptComment(src, offset) {
  // Look at the preceding line for an exempt marker
  let start = offset;
  while (start > 0 && src[start - 1] !== '\n') start--;
  let lineStart = start - 1;
  while (lineStart > 0 && src[lineStart - 1] !== '\n') lineStart--;
  const prevLine = src.slice(lineStart, start);
  return EXEMPT_COMMENT.test(prevLine);
}

function pushFinding(rel, offset, lineStarts, value, kind) {
  if (!value) return;
  const verdict = shouldFlagString(value, opts);
  if (!verdict.flagged) return;
  const { line, column } = offsetToPos(offset, lineStarts);
  findings.push({
    file: rel,
    line,
    column,
    kind,
    text: value.slice(0, 120),
  });
}

const CALL_PATTERNS = [
  // toast.success('...'), this.toast.error("..."), notify.warning(`...`)
  { re: /\b(?:this\.)?(?:toast|notification|notify|snackbar|messageService)\s*\.\s*(?:success|error|info|warning|warn|show)\s*\(\s*(['"`])([^'"`]*?)\1/g, kind: 'toast' },
  // confirm('...'), window.confirm('...'), alert/prompt
  { re: /\b(?:window\.)?(?:confirm|alert|prompt)\s*\(\s*(['"`])([^'"`]*?)\1/g, kind: 'dialog' },
  // throw new Error('...'), throw new TypeError('...')
  { re: /\bthrow\s+new\s+\w*Error\s*\(\s*(['"`])([^'"`]*?)\1/g, kind: 'throw' },
];

function scanCallSites(src, lineStarts, rel) {
  for (const { re, kind } of CALL_PATTERNS) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(src)) !== null) {
      const value = m[2];
      const offset = m.index + m[0].indexOf(m[1]) + 1;
      if (lineHasExemptComment(src, m.index)) continue;
      pushFinding(rel, offset, lineStarts, value, kind);
    }
  }
}

const UI_PROP_RE =
  /(^|[\s,{(])(label|title|subtitle|placeholder|description|tooltip|helpText|helperText|message|header|caption)\s*:\s*(['"`])([^'"`]*?)\3/g;

function scanUiProps(src, lineStarts, rel) {
  UI_PROP_RE.lastIndex = 0;
  let m;
  while ((m = UI_PROP_RE.exec(src)) !== null) {
    const name = m[2];
    const value = m[4];
    const offset = m.index + m[0].indexOf(m[3]) + 1;
    if (lineHasExemptComment(src, m.index)) continue;
    pushFinding(rel, offset, lineStarts, value, `prop:${name}`);
  }
}

const LABELS_DECL_RE =
  /\b(?:const|let|var|readonly)\s+([A-Z][A-Z0-9_]*LABELS)\s*[:=]/g;

function scanLabelsConst(src, lineStarts, rel) {
  LABELS_DECL_RE.lastIndex = 0;
  let m;
  while ((m = LABELS_DECL_RE.exec(src)) !== null) {
    const name = m[1];
    // Mirror no-hardcoded-string.js#VariableDeclarator → honour @i18n-exempt
    // comment placed on the line preceding the declaration. Without this guard,
    // the standalone scanner diverges from the real ESLint rule (see Phase 1.2).
    if (lineHasExemptComment(src, m.index)) continue;
    const blockStart = src.indexOf('{', m.index + m[0].length);
    if (blockStart < 0) continue;
    const blockEnd = findMatchingBrace(src, blockStart);
    if (blockEnd < 0) continue;
    const block = src.slice(blockStart, blockEnd);
    const valueRe = /(['"`])([^'"`]+?)\1/g;
    let v;
    while ((v = valueRe.exec(block)) !== null) {
      const value = v[2];
      const offset = blockStart + v.index + v[0].indexOf(v[1]) + 1;
      pushFinding(rel, offset, lineStarts, value, `labels-const:${name}`);
    }
  }
}

function findMatchingBrace(src, openIdx) {
  let depth = 0;
  for (let i = openIdx; i < src.length; i++) {
    const c = src[i];
    if (c === '{') depth++;
    else if (c === '}') {
      depth--;
      if (depth === 0) return i + 1;
    }
  }
  return -1;
}

const INLINE_TEMPLATE_RE = /\btemplate\s*:\s*`([\s\S]*?)`/g;

function scanInlineTemplates(src, lineStarts, rel) {
  INLINE_TEMPLATE_RE.lastIndex = 0;
  let m;
  while ((m = INLINE_TEMPLATE_RE.exec(src)) !== null) {
    const tpl = m[1];
    if (!tpl.includes('<')) continue;
    const offset = m.index + m[0].indexOf('`') + 1;
    const { line: baseLine, column: baseColumn } = offsetToPos(offset, lineStarts);
    const reports = scanTemplateSource(tpl, opts, baseLine, baseColumn);
    for (const r of reports) {
      findings.push({ file: rel, ...r, kind: `inline_${r.kind}` });
    }
  }
}

// ---------------------------------------------------------------------------
// Run scan now that every regex/const is initialised
// ---------------------------------------------------------------------------

for (const r of ROOTS) {
  walk(path.resolve(ROOT, r));
}

// ---------------------------------------------------------------------------
// Output
// ---------------------------------------------------------------------------

if (wantJson) {
  process.stdout.write(JSON.stringify(findings, null, 2));
  process.exit(0);
}

const byFile = new Map();
const byKind = new Map();
for (const f of findings) {
  byFile.set(f.file, (byFile.get(f.file) ?? 0) + 1);
  byKind.set(f.kind, (byKind.get(f.kind) ?? 0) + 1);
}

const topFiles = [...byFile.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
const topKinds = [...byKind.entries()].sort((a, b) => b[1] - a[1]);

console.log(`\nno-hardcoded-string baseline — ${findings.length} warnings\n`);
console.log('Top 10 files:');
for (const [f, n] of topFiles) console.log(`  ${String(n).padStart(5)}  ${f}`);
console.log('\nBy kind:');
for (const [k, n] of topKinds) console.log(`  ${String(n).padStart(5)}  ${k}`);
console.log('');
