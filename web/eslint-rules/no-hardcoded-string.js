/**
 * @fileoverview ESLint rule: no-hardcoded-string
 *
 * Detects user-facing hardcoded strings that should be routed through
 * `ngx-translate` (`| translate` pipe in templates, `TranslateService.instant()`
 * in TS code) instead of being embedded as literals.
 *
 * Coverage:
 *  - TypeScript:
 *      • toast.success / toast.error / toast.info / toast.warning literal args
 *      • confirm / window.confirm / alert / window.alert / prompt / window.prompt
 *      • throw new Error('...')
 *      • UI properties (label / title / subtitle / placeholder / description /
 *        tooltip / helpText) when the value is a string literal
 *      • *_LABELS, STATUS_LABELS, TYPE_LABELS constants (object initializers)
 *      • Inline Angular component templates: @Component({ template: `...` })
 *
 *  - Angular templates (.html / inline templates):
 *      • Text between tags (`>foo<`) when not interpolated through `| translate`
 *      • Static attribute values: title / placeholder / aria-label / alt
 *      • Property-bound string literals: [title]="'…'" / [placeholder]="'…'"
 *
 * Phase 0 of the Nafura i18n roadmap — see
 * `web/docs/specs/i18n-roadmap/AGENT_RULES.md`.
 */

'use strict';

// ---------------------------------------------------------------------------
// Defaults (mirrored by the standalone scanner)
// ---------------------------------------------------------------------------

const DEFAULT_MIN_LENGTH = 4;
const DEFAULT_MIN_LETTERS = 2;

const DEFAULT_WHITELIST_ACRONYMS = [
  // Codes fiscaux / administratifs Maroc
  'ICE', 'RIB', 'IF', 'RC', 'CNSS', 'AMO', 'CIMR', 'CIN',
  // Devises
  'MAD', 'EUR', 'USD', 'DH', 'DHS',
  // BTP
  'BTP', 'MOA', 'MOE', 'DGD', 'OS', 'BC', 'BL', 'BR',
  // Fiscalité
  'IS', 'IR', 'TVA', 'VAT', 'CGNC', 'CGI', 'DGI', 'RAS', 'RG',
  // Tech / business
  'CRM', 'ERP', 'KPI', 'API', 'URL', 'HTTP', 'HTTPS', 'JSON', 'CSV',
  'PDF', 'XLSX', 'DOCX', 'PNG', 'JPG', 'SVG', 'XML', 'YAML',
  // HSE
  'HSE', 'EPI', 'AT', 'MP',
  // Divers
  'OK', 'NOK', 'NA', 'ID', 'UUID',
];

const DEFAULT_EXEMPT_GLOBS = [
  '**/*.spec.ts',
  '**/*.test.ts',
  'scripts/**',
  'eslint-rules/**',
];

const DEFAULT_IGNORE_PATTERNS = [
  // All-uppercase / numbers / punctuation only (codes, refs, dates, URLs paths)
  '^[A-Z0-9_./\\-]+$',
  // Pure numbers, percentages, currency-like
  '^[\\d\\s.,%+\\-/()]+$',
  // ISO dates / times
  '^\\d{4}-\\d{2}-\\d{2}(T[\\d:.Z+\\-]+)?$',
];

// UI properties to flag when the value is a string literal
const UI_LITERAL_PROPS = new Set([
  'label', 'title', 'subtitle', 'placeholder', 'description',
  'tooltip', 'helpText', 'helperText', 'message', 'header', 'caption',
]);

const TOAST_METHODS = new Set([
  'success', 'error', 'info', 'warning', 'warn', 'show',
]);

const STATIC_TEXT_ATTRS = new Set([
  'title', 'placeholder', 'aria-label', 'aria-description', 'alt',
  'label', 'subtitle', 'description', 'tooltip',
]);

const BOUND_LITERAL_ATTRS = new Set([
  'title', 'placeholder', 'ariaLabel', 'aria-label', 'alt',
  'label', 'subtitle', 'description', 'tooltip',
]);

const EXEMPT_COMMENT = /@i18n-exempt|eslint-disable.*no-hardcoded-string/;

// ---------------------------------------------------------------------------
// Pure helpers (exported for the standalone scanner + tests)
// ---------------------------------------------------------------------------

function buildOptions(rawOpts = {}) {
  return {
    minLength: rawOpts.minLength ?? DEFAULT_MIN_LENGTH,
    minLetters: rawOpts.minLetters ?? DEFAULT_MIN_LETTERS,
    ignorePatterns: (rawOpts.ignorePatterns ?? DEFAULT_IGNORE_PATTERNS).map(
      (src) => new RegExp(src),
    ),
    whitelistAcronyms: new Set(
      (rawOpts.whitelistAcronyms ?? DEFAULT_WHITELIST_ACRONYMS).map((a) =>
        a.toUpperCase(),
      ),
    ),
    exemptFiles: rawOpts.exemptFiles ?? DEFAULT_EXEMPT_GLOBS,
    level: rawOpts.level ?? 'warn',
  };
}

