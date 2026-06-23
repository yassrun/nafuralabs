#!/usr/bin/env node
/**
 * extract-i18n.mjs
 *
 * Phase 0 — Tâche 0.1 du chantier i18n Nafura ERP.
 *
 * Extracteur read-only de strings hardcodées « suspectes » dans les sources
 * Angular (templates HTML, templates inline TS, code TS). Produit un CSV
 * `web/scripts/i18n-extracted.csv` consommable par les agents Wave C
 * (Phase 3) pour planifier la migration vers `ngx-translate`.
 *
 * - Pur Node.js (zéro dépendance npm nouvelle).
 * - Regex sur le texte brut (pas d'AST TypeScript) — heuristiques + tolérance
 *   aux faux positifs assumée (mieux vaut sur-extraire que sous-extraire,
 *   cf. AGENT_RULES.md §7).
 * - Idempotent : sortie déterministe pour une même arborescence source.
 *
 * Usage :
 *   node web/scripts/extract-i18n.mjs                  # extraction complète
 *   node web/scripts/extract-i18n.mjs --root path/to   # racine alternative
 *   node web/scripts/extract-i18n.mjs --out fichier    # CSV alternatif
 *   node web/scripts/extract-i18n.mjs --json           # JSON additionnel
 *
 * Codes de retour :
 *   0 — extraction terminée (succès ou aucune string suspecte)
 *   2 — racine introuvable / erreur d'I/O
 */

import { readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

// ────────────────────────────────────────────────────────────────────────────
// Constantes & configuration
// ────────────────────────────────────────────────────────────────────────────

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const DEFAULT_ROOT = resolve(__dirname, '..', 'app');
const DEFAULT_OUT = resolve(__dirname, 'i18n-extracted.csv');

const SKIP_DIRS = new Set([
  'node_modules',
  '.angular',
  'dist',
  'coverage',
  '.git',
  '.next',
  '.cache',
  'storybook-static',
]);

/** Suffixes ignorés (tests, mocks, generated). */
const SKIP_FILE_SUFFIXES = [
  '.spec.ts',
  '.test.ts',
  '.d.ts',
  'i18n.generated.ts',
];

/** Mots stop français pour la détection « ressemble FR ». */
const FRENCH_STOP_WORDS = new Set([
  'le', 'la', 'les', 'un', 'une', 'des', 'du', 'de', 'au', 'aux',
  'et', 'ou', 'mais', 'donc', 'car', 'ni', 'or',
  'en', 'pour', 'par', 'avec', 'sans', 'dans', 'sur', 'sous', 'vers', 'chez', 'entre',
  'vous', 'nous', 'tu', 'il', 'elle', 'ils', 'elles',
  'mon', 'ma', 'mes', 'ton', 'ta', 'tes', 'son', 'sa', 'ses', 'notre', 'votre', 'leur',
  'ce', 'cet', 'cette', 'ces',
  'qui', 'que', 'quoi', 'dont', 'où',
  'voir', 'ajouter', 'supprimer', 'valider', 'modifier', 'créer',
  'enregistrer', 'confirmer', 'annuler', 'retour', 'suivant', 'précédent',
  'nouveau', 'nouvelle', 'aucun', 'aucune', 'tout', 'tous', 'toute', 'toutes',
  'oui', 'non', 'plus', 'moins', 'cours',
  'sélection', 'sélectionner', 'recherche', 'rechercher', 'chercher',
  'erreur', 'succès', 'attention', 'informations',
  'date', 'montant', 'total', 'nombre', 'libellé',
  'fichier', 'document', 'utilisateur', 'rôle',
  'est', 'sont', 'a', 'ont', 'sera', 'seront',
]);

/** Caractères français accentués (signal fort de FR). */
const FRENCH_ACCENT_RE = /[àâäæçéèêëîïôöœùûüÿÀÂÄÆÇÉÈÊËÎÏÔÖŒÙÛÜŸ]/;

/** Minimum de longueur (caractères) pour qu'une string soit considérée. */
const MIN_STRING_LENGTH = 4;

/** Minimum de lettres alphabétiques (≥2). */
const MIN_LETTERS = 2;

/** Attributs HTML / property bindings dont la valeur doit être traduite. */
const TRANSLATABLE_ATTRS = [
  'title',
  'placeholder',
  'label',
  'aria-label',
  'alt',
  'tooltip',
  'matTooltip',
  'pTooltip',
];

/** Méthodes toast.* à scanner pour leur 1er argument string. */
const TOAST_METHODS = ['success', 'error', 'info', 'warning', 'warn'];

// ────────────────────────────────────────────────────────────────────────────
// Helpers de classification
// ────────────────────────────────────────────────────────────────────────────

/**
 * Décide si une string « ressemble à du français » selon les heuristiques :
 *   - longueur ≥ MIN_STRING_LENGTH
 *   - au moins MIN_LETTERS lettres alphabétiques
 *   - ET (contient un accent FR  OU  contient un mot stop FR connu)
 */
export function looksFrench(rawString) {
  if (typeof rawString !== 'string') return false;
  const s = rawString.trim();
  if (s.length < MIN_STRING_LENGTH) return false;
  const letters = s.match(/[a-zA-ZÀ-ÿ]/g);
  if (!letters || letters.length < MIN_LETTERS) return false;
  if (FRENCH_ACCENT_RE.test(s)) return true;
  // Mot stop FR (insensible à la casse, frontières de mots simples).
  const tokens = s.toLowerCase().match(/[a-zà-ÿ]+/g) ?? [];
  return tokens.some((t) => FRENCH_STOP_WORDS.has(t));
}

/**
 * Génère une « slug » kebab-case à partir d'une string, sans accents,
 * en gardant au plus `maxWords` mots significatifs (≥ 2 lettres).
 */
export function slugify(input, maxWords = 4) {
  if (!input) return 'unnamed';
  const normalized = input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const words = normalized
    .split(' ')
    .filter((w) => w.length >= 2)
    .slice(0, maxWords);
  const slug = words.join('-').replace(/-+/g, '-');
  return slug || 'unnamed';
}

/**
 * Modules ERP « shared » (pas un domaine métier — composants transverses).
 */
const ERP_SHARED_TOPS = new Set([
  'shell', 'shared', 'security', 'routes', 'integrations',
  'analytics', 'pages', 'lib', 'core', 'pilotage', 'pilotage-analyses',
]);

/**
 * Détermine (module, feature) à partir d'un chemin relatif au repo.
 * Retourne `{ module: 'shared', feature: 'misc' }` si pattern non reconnu.
 *
 * Ordre de résolution :
 *   1. `applications/erp/pages/<module>/<feature>/...`  (composants page)
 *   2. `applications/erp/<module>/<feature>/...`        (services/models)
 *   3. `platform/features/<module>/<feature>/...`       (plateforme)
 *   4. `applications/erp/<shell-top>/<x>/...`           (shared)
 *   5. fallback `shared.misc`
 */
export function inferModuleFeature(relPath) {
  const norm = relPath.split(sep).join('/');
  const pagesMatch = norm.match(/applications\/erp\/pages\/([^/]+)\/([^/]+)/);
  if (pagesMatch) {
    return { module: pagesMatch[1], feature: pagesMatch[2] };
  }
  const erpMatch = norm.match(/applications\/erp\/([^/]+)\/([^/]+)/);
  if (erpMatch && !ERP_SHARED_TOPS.has(erpMatch[1])) {
    return { module: erpMatch[1], feature: erpMatch[2] };
  }
  if (erpMatch && ERP_SHARED_TOPS.has(erpMatch[1])) {
    return { module: 'shared', feature: erpMatch[2].replace(/\.[^.]+$/, '') };
  }
  const platformMatch = norm.match(/platform\/features\/([^/]+)\/([^/]+)/);
  if (platformMatch) {
    return { module: platformMatch[1], feature: platformMatch[2] };
  }
  const platformLibMatch = norm.match(/platform\/lib\/([^/]+)\/([^/]+)/);
  if (platformLibMatch) {
    return { module: 'shared', feature: platformLibMatch[1] };
  }
  return { module: 'shared', feature: 'misc' };
}

/** Mapping `kind` détecté → `kind` utilisé dans la clé i18n. */
const KIND_TO_KEY = {
  template_text: 'text',
  template_attr: 'label',
  toast: 'toast',
  confirm: 'confirm',
  alert: 'confirm',
  prompt: 'confirm',
  error: 'error',
  status_label: 'status',
  type_label: 'label',
  inline_template_text: 'text',
  inline_template_attr: 'label',
};

/** Construit la clé suggérée `<module>.<feature>.<kind>.<slug>`. */
export function buildSuggestedKey(relPath, kind, rawString) {
  const { module, feature } = inferModuleFeature(relPath);
  const keyKind = KIND_TO_KEY[kind] ?? 'text';
  const slug = slugify(rawString, 4);
  return `${module}.${feature}.${keyKind}.${slug}`;
}

// ────────────────────────────────────────────────────────────────────────────
// Détection sur templates HTML (et inline)
// ────────────────────────────────────────────────────────────────────────────

/**
 * Extrait les matches HTML d'un contenu donné.
 * `lineOffset` permet d'ajuster les numéros de ligne pour des templates
 * inlinés dans un .ts (template: ` ... `).
 *
 * Retourne `[{ line, column, kind, rawString, context }, …]`.
 */
export function extractFromHtml(content, lineOffset = 0, isInline = false) {
  const matches = [];
  const lines = content.split(/\r?\n/);

  // 1. Attributs HTML traduisibles : `attr="..."` et `[attr]="'...'"`
  const attrPattern = new RegExp(
    String.raw`(\[?(?:` + TRANSLATABLE_ATTRS.join('|') + String.raw`)\]?)\s*=\s*(?:"([^"]*)"|'([^']*)')`,
    'g',
  );
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let m;
    attrPattern.lastIndex = 0;
    while ((m = attrPattern.exec(line)) !== null) {
      const attrName = m[1];
      const rawValue = m[2] ?? m[3] ?? '';
      let candidate = rawValue;
      let kindHint = isInline ? 'inline_template_attr' : 'template_attr';
      const isBinding = attrName.startsWith('[');
      if (isBinding) {
        // Property binding : on accepte seulement si la valeur est elle-même
        // un littéral string Angular (entre quotes simples) — sinon c'est
        // une expression dynamique (ex. [title]="article.label").
        const lit = rawValue.match(/^\s*['"]([^'"]+)['"]\s*$/);
        if (!lit) continue;
        candidate = lit[1];
      } else {
        // Attribut statique : si la valeur contient `{{ ... }}`, c'est déjà
        // (potentiellement) traduit ou dynamique → on l'ignore.
        if (/\{\{[\s\S]*?\}\}/.test(rawValue)) continue;
      }
      if (!looksFrench(candidate)) continue;
      matches.push({
        line: i + 1 + lineOffset,
        column: (m.index ?? 0) + 1,
        kind: kindHint,
        rawString: candidate,
        context: `${attrName}=…`,
      });
    }
  }

  // 2. Texte entre balises : >TEXTE<
  //    On itère sur le contenu entier (multi-ligne possible si reflow).
  //    Approche : pour chaque ligne, capturer `>([^<>]+)<`.
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const textPattern = />\s*([^<>]+?)\s*</g;
    let m;
    while ((m = textPattern.exec(line)) !== null) {
      const raw = m[1];
      if (!raw || raw.length < MIN_STRING_LENGTH) continue;
      // Skip si déjà traduit (`| translate`).
      if (/\|\s*translate/.test(raw)) continue;
      // Skip si entièrement composé d'interpolations + espaces.
      const withoutInterp = raw.replace(/\{\{[\s\S]*?\}\}/g, '').trim();
      if (withoutInterp.length < MIN_STRING_LENGTH) continue;
      // Skip si la string est en réalité du JS/CSS résiduel (rare).
      if (!looksFrench(withoutInterp)) continue;
      matches.push({
        line: i + 1 + lineOffset,
        column: (m.index ?? 0) + 1,
        kind: isInline ? 'inline_template_text' : 'template_text',
        rawString: withoutInterp,
        context: '>…<',
      });
    }
  }

  return matches;
}

