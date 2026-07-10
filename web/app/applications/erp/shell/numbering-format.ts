/**
 * Pure helper for formatting numbering policies (M-ADM-08).
 *
 * Format pattern is a string with tokens that get replaced by values:
 *
 *   {PREFIX}  → policy.prefix
 *   {YYYY}    → 4-digit year ("2026")
 *   {YY}      → 2-digit year ("26")
 *   {MM}      → 2-digit month ("05")
 *   {SOC}     → société code (when provided)
 *   {SEQ}     → zero-padded sequential counter (width = policy.padLength)
 *
 * Default pattern : `{PREFIX}{SEP}{YYYY}{SEP}{SEQ}` → `BC-2026-00042`
 *
 * Stateless / Angular-free so it can be reused from:
 *   - the admin page live preview
 *   - the NumberingPolicyService
 *   - unit specs without TestBed.
 */

export type YearFormat = 'YYYY' | 'YY' | 'NONE';
export type ResetPolicy = 'NEVER' | 'YEARLY' | 'MONTHLY';

export interface NumberingPolicyFormatLike {
  /** Static prefix (e.g. `BC`, `FAC`). */
  readonly prefix: string;
  /** Separator inserted between tokens. */
  readonly separator: string;
  /** Width of the zero-padded sequence (e.g. 5 → `00042`). */
  readonly padLength: number;
  /** Year formatting strategy. */
  readonly yearFormat: YearFormat;
  /**
   * Optional custom pattern. Default: `{PREFIX}{SEP}{YYYY}{SEP}{SEQ}`
   * (or `{PREFIX}{SEP}{SEQ}` when `yearFormat === 'NONE'`).
   */
  readonly pattern?: string;
}

export interface FormatContext {
  /** Sequential counter (next value to render). */
  counter: number;
  /** Optional year override (defaults to "today"). */
  year?: number;
  /** Optional month (1-12, defaults to "today"). */
  month?: number;
  /** Optional société code (substituted into `{SOC}` token). */
  societeCode?: string;
}

function pad(value: number, width: number): string {
  const w = Math.max(1, Math.min(width, 12));
  return String(Math.max(0, Math.floor(value))).padStart(w, '0');
}

export function defaultPattern(yearFormat: YearFormat): string {
  return yearFormat === 'NONE'
    ? '{PREFIX}{SEP}{SEQ}'
    : '{PREFIX}{SEP}' + (yearFormat === 'YY' ? '{YY}' : '{YYYY}') + '{SEP}{SEQ}';
}

export function formatNumber(
  policy: NumberingPolicyFormatLike,
  ctx: FormatContext,
): string {
  const now = new Date();
  const year = ctx.year ?? now.getFullYear();
  const month = ctx.month ?? now.getMonth() + 1;
  const pattern = policy.pattern && policy.pattern.length > 0
    ? policy.pattern
    : defaultPattern(policy.yearFormat);

  const yy = String(year).slice(-2);
  const yyyy = String(year);

  return pattern
    .replace(/\{PREFIX\}/g, policy.prefix ?? '')
    .replace(/\{SEP\}/g, policy.separator ?? '')
    .replace(/\{YYYY\}/g, yyyy)
    .replace(/\{YY\}/g, yy)
    .replace(/\{MM\}/g, pad(month, 2))
    .replace(/\{SOC\}/g, ctx.societeCode ?? '')
    .replace(/\{SEQ\}/g, pad(ctx.counter, policy.padLength ?? 4));
}

/**
 * Build a stable bucket key for grouping counters. Examples :
 *   - reset YEARLY   → "BC|soc-default|2026"
 *   - reset MONTHLY  → "BC|soc-default|2026-05"
 *   - reset NEVER    → "BC|soc-default|all"
 */
export function buildBucketKey(
  docType: string,
  societeId: string,
  resetPolicy: ResetPolicy,
  date: Date = new Date(),
): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  switch (resetPolicy) {
    case 'YEARLY':
      return `${docType}|${societeId}|${y}`;
    case 'MONTHLY':
      return `${docType}|${societeId}|${y}-${m}`;
    case 'NEVER':
    default:
      return `${docType}|${societeId}|all`;
  }
}

/**
 * Validate a pattern : returns array of unknown tokens (empty if all OK).
 */
const KNOWN_TOKENS = new Set(['PREFIX', 'SEP', 'YYYY', 'YY', 'MM', 'SOC', 'SEQ']);
const TOKEN_RE = /\{([A-Z]+)\}/g;

export function findUnknownTokens(pattern: string): string[] {
  if (!pattern) return [];
  const unknown: string[] = [];
  let m: RegExpExecArray | null;
  TOKEN_RE.lastIndex = 0;
  while ((m = TOKEN_RE.exec(pattern)) !== null) {
    if (!KNOWN_TOKENS.has(m[1])) unknown.push(m[1]);
  }
  return unknown;
}

/**
 * Quick check: pattern contains {SEQ} (required), no unknown tokens.
 * Returns null when valid, or a human-readable error message in French.
 */
export function validatePattern(pattern: string): string | null {
  if (!pattern || !pattern.trim()) return 'Le format ne peut pas être vide';
  if (!pattern.includes('{SEQ}')) return 'Le format doit contenir le jeton {SEQ}';
  const unknown = findUnknownTokens(pattern);
  if (unknown.length > 0) return `Jetons inconnus : ${unknown.map((u) => '{' + u + '}').join(', ')}`;
  return null;
}