function countLetters(s) {
  let n = 0;
  for (const ch of s) {
    // Match unicode letters (incl. accents)
    if (/\p{L}/u.test(ch)) n++;
  }
  return n;
}

function isExemptFilename(filename, globs) {
  if (!filename) return false;
  // Normalise to forward slashes for cross-platform glob matching
  const normalised = filename.replace(/\\/g, '/');
  return globs.some((g) => globMatch(normalised, g));
}

function globMatch(filename, pattern) {
  // Lightweight glob → regexp (supports **, *, ?)
  const esc = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*\*/g, '__DOUBLESTAR__')
    .replace(/\*/g, '[^/]*')
    .replace(/__DOUBLESTAR__/g, '.*')
    .replace(/\?/g, '[^/]');
  const re = new RegExp('(^|/)' + esc + '$');
  return re.test(filename);
}

/**
 * Decide whether a candidate string should be flagged as hardcoded.
 * Returns { flagged: boolean, reason?: string }.
 */
function shouldFlagString(rawValue, opts) {
  if (rawValue == null) return { flagged: false };
  const value = String(rawValue).trim();

  if (value.length < opts.minLength) {
    return { flagged: false, reason: 'too-short' };
  }

  if (countLetters(value) < opts.minLetters) {
    return { flagged: false, reason: 'not-enough-letters' };
  }

  for (const re of opts.ignorePatterns) {
    if (re.test(value)) {
      return { flagged: false, reason: 'pattern-exempt' };
    }
  }

  // Whitelist acronyms: if the value is just a whitelisted acronym (optionally
  // surrounded by punctuation), do not flag.
  const stripped = value.replace(/[^\p{L}\p{N}]/gu, '').toUpperCase();
  if (stripped && opts.whitelistAcronyms.has(stripped)) {
    return { flagged: false, reason: 'whitelist-acronym' };
  }

  // Looks like a translation key already (`module.feature.something`) → skip.
  if (/^[a-z][a-z0-9]*(\.[a-z0-9_]+){2,}$/i.test(value)) {
    return { flagged: false, reason: 'looks-like-i18n-key' };
  }

  return { flagged: true };
}

/**
 * Walk an Angular template source (HTML / inline template) and emit
 * `{ line, column, kind, text }` reports for hardcoded strings.
 */
function scanTemplateSource(source, opts, startLine = 1, startColumn = 0) {
  const results = [];
  if (!source) return results;

  const lineStarts = computeLineStarts(source);

  // Strip <style>, <script>, and HTML comments before further analysis.
  const masked = maskNonTextRegions(source);

  // 1. Text between tags
  const TEXT_RE = />([^<]+)</g;
  let m;
  while ((m = TEXT_RE.exec(masked)) !== null) {
    const inner = m[1];
    if (!inner.trim()) continue;
    const containsTranslate = /\{\{[\s\S]*?\|\s*translate[\s\S]*?\}\}/.test(
      inner,
    );
    if (containsTranslate) continue;
    // Remove interpolation expressions ({{ ... }}) — these are dynamic.
    const visibleText = inner
      .replace(/\{\{[\s\S]*?\}\}/g, '')
      .replace(/&[a-z]+;/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (!visibleText) continue;
    const verdict = shouldFlagString(visibleText, opts);
    if (!verdict.flagged) continue;
    const offset = m.index + 1; // Skip the '>'
    const pos = offsetToLineCol(offset, lineStarts, startLine, startColumn);
    results.push({
      ...pos,
      kind: 'template_text',
      text: visibleText.slice(0, 120),
    });
  }

  // 2. Static text attributes (title="...", placeholder="...", etc.)
  const STATIC_ATTR_RE =
    /\b([a-zA-Z-]+)\s*=\s*"([^"<>{}@]*?)"/g;
  while ((m = STATIC_ATTR_RE.exec(masked)) !== null) {
    const attr = m[1];
    const value = m[2];
    if (!STATIC_TEXT_ATTRS.has(attr.toLowerCase())) continue;
    if (!value.trim()) continue;
    const verdict = shouldFlagString(value, opts);
    if (!verdict.flagged) continue;
    const offset = m.index + m[0].indexOf('"') + 1;
    const pos = offsetToLineCol(offset, lineStarts, startLine, startColumn);
    results.push({
      ...pos,
      kind: 'template_attr',
      text: value.slice(0, 120),
      attribute: attr,
    });
  }

  // 3. Bound literal attributes: [title]="'foo bar'", [placeholder]="'…'"
  const BOUND_LITERAL_RE =
    /\[([a-zA-Z-]+)\]\s*=\s*"\s*'([^']*)'\s*"/g;
  while ((m = BOUND_LITERAL_RE.exec(masked)) !== null) {
    const attr = m[1];
    const value = m[2];
    if (!BOUND_LITERAL_ATTRS.has(attr) && !BOUND_LITERAL_ATTRS.has(attr.toLowerCase())) continue;
    if (!value.trim()) continue;
    const verdict = shouldFlagString(value, opts);
    if (!verdict.flagged) continue;
    const offset = m.index;
    const pos = offsetToLineCol(offset, lineStarts, startLine, startColumn);
    results.push({
      ...pos,
      kind: 'template_bound_attr',
      text: value.slice(0, 120),
      attribute: attr,
    });
  }

  return results;
}