// ────────────────────────────────────────────────────────────────────────────
// Détection sur TypeScript
// ────────────────────────────────────────────────────────────────────────────

/**
 * Extrait les matches TypeScript. Détecte :
 *   - templates inlines `template: \`…\``  → délègue à extractFromHtml
 *   - toast.{success|error|info|warning}('…')
 *   - confirm(), window.confirm(), alert(), window.alert(), prompt(), window.prompt()
 *   - throw new Error('…')
 *   - Objets `XXX_LABELS = { KEY: 'valeur', … }`
 */
export function extractFromTs(content) {
  const matches = [];
  const lines = content.split(/\r?\n/);

  // ── A. Templates inlines : `template: \`...\``
  //    Approche multiligne sur l'ensemble du contenu.
  const inlineTemplateRe = /template\s*:\s*`([\s\S]*?)`/g;
  let im;
  while ((im = inlineTemplateRe.exec(content)) !== null) {
    const inlineContent = im[1];
    // Ligne de départ du template inline (1-based).
    const before = content.slice(0, im.index + 'template'.length);
    const startLine = before.split(/\r?\n/).length;
    const inlineMatches = extractFromHtml(inlineContent, startLine - 1, true);
    matches.push(...inlineMatches);
  }

  // ── B. Toast / confirm / alert / prompt / Error : scan ligne par ligne.
  const tsPatterns = [
    {
      // toast.success('…'), toast.error("…"), notify.success(`…`)…
      re: /\b(?:toast|notify|notification|notifier|messageService|swal|snackbar|alertService)\s*\.\s*(success|error|info|warning|warn)\s*\(\s*(['"`])((?:\\.|(?!\2)[\s\S])*?)\2/g,
      kind: 'toast',
      ctxFn: (m) => `toast.${m[1]}()`,
      stringGroup: 3,
    },
    {
      // confirm('...'), window.confirm("..."), alert('...'), prompt(...)
      re: /(?:^|[^.\w])(?:window\s*\.\s*)?(confirm|alert|prompt)\s*\(\s*(['"`])((?:\\.|(?!\2)[\s\S])*?)\2/g,
      kind: null, // résolu via m[1] → confirm|alert|prompt
      ctxFn: (m) => `${m[1]}(…)`,
      stringGroup: 3,
      kindFn: (m) => m[1],
    },
    {
      // throw new Error('...'), throw new TypeError('...'), etc.
      re: /throw\s+new\s+\w*Error\s*\(\s*(['"`])((?:\\.|(?!\1)[\s\S])*?)\1/g,
      kind: 'error',
      ctxFn: () => 'throw new Error(…)',
      stringGroup: 2,
    },
  ];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const pat of tsPatterns) {
      pat.re.lastIndex = 0;
      let m;
      while ((m = pat.re.exec(line)) !== null) {
        const raw = m[pat.stringGroup];
        if (!looksFrench(raw)) continue;
        const kind = pat.kindFn ? pat.kindFn(m) : pat.kind;
        matches.push({
          line: i + 1,
          column: (m.index ?? 0) + 1,
          kind,
          rawString: raw,
          context: pat.ctxFn(m),
        });
      }
    }
  }

  // ── C. Objets `XXX_LABELS = { … }` — détection par état (multi-lignes).
  //    On repère le début de bloc, puis on scanne les paires clé:'valeur'
  //    jusqu'à la fermeture (`}` à profondeur 0 relative au bloc).
  const labelStartRe = /\b(?:const|let|var|export\s+const|export\s+let|export\s+var)\s+([A-Z][A-Z0-9_]*_LABELS)\s*(?::[^=]*)?=\s*\{/g;
  let lm;
  while ((lm = labelStartRe.exec(content)) !== null) {
    const labelName = lm[1];
    const objStart = content.indexOf('{', lm.index + lm[0].length - 1);
    if (objStart === -1) continue;
    // Trouve l'accolade fermante correspondante en suivant la profondeur.
    let depth = 0;
    let end = -1;
    for (let i = objStart; i < content.length; i++) {
      const ch = content[i];
      if (ch === '{') depth++;
      else if (ch === '}') {
        depth--;
        if (depth === 0) {
          end = i;
          break;
        }
      }
    }
    if (end === -1) continue;
    const block = content.slice(objStart + 1, end);
    // Choix de kind : *_TYPE_LABELS → type_label, sinon status_label.
    const kind = /TYPE_LABELS$/.test(labelName) ? 'type_label' : 'status_label';
    // Détecte chaque paire KEY: 'value' ou "KEY": "value".
    const pairRe = /(?:^|[,{\s])\s*(?:['"]?([A-Za-z_][\w-]*)['"]?|"([^"]+)"|'([^']+)')\s*:\s*(['"`])((?:\\.|(?!\4)[\s\S])*?)\4/g;
    const baseLine = content.slice(0, objStart).split(/\r?\n/).length;
    let pm;
    while ((pm = pairRe.exec(block)) !== null) {
      const value = pm[5];
      if (!looksFrench(value)) continue;
      const key = pm[1] ?? pm[2] ?? pm[3] ?? '?';
      // Ligne absolue : baseLine + index de la ligne où apparaît pm.index
      const beforeMatch = block.slice(0, pm.index);
      const relLine = beforeMatch.split(/\r?\n/).length - 1;
      // Colonne approximative : position dans la ligne du block.
      const lastNl = beforeMatch.lastIndexOf('\n');
      const col = pm.index - (lastNl + 1) + 1;
      matches.push({
        line: baseLine + relLine,
        column: col,
        kind,
        rawString: value,
        context: `${labelName}.${key}`,
      });
    }
  }

  return matches;
}

// ────────────────────────────────────────────────────────────────────────────
// Walker + dispatcher
// ────────────────────────────────────────────────────────────────────────────

async function* walk(dir) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      yield* walk(full);
      continue;
    }
    if (!entry.isFile()) continue;
    if (SKIP_FILE_SUFFIXES.some((suf) => entry.name.endsWith(suf))) continue;
    if (!/\.(html|ts)$/.test(entry.name)) continue;
    yield full;
  }
}

/** Extrait les matches d'un fichier (html ou ts). */
export async function extractFromFile(file) {
  const content = await readFile(file, 'utf8');
  if (file.endsWith('.html')) {
    return extractFromHtml(content);
  }
  return extractFromTs(content);
}

// ────────────────────────────────────────────────────────────────────────────
// CSV writer (échappement RFC 4180)
// ────────────────────────────────────────────────────────────────────────────

function csvEscape(value) {
  const s = String(value ?? '');
  if (/[",\r\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function toCsvRow(fields) {
  return fields.map(csvEscape).join(',');
}

// ────────────────────────────────────────────────────────────────────────────
// CLI
// ────────────────────────────────────────────────────────────────────────────

function parseArgs(argv) {
  const args = { root: DEFAULT_ROOT, out: DEFAULT_OUT, json: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--root' && argv[i + 1]) args.root = resolve(argv[++i]);
    else if (a === '--out' && argv[i + 1]) args.out = resolve(argv[++i]);
    else if (a === '--json') args.json = true;
    else if (a === '--help' || a === '-h') {
      console.log(`Usage: node extract-i18n.mjs [--root <dir>] [--out <file>] [--json]`);
      process.exit(0);
    }
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const root = args.root;
  const outFile = args.out;

  // Sanity check.
  try {
    const st = await stat(root);
    if (!st.isDirectory()) throw new Error('not a directory');
  } catch {
    console.error(`✘ Racine introuvable : ${root}`);
    process.exit(2);
  }

  const repoRoot = resolve(__dirname, '..');
  const rows = [];
  const stats = {
    files: 0,
    matches: 0,
    byKind: Object.create(null),
    byModule: Object.create(null),
  };

  for await (const file of walk(root)) {
    stats.files++;
    let fileMatches;
    try {
      fileMatches = await extractFromFile(file);
    } catch (err) {
      console.error(`✘ Erreur lecture ${file} : ${err.message}`);
      continue;
    }
    const rel = relative(repoRoot, file).split(sep).join('/');
    const { module } = inferModuleFeature(rel);
    for (const m of fileMatches) {
      const key = buildSuggestedKey(rel, m.kind, m.rawString);
      rows.push({
        file: rel,
        line: m.line,
        column: m.column,
        kind: m.kind,
        rawString: m.rawString,
        suggestedKey: key,
        context: m.context,
      });
      stats.matches++;
      stats.byKind[m.kind] = (stats.byKind[m.kind] ?? 0) + 1;
      stats.byModule[module] = (stats.byModule[module] ?? 0) + 1;
    }
  }

  // Tri stable : file → line → column → kind.
  rows.sort((a, b) => {
    if (a.file !== b.file) return a.file < b.file ? -1 : 1;
    if (a.line !== b.line) return a.line - b.line;
    if (a.column !== b.column) return a.column - b.column;
    return a.kind < b.kind ? -1 : a.kind > b.kind ? 1 : 0;
  });

  // Écrit le CSV.
  const header = ['file', 'line', 'column', 'kind', 'raw_string', 'suggested_key', 'context'];
  const csvLines = [toCsvRow(header)];
  for (const r of rows) {
    csvLines.push(toCsvRow([r.file, r.line, r.column, r.kind, r.rawString, r.suggestedKey, r.context]));
  }
  await writeFile(outFile, csvLines.join('\n') + '\n', 'utf8');

  if (args.json) {
    const jsonOut = outFile.replace(/\.csv$/, '.json');
    await writeFile(jsonOut, JSON.stringify(rows, null, 2), 'utf8');
  }

  // Résumé console.
  const sortedKinds = Object.entries(stats.byKind).sort((a, b) => b[1] - a[1]);
  const sortedModules = Object.entries(stats.byModule)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const outRel = relative(repoRoot, outFile).split(sep).join('/');
  console.log('====== i18n extraction report ======');
  console.log(`Files scanned: ${stats.files}`);
  console.log(`Hardcoded strings detected: ${stats.matches}`);
  console.log('By kind:');
  for (const [k, v] of sortedKinds) console.log(`  ${k}: ${v}`);
  console.log('By module (top 10):');
  for (const [k, v] of sortedModules) console.log(`  ${k}: ${v}`);
  console.log(`Output: ${outRel}`);

  return { stats, rows };
}

// Exécute le CLI sauf si importé comme module (tests).
const isCli = process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url));
if (isCli) {
  main().catch((err) => {
    console.error(err);
    process.exit(2);
  });
}

export default { extractFromHtml, extractFromTs, looksFrench, slugify, buildSuggestedKey, inferModuleFeature };