function maskNonTextRegions(html) {
  // Replace inner content of <style>...</style>, <script>...</script>, and
  // HTML comments with whitespace so that offsets stay correct.
  return html
    .replace(/<!--[\s\S]*?-->/g, (m) => ' '.repeat(m.length))
    .replace(/<style\b[\s\S]*?<\/style>/gi, (m) => ' '.repeat(m.length))
    .replace(/<script\b[\s\S]*?<\/script>/gi, (m) => ' '.repeat(m.length));
}

function computeLineStarts(src) {
  const starts = [0];
  for (let i = 0; i < src.length; i++) {
    if (src.charCodeAt(i) === 10) starts.push(i + 1);
  }
  return starts;
}

function offsetToLineCol(offset, lineStarts, baseLine, baseColumn) {
  // Binary search
  let lo = 0;
  let hi = lineStarts.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >>> 1;
    if (lineStarts[mid] <= offset) lo = mid;
    else hi = mid - 1;
  }
  const line = baseLine + lo;
  const column = (lo === 0 ? baseColumn : 0) + (offset - lineStarts[lo]);
  return { line, column };
}

function isExemptedByComment(node, sourceCode) {
  if (!sourceCode || !node) return false;
  try {
    const comments = sourceCode.getCommentsBefore?.(node) ?? [];
    return comments.some((c) => EXEMPT_COMMENT.test(c.value));
  } catch {
    return false;
  }
}

function getCalleeText(node) {
  if (!node || !node.callee) return '';
  if (node.callee.type === 'Identifier') return node.callee.name;
  if (node.callee.type === 'MemberExpression') {
    const obj = node.callee.object;
    const prop = node.callee.property;
    const objText =
      obj.type === 'Identifier' ? obj.name :
      obj.type === 'ThisExpression' ? 'this' :
      obj.type === 'MemberExpression' ? getCalleeText({ callee: obj }) :
      '';
    const propText = prop && prop.name ? prop.name : '';
    return `${objText}.${propText}`;
  }
  return '';
}

function getStringLiteralValue(node) {
  if (!node) return null;
  if (node.type === 'Literal' && typeof node.value === 'string') {
    return node.value;
  }
  if (node.type === 'TemplateLiteral' && node.expressions.length === 0) {
    return node.quasis.map((q) => q.value.cooked).join('');
  }
  return null;
}

// ---------------------------------------------------------------------------
// ESLint rule definition
// ---------------------------------------------------------------------------

const MESSAGE = (s) =>
  `String hardcodée détectée : "${s.length > 80 ? s.slice(0, 77) + '…' : s}". ` +
  `Utilisez \`| translate\` (Angular template) ou ` +
  `\`translateService.instant('<key>')\` (TypeScript). ` +
  `Voir : web/docs/specs/i18n-roadmap/AGENT_RULES.md`;

const meta = {
  type: 'suggestion',
  docs: {
    description:
      'Detect hardcoded user-facing strings that should be routed through ngx-translate.',
    category: 'i18n',
    recommended: false,
  },
  schema: [
    {
      type: 'object',
      properties: {
        minLength: { type: 'integer', minimum: 1 },
        minLetters: { type: 'integer', minimum: 0 },
        ignorePatterns: { type: 'array', items: { type: 'string' } },
        whitelistAcronyms: { type: 'array', items: { type: 'string' } },
        exemptFiles: { type: 'array', items: { type: 'string' } },
        level: { enum: ['warn', 'error'] },
      },
      additionalProperties: false,
    },
  ],
  messages: {
    hardcoded: '{{message}}',
  },
};

function create(context) {
  const opts = buildOptions(context.options[0] ?? {});
  const filename = context.getFilename
    ? context.getFilename()
    : context.filename || '';

  if (isExemptFilename(filename, opts.exemptFiles)) {
    return {};
  }

  const sourceCode =
    context.getSourceCode?.() || context.sourceCode || null;

  function report(node, value, kind) {
    context.report({
      node,
      messageId: 'hardcoded',
      data: { message: MESSAGE(value) + ` [kind=${kind}]` },
    });
  }

  function maybeReport(node, value, kind) {
    if (typeof value !== 'string') return;
    if (isExemptedByComment(node, sourceCode)) return;
    const verdict = shouldFlagString(value, opts);
    if (verdict.flagged) report(node, value, kind);
  }

  function flagStringArg(node, kind) {
    if (!node) return;
    const v = getStringLiteralValue(node);
    if (v != null) maybeReport(node, v, kind);
  }

  return {
    // toast.success('…'), this.toast.error('…'), confirm('…'), alert('…'),
    // prompt('…'), window.confirm('…'), etc.
    CallExpression(node) {
      const callText = getCalleeText(node);
      if (!callText) return;

      const last = callText.split('.').pop();
      const objects = callText.split('.').slice(0, -1).join('.');

      // toast.<method>(...)
      if (/(^|\.)toast$/i.test(objects) && TOAST_METHODS.has(last)) {
        node.arguments.forEach((arg) => flagStringArg(arg, 'toast'));
        return;
      }
      // notification.<method>, notify.<method>, snackbar.<method>
      if (/(^|\.)(notification|notify|snackbar|messageService)$/i.test(objects) &&
          TOAST_METHODS.has(last)) {
        node.arguments.forEach((arg) => flagStringArg(arg, 'toast'));
        return;
      }
      // confirm(...), alert(...), prompt(...), window.confirm(...), etc.
      if (['confirm', 'alert', 'prompt'].includes(last) &&
          (objects === '' || /(^|\.)window$/.test(objects))) {
        node.arguments.forEach((arg) => flagStringArg(arg, 'dialog'));
      }
    },

    // throw new Error('…'), throw new TypeError('…')
    NewExpression(node) {
      if (!node.callee || node.callee.type !== 'Identifier') return;
      if (!/Error$/.test(node.callee.name)) return;
      if (node.arguments.length === 0) return;
      flagStringArg(node.arguments[0], 'throw');
    },

    // Object UI properties: label / title / placeholder / description / ...
    // Plus inline Angular templates: `template: \`…\``
    Property(node) {
      const key = node.key;
      const name =
        key.type === 'Identifier' ? key.name :
        key.type === 'Literal' && typeof key.value === 'string' ? key.value :
        null;
      if (!name) return;

      // Inline Angular component template
      if (name === 'template') {
        const tplValue = getStringLiteralValue(node.value);
        if (tplValue && tplValue.includes('<')) {
          const reports = scanTemplateSource(tplValue, opts);
          reports.forEach((r) => {
            context.report({
              node: node.value,
              messageId: 'hardcoded',
              data: { message: MESSAGE(r.text) + ` [kind=${r.kind}]` },
            });
          });
        }
        return;
      }

      if (UI_LITERAL_PROPS.has(name)) {
        const v = getStringLiteralValue(node.value);
        if (v != null) {
          if (isExemptedByComment(node, sourceCode)) return;
          const verdict = shouldFlagString(v, opts);
          if (verdict.flagged) report(node.value, v, `prop:${name}`);
        }
      }
    },

    // const STATUS_LABELS = { DRAFT: 'Brouillon', ... }
    VariableDeclarator(node) {
      if (!node.id || node.id.type !== 'Identifier') return;
      const name = node.id.name;
      if (!/^[A-Z][A-Z0-9_]*$/.test(name)) return;
      if (!/_LABELS$|^STATUS_LABELS$|^TYPE_LABELS$|LABELS$/.test(name)) return;
      if (!node.init || node.init.type !== 'ObjectExpression') return;
      if (isExemptedByComment(node, sourceCode)) return;
      for (const prop of node.init.properties) {
        if (prop.type !== 'Property') continue;
        const v = getStringLiteralValue(prop.value);
        if (v != null) {
          const verdict = shouldFlagString(v, opts);
          if (verdict.flagged) {
            report(prop.value, v, `labels-const:${name}`);
          }
        }
      }
    },
  };
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = {
  meta,
  create,
  // Pure helpers, exported for standalone scanner and tests
  _internal: {
    buildOptions,
    shouldFlagString,
    scanTemplateSource,
    isExemptFilename,
    countLetters,
    DEFAULT_MIN_LENGTH,
    DEFAULT_MIN_LETTERS,
    DEFAULT_WHITELIST_ACRONYMS,
    DEFAULT_EXEMPT_GLOBS,
    DEFAULT_IGNORE_PATTERNS,
  },
};
