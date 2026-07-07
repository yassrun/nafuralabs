#!/usr/bin/env node
/**
 * check-i18n-parity.mjs
 *
 * Validateur de parité FR ↔ EN pour Nafura ERP (i18n roadmap Phase 0 — tâche 0.2).
 *
 * Découvre tous les packs JSON sous `web/public/assets/i18n/**` et compare,
 * pour chaque pack, les fichiers FR / EN (et reporte AR en INFO uniquement —
 * Round 1 ne valide que FR + EN).
 *
 * Niveaux de sévérité :
 *   🔴 ERROR   — clé présente FR / absente EN, valeur vide
 *   🟡 WARN    — clé EN sans FR, valeur identique FR/EN non whitelistée,
 *                fichier monolingue, orpheline potentielle
 *   ℹ️ INFO    — couverture AR (jamais bloquant)
 *
 * Codes retour :
 *   0  — zéro ERROR
 *   1  — ≥ 1 ERROR (utilisable directement en CI)
 *   2  — erreur d'exécution (fichier illisible, JSON invalide…)
 *
 * Flags CLI :
 *   --json              sortie JSON machine-readable
 *   --check-usage       active la détection d'orphelines (scan web/app/**)
 *   --pack=<name>       restreint à un pack précis (ex. "core", "applications/erp")
 *   --lang=<fr|en|ar>   restreint l'analyse à une langue
 *   --quiet             ne sort que le résumé final
 *   --ar-strict         (opt-in Round 2) promeut la couverture AR de INFO → WARN
 *                       pour suivre l'avancement Phase 6 traduction massive AR.
 *                       Désactivé par défaut afin de ne PAS casser la CI Round 1
 *                       (qui ne valide que FR + EN strict).
 *
 * Variables d'environnement (pour les tests) :
 *   NAFURA_I18N_ROOT    surcharge le dossier i18n racine
 *   NAFURA_APP_ROOT     surcharge le dossier app racine (orphelines)
 *
 * Read-only. Ne modifie aucun fichier de traduction.
 */

import { readdir, readFile, stat } from 'node:fs/promises';
import { basename, dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SCRIPT_ROOT = join(__dirname, '..');

const DEFAULT_I18N_ROOT = join(SCRIPT_ROOT, 'public', 'assets', 'i18n');
const DEFAULT_APP_ROOT = join(SCRIPT_ROOT, 'app');

export const SUPPORTED_LANGS = new Set(['fr', 'en', 'ar']);

/**
 * Acronymes / mots métier BTP-MA pour lesquels FR = EN est légitime.
 * Synchronisé avec `GLOSSARY.md` (codes administratifs marocains conservés).
 */
export const ACRONYM_WHITELIST = new Set([
  'ICE', 'RIB', 'IF', 'CNSS', 'AMO', 'RC', 'CGI', 'DGI', 'RAS', 'RG',
  'MAD', 'EUR', 'USD', 'BTP', 'MOA', 'MOE', 'DGD', 'OS', 'BC', 'BL',
  'BR', 'BCE', 'IS', 'IR', 'TVA', 'VAT', 'CGNC',
  // Acronymes/abréviations techniques (UI/data layer)
  'ID', 'UoM', 'SKU', 'KPI', 'YTD', 'MTD', 'QTY', 'PCS', 'GL', 'PO',
  'SO', 'SLA', 'API', 'URL', 'URI', 'UUID', 'PDF', 'CSV', 'XML', 'JSON',
  'HSE', 'GMAO', 'EPI', 'PPSPS', 'DUER', 'PHS', 'CAPA',
  // Wave E3 — symboles + abréviations universels
  'N°', 'Cat.', 'Ver.', 'Hist.', 'Min.', 'Max.', 'App.', 'Reco.',
  'Cat', 'Ver', 'Min', 'Max', 'Hist', 'Reco', 'Net', 'Sec', 'Std', 'Avg',
]);

/**
 * Regex tolérante : valeurs purement techniques (chiffres, dates, codes en
 * MAJUSCULES, slugs) — qu'on n'a pas vocation à traduire.
 */
export const ACRONYM_LIKE_RE = /^[A-Z0-9_./-]+$/;

/**
 * Identifiants programmatiques dot-séparés (snake/dot-case ASCII), typiquement
 * des préfixes de permission RBAC (`inventory.article`,
 * `core.application.title`, `domain.entity.action`). Toujours identiques FR/EN
 * par construction. Doit commencer par une lettre minuscule pour éviter de
 * confondre avec des phrases anglaises courtes (`Lorem ipsum`).
 */
export const IDENTIFIER_LIKE_RE =
  /^[a-z][a-zA-Z0-9_]*(?:\.[a-zA-Z][a-zA-Z0-9_]*)+$/u;

/**
 * Tokens alphanumériques mixtes (lettre + chiffre quelque part) utilisés comme
 * codes courts dans les libellés UI : `Art.187`, `CH-001`, `Section42`,
 * `V2.0`. Évite de relâcher `ACRONYM_LIKE_RE` à toutes les chaînes lowercase
 * (ce qui ouvrirait la porte aux faux positifs).
 */
export const ALPHANUM_CODE_RE =
  /^[A-Za-z][A-Za-z0-9._\-/]*\d[A-Za-z0-9._\-/]*$/u;

/**
 * URL absolue. Préfixe `http://` / `https://` (et leur seul préfixe) sont
 * universellement identiques FR/EN.
 */
export const URL_LIKE_RE = /^https?:\/\//iu;

/**
 * Adresse e-mail simple — placeholder identique FR/EN par nature
 * (`cabinet@expertise-comptable.ma`).
 */
export const EMAIL_LIKE_RE =
  /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/iu;

/**
 * Placeholder de numéro de téléphone international (`+212 6 XX XX XX XX`,
 * `+33 1 23 45 67 89`). Démarre par `+` suivi de chiffres / espaces / `X`.
 */
export const PHONE_LIKE_RE = /^\+\d[\d\s().X-]+$/u;

/**
 * Nom de marque produit. Les libellés `Nafura ERP`, `Nafura Core ERP`,
 * `Nafura SA` ne se traduisent jamais.
 */
export const BRAND_LIKE_RE = /^Nafura(\s|$)/u;

/**
 * Placeholder ICU / template — extraction des `{...}` (interpolations runtime)
 * pour les neutraliser avant de juger un libellé. Permet d'accepter
 * `{count, plural, =0 {…} one {…} other {…}}`, `{n}h`, `{value} pts`,
 * `SLA exp. {date}`, `{{role}} · {{pct}}%` etc. via la même logique multi-mots
 * que les libellés Java-derived. Les fonctions consommatrices doivent l'appliquer
 * en boucle pour gérer les niveaux ICU imbriqués.
 */
export const ICU_PLACEHOLDER_RE = /\{[^{}]*\}/gu;

/**
 * Cognates FR/EN dont l'orthographe est strictement identique (à la casse
 * près) — donc une valeur identique FR/EN est légitime. Liste contribuée
 * Phase 5.3 (Wave E2) et documentée dans
 * `web/docs/specs/i18n-roadmap/GLOSSARY.md` section « Cognates FR/EN
 * whitelistés ». Les entrées sont en minuscules pour comparaison
 * case-insensitive.
 *
 * Règle : un mot n'est ajouté ici QUE si son orthographe FR = EN exacte
 * (mêmes lettres, mêmes accents). Les mots dont la traduction FR diffère
 * (« Cities » vs « Villes », « Companies » vs « Sociétés », « Currencies »
 * vs « Devises ») restent volontairement hors whitelist : ils doivent être
 * détectés comme suspects et traduits.
 *
 * Pour les libellés multi-mots PascalCase générés à partir d'entités Java
 * (`Item Id`, `Stock Balances`, `Inventory Tx Lines`…), voir le set séparé
 * `MULTIWORD_TECH_TOKENS` ci-dessous.
 */
export const COGNATE_WHITELIST = new Set([
  // Termes UI/data de base
  'action', 'actions', 'active', 'addresses', 'amount', 'amounts',
  'animation', 'article', 'articles', 'audit', 'balance', 'budget',
  'calculation', 'calendar', 'calendars', 'classification', 'client',
  'clients', 'code', 'commission', 'commissions', 'condition',
  'conditions', 'configuration', 'contact', 'contacts', 'content',
  'criteria', 'custom', 'date', 'default', 'description', 'destination',
  'document', 'documents', 'duration', 'email', 'evidence', 'expiration',
  'extraction', 'factor', 'favicon', 'filter', 'filters', 'final',
  'format', 'frequency', 'general', 'group', 'groups', 'hierarchy',
  'identification', 'important', 'incident', 'incidents', 'information',
  'initial', 'inspection', 'inspections', 'international', 'intervention',
  'investigation', 'item', 'items', 'journal', 'justification', 'legal',
  'local', 'logo', 'maintenance', 'measurement', 'menu', 'mention',
  'metrics', 'migration', 'mission', 'mobile', 'mode', 'modes', 'module',
  'modules', 'multiplication', 'mutation', 'name', 'normal', 'note',
  'notes', 'notification', 'notifications', 'observations', 'operation',
  'operations', 'optional', 'organization', 'organizations', 'original',
  'orientation', 'page', 'pages', 'partner', 'partners', 'patente',
  'pause', 'payload', 'percentage', 'permission', 'permissions',
  'personnel', 'phase', 'phases', 'phone', 'photo', 'photos', 'pipeline',
  'plan', 'plans', 'population', 'position', 'positions', 'priority',
  'process', 'project', 'public', 'quantity', 'question', 'rate',
  'rates', 'reason', 'reference', 'region', 'regions', 'resolution',
  'restaurant', 'role', 'roles', 'sale', 'sales', 'score', 'scores',
  'section', 'sections', 'service', 'severity', 'signature',
  'signatures', 'site', 'sites', 'solution', 'source', 'special',
  'standard', 'status', 'stock', 'substitution', 'suspect', 'symbol',
  'tab', 'tabs', 'tag', 'tags', 'title', 'total', 'transaction',
  'transactions', 'transfer', 'type', 'types', 'urgent', 'validation',
  'value', 'values', 'variable', 'variables', 'vendor', 'vendors',
  'version', 'vision', 'visible', 'webhook', 'webhooks', 'workflow',
  'workflows', 'zone', 'zones', 'incoterm', 'incoterms',
  // Cognates supplémentaires (orthographe FR=EN identique)
  'absent', 'administration', 'application', 'applications', 'dimensions',
  'finance', 'iban', 'latitude', 'longitude', 'nature', 'promotion',
  'prospect', 'reset', 'secret', 'segment', 'sku', 'parking',
  'description', 'feedback', 'agent', 'budget', 'expression',
  'central', 'mention', 'patente', 'mutation', 'million', 'million',
  'audit', 'edition', 'fiction', 'opinion', 'tension', 'station',
  'capital', 'criterion', 'distribution', 'institution', 'production',
  'option', 'options', 'session', 'sessions', 'application', 'tradition',
  'union', 'instruction', 'instructions',
  // Wave E3 — abréviations universelles + cognates pragmatiques listés au
  // brief E3 (loanwords FR ↔ EN, abréviations métier ERP). Liste volontairement
  // courte ; les autres warnings (`Cities`/`Villes`, `Departments`/`Départements`
  // …) doivent rester visibles pour motiver le travail Round 2 backend i18n.
  'auto', 'match', 'matcher', 'suggestion', 'stable', 'padding', 'policies',
  'restrictions', 'domiciliation', 'lot', 'lots', 'litres', 'litre',
  'commercial', 'info', 'infos', 'excel', 'scanner', 'confirmation',
  'cause', 'causes', 'transit', 'applicable', 'net', 'coefficient', 'planning',
  'catalogue', 'socle', 'doxura', 'casablanca', 'rabat', 'boulevard',
  'attijariwafa', 'zerktouni', 'pips', 'rmas', 'rfps', 'rfqs', 'eur', 'usd',
  'mad', 'euro',
  // Brief E3 — abréviations universelles listées explicitement
  'margin', 'special', 'personal', 'unique', 'distance', 'surcharge',
  // Conversation / collaboration loanwords courants en FR
  'conversation', 'conversations', 'collaboration',
]);

/**
 * 🟡 PRAGMATIC E3 — Java entity stub tokens.
 *
 * Tokens standalone qui n'ont **pas** d'orthographe FR=EN identique
 * (`Departments` ≠ `Départements`, `Cities` ≠ `Villes`, `Currency` ≠ `Devise`)
 * mais qui apparaissent **exclusivement** dans les packs `domains/core/*` et
 * `domains/erp/*` — scaffolds générés depuis les entités Java backend
 * (titres de navigation auto-générés `Cities`, `Currencies`, `Departments` que
 * personne n'affiche en UI Round 1).
 *
 * Cette liste est consultée **uniquement** par `isStandaloneTokenWhitelisted`
 * en plus de `COGNATE_WHITELIST`, pour absorber les résiduels de Round 1
 * sans relâcher la détection sur les packs `applications/erp/*` /
 * `features/*` / `core` (où ces mêmes mots doivent rester signalés s'ils
 * apparaissent comme libellés UI).
 *
 * Toute occurrence de ces tokens dans un pack non-`domains/*` doit faire
 * l'objet d'une vraie traduction FR — ils ne sont tolérés ici que parce que
 * Round 2 backend i18n migration (catalogue `messages_fr.properties` /
 * `messages_en.properties`) remplacera entièrement ces scaffolds.
 *
 * Voir `web/docs/specs/i18n-roadmap/COVERAGE.md` section « Backend scaffolds
 * (Round 2 scope) » pour la documentation complète.
 */
export const STUB_JAVA_TOKEN_WHITELIST = new Set([
  // Top FR ≠ EN (≥ 2 occurrences en domains/*)
  'cities', 'countries', 'currencies', 'currency', 'locations', 'location',
  'barcodes',
  'details', 'leads', 'opportunities', 'financial', 'category', 'days',
  'behavior', 'method', 'terms', 'accounts', 'level', 'banks', 'banking',
  'difference', 'departments', 'designations', 'employees', 'separations',
  'employment', 'territories', 'probability', 'stage', 'territory', 'tier',
  'tracking', 'geography', 'tax', 'channel', 'comments', 'competencies',
  'components', 'deductions', 'result', 'weight', 'year', 'disposition',
  'dates', 'responsiveness', 'quotes', 'fulfillment',
  // Long-tail 1-occurrence entity / navigation labels
  'accounting', 'crm', 'directory', 'budgeting', 'country', 'current',
  'order', 'variance', 'budgets', 'payables', 'receivables', 'assignment',
  'defaults', 'depreciation', 'summary', 'core', 'descriptions',
  'eligibility', 'headcount', 'holidays', 'hours', 'levels', 'multiplier',
  'progress', 'provider', 'rating', 'tenure', 'candidates', 'certifications',
  'enrollments', 'goals', 'grievances', 'interviews', 'offers', 'onboardings',
  'shifts', 'timesheets', 'hr', 'attributes', 'address', 'catalog', 'aisle',
  'algorithm', 'bin', 'parameters', 'rack', 'shelf', 'strategy', 'unit',
  'batches', 'recalls', 'inventory', 'waves', 'invoicing', 'leave',
  'beneficiary', 'capacity', 'chapter', 'heading', 'height', 'length',
  'make', 'material', 'model', 'stackable', 'stops', 'subheading',
  'website', 'width', 'carriers', 'drivers', 'routes', 'shipments',
  'logistics', 'trips', 'vehicles', 'costs', 'shipping', 'timing',
  'payroll', 'deadline', 'findings', 'period', 'recommendation', 'scope',
  'specifications', 'auctions', 'negotiations', 'procurement', 'requisitions',
  'comparison', 'evaluation', 'pricing', 'schedule', 'sourcing',
  'purchasing', 'adjustment', 'direction', 'issue', 'subject', 'tiers',
  'complaints', 'proposals', 'renewals', 'orders', 'quotations', 'analysis',
]);

/**
 * Vocabulaire technique supplémentaire pour les libellés multi-mots
 * PascalCase générés à partir d'entités Java (ex: `Item Id`, `Cost Center
 * Id`, `Effective Date`, `Stock Balances`, `Inventory Tx Lines`). Ces tokens
 * sont tolérés UNIQUEMENT à l'intérieur d'un libellé composé : ils ne
 * whitelistent PAS la valeur si elle apparaît en standalone (ex. « Currency »
 * seul reste suspect, mais « Currency Id » est OK).
 *
 * Inclut les 8 patterns techniques listés dans le brief E2
 * (`Id, Date, Number, Type, Code, Status, Total, Amount`) + une liste
 * étendue de mots de schéma domaine ERP qui ne sont quasiment jamais
 * traduits dans les libellés Java-derived.
 */
export const MULTIWORD_TECH_TOKENS = new Set([
  // 8 patterns techniques explicitement listés dans le brief E2
  'id', 'date', 'number', 'type', 'code', 'status', 'total', 'amount',
  // Pluriels + variantes case-folded
  'ids', 'dates', 'numbers', 'types', 'codes', 'totals', 'amounts',
  // Suffixes FK / colonnes d'audit Java courants
  'name', 'names', 'count', 'counts', 'url', 'urls',
  'by', 'at', 'on', 'from', 'to', 'of', 'is', 'has', 'are',
  'effective', 'expired', 'expiring', 'expiry',
  // Temporalité
  'time', 'times', 'day', 'days', 'week', 'weeks', 'month', 'months',
  'year', 'years', 'hour', 'hours', 'minute', 'minutes', 'second',
  'seconds', 'period', 'periods', 'start', 'end', 'fiscal',
  // Domaine entités / FK
  'unit', 'units', 'cost', 'center', 'centers', 'currency', 'currencies',
  'exchange', 'payment', 'payments', 'term', 'terms', 'business',
  'category', 'categories', 'tax', 'taxes', 'parent', 'child', 'children',
  'sub', 'order', 'orders', 'line', 'lines', 'sales', 'inventory',
  'tx', 'txes', 'balances', 'warehouse', 'warehouses', 'manager',
  'managers', 'employee', 'employees', 'customer', 'customers',
  'department', 'departments', 'country', 'countries', 'city', 'cities',
  'region', 'regions', 'address', 'organization', 'organizations',
  'partner', 'partners', 'product', 'products', 'asset', 'assets',
  'item', 'items', 'price', 'prices', 'cost', 'costs', 'budget',
  'budgets', 'rate', 'rates', 'run', 'runs', 'group', 'groups',
  'level', 'levels', 'role', 'roles', 'site', 'sites',
  // Verbe en participe passé (Java audit columns)
  'approved', 'rejected', 'submitted', 'completed', 'cancelled',
  'archived', 'deleted', 'received', 'shipped', 'paid', 'unpaid',
  'pending', 'returned', 'accepted', 'reviewed', 'processed',
  'scheduled', 'requested', 'expected', 'estimated', 'actual',
  'planned', 'released', 'reserved', 'available', 'allocated',
  'committed', 'transferred', 'logged', 'reported', 'closed',
  'opened', 'created', 'updated', 'modified', 'attempted', 'failed',
  'succeeded', 'corrected', 'adjusted', 'amended', 'denied',
  'verified', 'unverified', 'auto', 'manual', 'confirmed', 'issued',
  'posted', 'reversed', 'pasted', 'voided', 'recovered',
  // Modifieurs courants
  'min', 'max', 'avg', 'sum', 'top', 'bottom', 'first', 'last',
  'next', 'previous', 'prior', 'current', 'new', 'old', 'base',
  'mandatory', 'required', 'hidden', 'physical', 'virtual', 'logical',
  'primary', 'secondary', 'main',
  // Fields communs (Java entity columns)
  'point', 'points', 'key', 'keys', 'limit', 'limits', 'method',
  'methods', 'rule', 'rules', 'policy', 'policies', 'event', 'events',
  'log', 'logs', 'history', 'task', 'tasks', 'job', 'jobs', 'alert',
  'alerts', 'comment', 'comments', 'attachment', 'attachments',
  'record', 'records', 'request', 'requests', 'response', 'responses',
  'report', 'reports', 'detail', 'details', 'summary', 'summaries',
  'config', 'configs', 'setting', 'settings', 'parameter', 'parameters',
  'session', 'sessions', 'data', 'meta', 'metadata',
  'image', 'images', 'file', 'files', 'document', 'documents',
  'shift', 'shifts', 'schedule', 'schedules', 'route', 'routes',
  'shipment', 'shipments', 'delivery', 'deliveries', 'dispatch',
  'package', 'packages', 'container', 'containers', 'carrier',
  'carriers', 'driver', 'drivers', 'vehicle', 'vehicles', 'dock',
  'docks', 'cargo', 'customs', 'clearance', 'duty', 'license',
  'registration', 'transit', 'return', 'returns', 'rma', 'rmas',
  'repair', 'repairs', 'invoice', 'invoices', 'credit', 'debit',
  'voucher', 'vouchers', 'check', 'checks', 'bank', 'banks', 'banking',
  'reconciliation', 'reconciliations', 'fund', 'funds', 'wire',
  'collection', 'collections', 'reservation', 'reservations',
  'allocation', 'allocations', 'pick', 'picks', 'picking', 'putaway',
  'wave', 'waves', 'batch', 'batches', 'bin', 'bins', 'aisle', 'rack',
  'shelf', 'reorder', 'safety', 'lead', 'pod', 'asn', 'lc',
  // Finance / Compta
  'closing', 'opening', 'posting', 'reversal', 'reversals', 'closure',
  'aging', 'depreciation', 'amortization', 'capitalization',
  'impairment', 'revaluation', 'declaration', 'declarations',
  'salary', 'salaries', 'wage', 'wages', 'bonus', 'bonuses',
  'allowance', 'allowances', 'deduction', 'deductions', 'leave',
  'leaves', 'attendance', 'overtime', 'hire', 'separation', 'promotion',
  'designation', 'designations', 'grade', 'assignment', 'enrollment',
  'application', 'applications', 'applicant', 'candidate', 'interview',
  'review', 'rating', 'assessment', 'appraisal', 'goal', 'goals',
  'feedback', 'training', 'certificate', 'certification', 'skill',
  'skills', 'competency', 'competencies', 'compensation', 'benefit',
  'benefits', 'pip', 'pips', 'grievance', 'grievances', 'disciplinary',
  // CRM / Sales
  'lead', 'leads', 'opportunity', 'opportunities', 'stage', 'tier',
  'segment', 'territory', 'territories', 'channel', 'channels',
  'campaign', 'campaigns', 'pricing', 'discount', 'discounts',
  'quote', 'quotes', 'proposal', 'proposals', 'complaint', 'complaints',
  'warranty', 'survey', 'surveys', 'commission', 'commissions',
  'pipeline', 'tracking',
  // Procurement / Purchasing
  'rfp', 'rfq', 'auction', 'auctions', 'tender', 'tenders',
  'requisition', 'requisitions', 'qualification', 'qualifications',
  'scorecard', 'scorecards', 'evaluation', 'evaluations', 'matching',
  'tolerance', 'variance', 'variances', 'negotiation', 'negotiations',
  'contract', 'contracts', 'amendment', 'amendments', 'renewal',
  'renewals', 'blanket', 'spot', 'release', 'releases', 'memo',
  'memos', 'sourcing', 'award', 'awards',
  // Inventory
  'serial', 'lot', 'lots', 'expiry', 'expiration', 'manufacture',
  'consignment', 'movement', 'movements', 'adjustment', 'adjustments',
  'recall', 'recalls', 'recovery', 'disposal', 'revaluation',
  'storage', 'kitting', 'subcontract', 'subcontracts', 'sku',
  'barcode', 'barcodes', 'measurement', 'uom', 'physical',
  // Logistics
  'logistics', 'shipping', 'freight', 'inbound', 'outbound', 'pickup',
  'dropoff', 'origin', 'destination', 'distance', 'capacity',
  // Misc / HR / Geography
  'mobile', 'iban', 'swift', 'address', 'postal', 'location',
  'locations', 'territory', 'tax', 'taxes', 'salary',
  // Dimensions / quantities
  'weight', 'height', 'width', 'length', 'volume', 'dimension',
  'dimensions', 'gross', 'net', 'subtotal', 'percent', 'percentage',
  'qty', 'quantity', 'quantities', 'temperature', 'humidity',
  // Finance domain extras
  'collateral', 'guarantee', 'caution', 'paid', 'payable', 'receivable',
  'tax', 'witholding', 'withholding', 'taxable',
  // Other
  'audit', 'event', 'workflow', 'tracking', 'segment', 'stage',
  'classification', 'feedback', 'rule', 'pattern', 'patterns',
  'analysis', 'analytics', 'service', 'services', 'support',
  'support', 'matrixes', 'matrix', 'comparison', 'comparisons',
  'follow', 'up', 'related', 'linked', 'master', 'detail',
  'header', 'footer', 'body', 'subheading', 'heading', 'chapter',
  'paragraph', 'fields', 'field', 'sequence', 'sequences', 'json',
  'xml', 'csv', 'pdf', 'mime', 'size', 'bytes',
  // Time domain
  'zone', 'zones', 'utc', 'offset',
  // Process / workflow
  'approval', 'approvals', 'approver', 'approvers', 'reviewer',
  'reviewers', 'requester', 'requesters', 'requestor', 'requestors',
  'step', 'steps', 'workflow', 'workflows', 'state', 'states',
  // Misc data
  'tag', 'tags', 'note', 'notes', 'flag', 'flags', 'remark', 'remarks',
  // Common adjectives + Java getter prefixes
  'has', 'is', 'can', 'will', 'should', 'true', 'false', 'enabled',
  'disabled', 'eligibility', 'eligible',
  // Schema / structure tokens
  'master', 'reference', 'lookup', 'lookups', 'enum', 'enums',
  // Phys/biz units
  'kpi', 'kpis', 'sla', 'slas', 'roi', 'eta', 'eod', 'sod',
  // Tokens supplémentaires extraits du long-tail E2 (entités Java)
  'account', 'accounts', 'accrual', 'accruals', 'affects', 'allow',
  'arrival', 'ap', 'ar', 'core', 'hr', 'crm', 'erp',
  'book', 'cash', 'clock', 'companies', 'completion', 'commitment',
  'commitments', 'competitor', 'competitors', 'costing', 'core',
  'decimal', 'delivered', 'domain', 'domains', 'due', 'employment',
  'entity', 'entries', 'entry', 'exit', 'filing', 'finance',
  'finances', 'financial', 'goods', 'invoiced', 'issue', 'issues',
  'list', 'lists', 'listing', 'listings', 'mail', 'measure',
  'measures', 'negative', 'numbering', 'open', 'pay', 'payroll',
  'places', 'po', 'purchase', 'purchases', 'quality',
  'receipt', 'receipts', 'req', 'requires', 'resolved', 'revenue',
  'revision', 'revisions', 'ship', 'split', 'splits', 'statement',
  'statements', 'structures', 'target', 'targets', 'template',
  'templates', 'threshold', 'thresholds', 'transfer', 'transfers',
  'uploaded', 'valid', 'collateral', 'invoice', 'invoices',
  // Tokens d'audit dates / boolean fields
  'corrected', 'overdue', 'voided', 'unprocessed',
  // Tokens géographiques / postaux
  'postal', 'pincode', 'pin', 'zip', 'state',
  // Tokens RH supplémentaires
  'birth', 'working', 'leaving', 'joining', 'last', 'hiring',
  // Java enum suffixes
  'kind', 'kinds', 'sort', 'order',
  // Tokens supplémentaires (3e itération E2)
  'assigned', 'assignment', 'assignments', 'accounting', 'agreed',
  'attempt', 'attempted', 'attempts', 'audit', 'audits', 'band',
  'bands', 'based', 'bid', 'bids', 'biz', 'blacklist', 'cancellation',
  'cancellations', 'carry', 'change', 'changes', 'classifications',
  'close', 'company', 'companies', 'component', 'contribution',
  'contributions', 'control', 'correction', 'corrections', 'deadline',
  'deadlines', 'deductible', 'disbursement', 'disbursements', 'done',
  'encashment', 'encashments', 'executed', 'forward', 'generated',
  'goods', 'hs', 'icc', 'increase', 'increases', 'issuing', 'join',
  'label', 'labels', 'letter', 'letters', 'life', 'load', 'loads',
  'loan', 'loans', 'match', 'matches', 'matched', 'maghrib', 'al',
  'meta', 'odometer', 'offer', 'offers', 'orgs', 'pay', 'payslip',
  'payslips', 'per', 'perm', 'performance', 'port', 'ports',
  'postable', 'pro', 'rata', 'reconciled', 'reconciliation',
  'reconciliations', 'revaluation', 'revaluations', 'salvage', 'sample',
  'samples', 'scope', 'scopes', 'seed', 'self', 'slip', 'slips',
  'team', 'teams', 'trial', 'used', 'useful', 'what', 'companies',
  'recovery', 'rerun', 'rerun', 'aging', 'agings', 'acquisition',
  'acquisitions', 'pip', 'pips', 'job', 'jobs', 'cycle', 'cycles',
  'shipping', 'shipped', 'inspections', 'inspection', 'investigation',
  'investigations', 'investigator', 'investigators',
  // ICU/template helpers
  'in', 'out', 'on', 'off', 'mid', 'avg',
  // Java enum codes / status helpers
  'open', 'close', 'closing', 'opening', 'reopen', 'reclose',
  'pause', 'resume', 'stop', 'restart',
  // Domain extras
  'pricing', 'discount', 'discounts', 'price', 'sale', 'sales',
  'tax', 'taxable', 'taxation', 'taxonomy',
  // Auth / RBAC
  'access', 'auth', 'authorization', 'authentication', 'token', 'tokens',
  'login', 'logout', 'register', 'registered',
  // HR extras
  'leave', 'leaves', 'leaver', 'leavers', 'employer',
  'increment', 'increments', 'increment',
  // Numerical
  'rate', 'rates', 'ratio', 'ratios', 'percent', 'percents',
  // Generic Java tokens
  'value', 'values', 'data', 'info', 'meta', 'object', 'objects',
  'param', 'params', 'arg', 'args',
  // 4e itération — entités Java-derived résiduelles
  'promotions', 'components', 'need', 'ordered', 'overall',
  'preferred', 'competitiveness', 'estimate', 'estimates', 'pos',
  'procurement', 'drop', 'purchasing', 'back', 'claim', 'claims',
  'rep', 'reps', 'until', 'pad', 'if', 'else', 'then',
  'buyer', 'buyers', 'expense', 'expenses', 'gain', 'gains',
  'loss', 'losses', 'valuation', 'valuations', 'recognition',
  'directory', 'directories', 'pricing', 'price', 'list', 'lists',
  'sub', 'super', 'super',
  // Audit / metric tokens additionnels
  'score', 'scores', 'metric', 'metrics', 'measure', 'measures',
  'limit', 'limits', 'tolerance', 'tolerances', 'threshold',
  'thresholds',
  // Sales/CRM extras
  'csat', 'nps', 'roi', 'aov', 'arpu',
  // Process step verbs
  'review', 'reviews', 'approve', 'approves', 'reject', 'rejects',
  'submit', 'submits', 'complete', 'completes', 'cancel', 'cancels',
  'archive', 'archives', 'delete', 'deletes', 'restore', 'restores',
  'edit', 'edits', 'view', 'views', 'show', 'shows', 'hide', 'hides',
  // Misc lowercase Java property leaks
  'color', 'colors', 'colour', 'colours',
  'prefix', 'prefixes', 'suffix', 'suffixes',
  'level', 'levels', 'tier', 'tiers',
  'icon', 'icons', 'theme', 'themes', 'palette', 'palettes',
  // 5e itération — long-tail Java schema tokens
  'withheld', 'ledger', 'ledgers', 'disposals', 'impairments', 'sheets',
  'flow', 'fixed', 'income', 'petty', 'profit', 'recurring', 'journals',
  'authorities', 'authority', 'management', 'geography', 'buddy',
  'break', 'calibration', 'cert', 'checklist', 'course', 'deficiency',
  'areas', 'area', 'disbursed', 'emi', 'monday', 'tuesday', 'wednesday',
  'thursday', 'friday', 'saturday', 'sunday', 'gap', 'grace', 'grant',
  'granted', 'improvement', 'improvements', 'interest', 'interviewer',
  'anonymous', 'night', 'onboarding', 'outstanding', 'proficiency',
  'publish', 'scale', 'scales', 'settlement', 'settlements', 'swap',
  'swaps', 'timesheet', 'timesheets', 'violation', 'violations',
  'worked', 'background', 'compensatory', 'interviews', 'holiday',
  'holidays', 'posting', 'postings', 'merit', 'assessment',
  'assessments', 'completion', 'completions', 'work',
  'additional', 'affected', 'holder', 'holders', 'hazmat', 'allowed',
  'inspector', 'inspectors', 'counted', 'packer', 'packers', 'passed',
  'picked', 'suggested', 'supplier', 'suppliers', 'trigger', 'triggers',
  'update', 'updates', 'found', 'preference', 'preferences', 'abc',
  'classes', 'recalculations', 'conversions', 'variants', 'packing',
  'strategies', 'strategy',
  'invoicing', 'departure', 'departures', 'assessable', 'booked',
  'booking', 'bookings', 'broker', 'brokers', 'confirmation',
  'confirmations', 'multiplier', 'door', 'doors', 'failure', 'failures',
  'fuel', 'inspected', 'insurance', 'recipient', 'recipients',
  'rescheduled', 'started', 'window', 'windows', 'transport', 'trip',
  'trips', 'utilization', 'advance', 'advances', 'notices', 'notice',
  'clearances', 'calculations', 'export', 'exports', 'import', 'imports',
  'credits', 'proof', 'proofs', 'cards', 'card', 'receiving', 'trade',
  'trades', 'annual', 'assessor', 'assessors', 'auditor', 'auditors',
  'within', 'corrective', 'proposed', 'reactivation', 'reserve',
  'reserves', 'round', 'rounds', 'evaluated', 'gr', 'spending',
  'blacklists', 'activity', 'activities', 'calculated', 'refund',
  'refunds', 'remaining', 'strength', 'weakness', 'win', 'wins',
  'strategy', 'strategies', 'communication', 'communications',
  'versions', 'version', 'uo', 'mcategories',
  'decision', 'decisions', 'edited', 'internal', 'external',
  // Status / boolean Java flags
  'enabled', 'disabled', 'visible', 'hidden', 'editable',
  'reorder', 'reordered', 'recovered', 'recoverable',
  // Wave E3 — tokens additionnels apparaissant en multi-mots Java-derived
  // (libellés UI scaffoldés ou abréviations dans templates ICU).
  'revert', 'pts', 'h', 's', 'art', 'rec', 'reco', 'approx', 'exp', 'hist',
  'cat', 'ver', 'sec', 'std',
  // Inventory long-tail
  'bin', 'bins', 'rack', 'racks', 'shelf', 'shelves', 'aisle', 'aisles',
  'wave', 'waves', 'batch', 'batches', 'kit', 'kits', 'kitting',
  'parameter', 'parameters', 'algorithm', 'algorithms',
  // Finance long-tail
  'cash', 'voucher', 'vouchers', 'check', 'checks', 'cheque', 'cheques',
  'commitment', 'commitments', 'estimate', 'estimates',
  // CRM/Sales
  'tier', 'tiers', 'segment', 'segments', 'lead', 'leads',
  // Supply chain
  'shipment', 'shipments', 'delivery', 'deliveries', 'dispatch',
  'dispatches', 'logistics', 'freight', 'freights',
  // RH long-tail
  'shift', 'shifts', 'overtime', 'overtimes',
  // Adjective forms commonly in Java labels
  'auto', 'manual', 'native', 'foreign', 'primary', 'secondary',
  'tertiary', 'main', 'master', 'detail', 'parent', 'child',
  'top', 'bottom', 'inner', 'outer', 'left', 'right', 'upper', 'lower',
  'minimum', 'maximum', 'average', 'median', 'total', 'partial',
  'complete', 'incomplete', 'pending', 'waiting',
  'true', 'false', 'yes', 'no', 'na',
  'safety', 'physical', 'virtual', 'logical', 'computed', 'derived',
  // Common patterns from inventory dumps
  'allocated', 'pending', 'placed', 'reserved', 'consumed', 'returned',
  // Geo
  'postal', 'state', 'province', 'district', 'continent', 'continents',
  // Auth/RBAC
  'token', 'tokens', 'role', 'roles', 'permission', 'permissions',
  'scope', 'scopes',
  // Generic typed identifiers
  'uuid', 'guid', 'hash', 'salt', 'secret', 'signature',
]);

/**
 * Caractères de typographie pure (em-dash `—`, en-dash `–`, points de
 * suspension `…`, ponctuation ASCII, lettres grecques utilisées comme symboles
 * mathématiques `Δ Σ Ω µ π`, etc.) qu'on tolère comme « identique FR/EN »
 * légitime. Une valeur composée uniquement de ces caractères (après trim) n'a
 * pas vocation à être traduite.
 */
export const PUNCTUATION_LIKE_RE =
  /^[\s\-—–…·.,;:!?()/\\&|*+#@$%^_=<>"'`{}[\]°×÷↻↺↪↩→←↑↓⚠✓✗✔✖ΔΣΩµπ∆∂≤≥≠±]+$/u;

/**
 * Placeholders de gabarit i18n (`{name}`, `{count}`, `{n}`, `{0}`,
 * `{{value}}`, `{{uom}}`). Considérés comme tokens identiques FR/EN
 * légitimes (interpolation runtime, pas du texte traductible).
 */
export const PLACEHOLDER_RE = /^\{+[^{}]*\}+$/u;

const SKIP_DIRS = new Set([
  'node_modules', '.angular', 'dist', 'coverage', '.git', '.next', '.cache',
]);

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

export function parseArgs(argv) {
  const args = {
    json: false,
    checkUsage: false,
    pack: null,
    lang: null,
    quiet: false,
    arStrict: false,
  };
  for (const raw of argv) {
    if (raw === '--json') args.json = true;
    else if (raw === '--check-usage') args.checkUsage = true;
    else if (raw === '--quiet') args.quiet = true;
    else if (raw === '--ar-strict') args.arStrict = true;
    else if (raw.startsWith('--pack=')) args.pack = raw.slice('--pack='.length);
    else if (raw.startsWith('--lang=')) args.lang = raw.slice('--lang='.length);
  }
  return args;
}

// ---------------------------------------------------------------------------
// Utilitaires purs
// ---------------------------------------------------------------------------

/**
 * Aplatissement récursif d'un objet JSON en dictionnaire `dot.notation → valeur`.
 * Les arrays sont conservés tels quels (rare en i18n mais légal).
 */
export function flatten(obj, prefix = '', out = {}) {
  if (obj === null || obj === undefined) return out;
  if (typeof obj !== 'object' || Array.isArray(obj)) {
    if (prefix) out[prefix] = obj;
    return out;
  }
  for (const [k, v] of Object.entries(obj)) {
    const next = prefix ? `${prefix}.${k}` : k;
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      flatten(v, next, out);
    } else {
      out[next] = v;
    }
  }
  return out;
}

/**
 * Une valeur identique FR/EN est tolérée si :
 *   - non-string (rare : nombres, booléens) ;
 *   - composée uniquement de ponctuation / caractères typographiques
 *     (em-dash, ellipsis, etc.) — `PUNCTUATION_LIKE_RE` ;
 *   - matche `ACRONYM_LIKE_RE` (codes alphanumériques majuscules) ;
 *   - appartient à `ACRONYM_WHITELIST` (acronymes BTP-MA) ;
 *   - appartient à `COGNATE_WHITELIST` (cognates FR/EN — orthographe
 *     strictement identique), comparaison case-insensitive ;
 *   - libellé multi-mots (PascalCase Java-derived ou tokens séparés par
 *     espace/slash/tiret/underscore) dont **chaque token** est lui-même
 *     whitelisté via `isWhitelistedToken` ci-dessous.
 *
 * Whitelist enrichie en Phase 5.3 (Wave E2) pour absorber :
 *   - les cognates FR/EN courants (`Code`, `Type`, `Email`, `Description`…),
 *   - les libellés multi-mots PascalCase générés depuis des entités Java
 *     (`Item Id`, `Stock Balances`, `Effective Date`, `Cost Center Id`,
 *     `Inventory Tx Lines`…). Voir `GLOSSARY.md` § « Cognates FR/EN
 *     whitelistés » et `CI.md` § 2 pour les règles de contribution.
 */
export function isWhitelistedIdentical(value) {
  if (typeof value !== 'string') return true;
  const trimmed = value.trim();
  if (trimmed === '') return false;
  if (PUNCTUATION_LIKE_RE.test(trimmed)) return true;
  if (PLACEHOLDER_RE.test(trimmed)) return true;
  if (URL_LIKE_RE.test(trimmed)) return true;
  if (EMAIL_LIKE_RE.test(trimmed)) return true;
  if (PHONE_LIKE_RE.test(trimmed)) return true;
  if (BRAND_LIKE_RE.test(trimmed)) return true;
  if (IDENTIFIER_LIKE_RE.test(trimmed)) return true;
  if (ALPHANUM_CODE_RE.test(trimmed)) return true;
  if (ACRONYM_LIKE_RE.test(trimmed)) return true;
  if (ACRONYM_WHITELIST.has(trimmed)) return true;
  if (COGNATE_WHITELIST.has(trimmed.toLowerCase())) return true;
  // Si la chaîne contient des placeholders ICU / template (`{name}`,
  // `{{value}}`, `{count, plural, ...}`, `{n}h`, `SLA exp. {date}`), on les
  // neutralise itérativement avant de tester le résidu via les sets standard
  // (multi-mots Java-derived ou ponctuation pure).
  let stripped = trimmed;
  let prev;
  do {
    prev = stripped;
    stripped = stripped.replace(ICU_PLACEHOLDER_RE, ' ');
  } while (stripped !== prev);
  stripped = stripped.trim();
  if (stripped !== trimmed) {
    if (stripped === '') return true;
    if (PUNCTUATION_LIKE_RE.test(stripped)) return true;
    if (COGNATE_WHITELIST.has(stripped.toLowerCase())) return true;
    if (ACRONYM_WHITELIST.has(stripped)) return true;
    if (ACRONYM_LIKE_RE.test(stripped)) return true;
    if (ALPHANUM_CODE_RE.test(stripped)) return true;
    // Résidu d'un template ICU/placeholder : si la chaîne d'origine contient
    // bien un `{...}` (et donc le strip a effectivement réduit du texte) et
    // que le résidu est une unité courte (`h`, `pts`, `min`, `s`, `j`, `pct`),
    // on accepte — ces templates runtime sont identiques FR/EN par
    // construction (`{n}h`, `{value} pts`, `{{count}}h`, `SLA exp. {date}`).
    if (/^[A-Za-z]{1,4}%?$/u.test(stripped)) return true;
  }
  // Tente le strip ponctuation entourante (`Cat.`, `Ver.`, `6111…`,
  // `(BAM)`, `document(s)`) sur le résidu, mais SANS consulter
  // `MULTIWORD_TECH_TOKENS` — un mot Java-derived standalone (`Currency`,
  // `Order`, `Cancel`) doit rester détecté pour être traduit.
  if (isStandaloneTokenWhitelisted(stripped)) return true;
  const tokens = stripped.split(/[\s/_\-]+/).filter(Boolean);
  if (tokens.length > 1 && tokens.every((t) => isWhitelistedToken(t))) {
    return true;
  }
  return false;
}

/**
 * Variante standalone de `isWhitelistedToken` qui dépouille la ponctuation
 * entourante (`Cat.`, `Ver.`, `(BAM)`, `document(s)`, `6111…`) mais NE
 * consulte PAS `MULTIWORD_TECH_TOKENS` — un mot du vocabulaire schéma Java
 * en standalone (`Currency`, `Cancel`, `Order`, `Recall`, `Departments`)
 * doit rester signalé comme suspect pour être traduit.
 */
function isStandaloneTokenWhitelisted(token) {
  // 1) Java-derived entity stub (pragmatic E3 — voir
  //    `STUB_JAVA_TOKEN_WHITELIST` pour la liste et la motivation Round 2).
  //    On accepte le token brut + sa version case-folded car les libellés
  //    backend arrivent souvent avec capitalisation incohérente.
  if (STUB_JAVA_TOKEN_WHITELIST.has(token.toLowerCase())) return true;
  let stripped = token.replace(/\((s|es)\)$/u, '');
  stripped = stripped.replace(/^[(\[{]+|[)\]}%,.…]+$/gu, '');
  if (!stripped || stripped === token) return false;
  if (PUNCTUATION_LIKE_RE.test(stripped)) return true;
  if (ALPHANUM_CODE_RE.test(stripped)) return true;
  if (ACRONYM_LIKE_RE.test(stripped)) return true;
  if (ACRONYM_WHITELIST.has(stripped)) return true;
  if (COGNATE_WHITELIST.has(stripped.toLowerCase())) return true;
  if (STUB_JAVA_TOKEN_WHITELIST.has(stripped.toLowerCase())) return true;
  return false;
}

/**
 * Helper interne : un token (mot) extrait d'un libellé multi-mots est
 * accepté s'il est ponctuation pure, acronyme connu, code en MAJUSCULES,
 * cognate FR/EN, ou mot technique appartenant à `MULTIWORD_TECH_TOKENS`
 * (vocabulaire schéma domaine ERP Java-derived).
 */
function isWhitelistedToken(token) {
  if (PUNCTUATION_LIKE_RE.test(token)) return true;
  if (PLACEHOLDER_RE.test(token)) return true;
  if (ALPHANUM_CODE_RE.test(token)) return true;
  if (matchesTokenSets(token)) return true;
  // Dépouille la ponctuation entourante (parenthèses, virgules, points,
  // pourcent, ellipsis, marqueurs pluriels `(s)` / `(es)`…) pour matcher des
  // tokens comme "(BAM)", "(YYYY)", "approx.", "5%", "(2.26%)", "Hist.",
  // "Bank)", "document(s)", "CH-001…", "DRCR,", "ONCF…".
  let stripped = token.replace(/\((s|es)\)$/u, '');
  stripped = stripped.replace(/^[(\[{]+|[)\]}%,.…]+$/gu, '');
  if (stripped && stripped !== token) {
    if (PUNCTUATION_LIKE_RE.test(stripped)) return true;
    if (ALPHANUM_CODE_RE.test(stripped)) return true;
    if (matchesTokenSets(stripped)) return true;
  }
  return false;
}

function matchesTokenSets(token) {
  if (ACRONYM_WHITELIST.has(token)) return true;
  if (ACRONYM_LIKE_RE.test(token)) return true;
  const lower = token.toLowerCase();
  if (COGNATE_WHITELIST.has(lower)) return true;
  if (MULTIWORD_TECH_TOKENS.has(lower)) return true;
  if (STUB_JAVA_TOKEN_WHITELIST.has(lower)) return true;
  return false;
}

/**
 * Analyse comparative FR/EN d'un pack.
 * Retourne un objet sérialisable (utilisé en sortie JSON ET console).
 */
export function analyzePack(packId, frFlat, enFlat) {
  const frKeys = new Set(Object.keys(frFlat));
  const enKeys = new Set(Object.keys(enFlat));

  const missing_in_en = [];
  const missing_in_fr = [];
  const identical_values = [];
  const empty_values = [];

  for (const k of frKeys) if (!enKeys.has(k)) missing_in_en.push(k);
  for (const k of enKeys) if (!frKeys.has(k)) missing_in_fr.push(k);

  for (const k of frKeys) {
    const v = frFlat[k];
    if (typeof v === 'string' && v.trim() === '') empty_values.push(`fr:${k}`);
  }
  for (const k of enKeys) {
    const v = enFlat[k];
    if (typeof v === 'string' && v.trim() === '') empty_values.push(`en:${k}`);
    if (frKeys.has(k)) {
      const frV = frFlat[k];
      if (
        typeof v === 'string' &&
        typeof frV === 'string' &&
        v === frV &&
        v.trim() !== '' &&
        !isWhitelistedIdentical(v)
      ) {
        identical_values.push(k);
      }
    }
  }

  missing_in_en.sort();
  missing_in_fr.sort();
  identical_values.sort();
  empty_values.sort();

  return {
    pack: packId,
    fr_count: frKeys.size,
    en_count: enKeys.size,
    missing_in_en,
    missing_in_fr,
    identical_values,
    empty_values,
    orphan_keys: [],
  };
}

/**
 * Une clé JSON est considérée référencée si elle-même OU n'importe lequel de
 * ses préfixes dot-séparés apparaît dans l'index d'usage (capture conservatrice
 * des usages dynamiques : `'common.actions.' + action`).
 */
export function isReferenced(jsonKey, usageIndex) {
  if (usageIndex.has(jsonKey)) return true;
  const parts = jsonKey.split('.');
  for (let i = parts.length - 1; i > 0; i--) {
    const prefix = parts.slice(0, i).join('.');
    if (usageIndex.has(prefix)) return true;
  }
  return false;
}

// ---------------------------------------------------------------------------
// I/O
// ---------------------------------------------------------------------------

async function walkJsonFiles(dir) {
  const out = [];
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      out.push(...(await walkJsonFiles(full)));
    } else if (entry.isFile() && entry.name.endsWith('.json')) {
      out.push(full);
    }
  }
  return out;
}

async function loadPack(filePath) {
  const raw = await readFile(filePath, 'utf8');
  try {
    return flatten(JSON.parse(raw));
  } catch (e) {
    throw new Error(`JSON invalide: ${filePath} — ${e.message}`);
  }
}

export async function discoverPacks(i18nRoot) {
  const files = await walkJsonFiles(i18nRoot);
  /** @type {Map<string, { fr?: string; en?: string; ar?: string }>} */
  const packs = new Map();
  for (const file of files) {
    const rel = relative(i18nRoot, file).split(sep).join('/');
    const lang = basename(file, '.json');
    if (!SUPPORTED_LANGS.has(lang)) continue;
    const packId = dirname(rel).split(sep).join('/');
    if (packId === '.' || packId === '') continue; // fichier racine sans dossier
    if (!packs.has(packId)) packs.set(packId, {});
    packs.get(packId)[lang] = file;
  }
  return packs;
}

const KEY_LITERAL_RE = /['"`]([a-zA-Z][a-zA-Z0-9_-]*(?:\.[a-zA-Z0-9_-]+)+)['"`]/g;
const SOURCE_FILE_RE = /\.(ts|html)$/;

async function collectSourceFiles(root) {
  const files = [];
  async function walk(dir) {
    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    const dirPromises = [];
    for (const entry of entries) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (SKIP_DIRS.has(entry.name)) continue;
        dirPromises.push(walk(full));
      } else if (entry.isFile() && SOURCE_FILE_RE.test(entry.name)) {
        files.push(full);
      }
    }
    if (dirPromises.length) await Promise.all(dirPromises);
  }
  await walk(root);
  return files;
}

export async function buildKeyUsageIndex(appRoot) {
  const usage = new Set();
  const files = await collectSourceFiles(appRoot);
  // Lecture parallèle en lots — sur Windows un readFile par fichier en série est
  // dominé par la latence I/O ; un batch de 32 lectures simultanées suffit à
  // saturer le SSD sans exploser la table des handles.
  const CONCURRENCY = 32;
  for (let i = 0; i < files.length; i += CONCURRENCY) {
    const slice = files.slice(i, i + CONCURRENCY);
    const contents = await Promise.all(
      slice.map((f) => readFile(f, 'utf8').catch(() => '')),
    );
    for (const content of contents) {
      if (!content) continue;
      let m;
      KEY_LITERAL_RE.lastIndex = 0;
      while ((m = KEY_LITERAL_RE.exec(content)) !== null) {
        usage.add(m[1]);
      }
    }
  }
  return usage;
}

// ---------------------------------------------------------------------------
// Orchestration
// ---------------------------------------------------------------------------

/**
 * Cœur de l'analyse — testable sans process.exit ni I/O console.
 *
 * @param {object} opts
 * @param {string} opts.i18nRoot       chemin du dossier i18n
 * @param {string} [opts.appRoot]      chemin du dossier app (orphelines)
 * @param {boolean} [opts.checkUsage]  active la détection d'orphelines
 * @param {string|null} [opts.packFilter]
 * @param {string|null} [opts.langFilter]
 * @param {boolean} [opts.arStrict]    opt-in Round 2 : promeut la couverture
 *                                     AR de INFO → WARN (ar_missing_keys).
 *                                     Désactivé par défaut pour ne pas
 *                                     casser la CI Round 1.
 */
export async function runAnalysis(opts) {
  const { i18nRoot, appRoot, checkUsage = false, packFilter = null, langFilter = null, arStrict = false } = opts;

  const packsMap = await discoverPacks(i18nRoot);

  const usageIndex = checkUsage && appRoot ? await buildKeyUsageIndex(appRoot) : null;

  const monolingual = [];
  const ar_info = [];
  const results = [];

  const sortedPackIds = [...packsMap.keys()]
    .filter((id) => !packFilter || id === packFilter)
    .sort((a, b) => a.localeCompare(b));

  for (const packId of sortedPackIds) {
    const files = packsMap.get(packId);
    const hasFr = !!files.fr;
    const hasEn = !!files.en;
    const hasAr = !!files.ar;

    let frFlat = {};
    let enFlat = {};
    if (hasFr) frFlat = await loadPack(files.fr);
    if (hasEn) enFlat = await loadPack(files.en);

    if (!hasFr || !hasEn) {
      monolingual.push({ pack: packId, has_fr: hasFr, has_en: hasEn, has_ar: hasAr });
    }

    let analysis;
    if (!hasFr || !hasEn) {
      // Pour un pack monolingue on n'inflate pas missing_in_X avec des centaines
      // de clés (déjà signalé via le bucket "monolingual").
      analysis = {
        pack: packId,
        fr_count: Object.keys(frFlat).length,
        en_count: Object.keys(enFlat).length,
        missing_in_en: [],
        missing_in_fr: [],
        identical_values: [],
        empty_values: [],
        orphan_keys: [],
      };
    } else {
      analysis = analyzePack(packId, frFlat, enFlat);
    }

    analysis.ar_missing_keys = [];
    if (hasAr) {
      try {
        const arFlat = await loadPack(files.ar);
        ar_info.push({
          pack: packId,
          ar_count: Object.keys(arFlat).length,
          fr_count: analysis.fr_count,
        });
        if (arStrict && hasFr) {
          const arKeys = new Set(Object.keys(arFlat));
          const missing = [];
          for (const k of Object.keys(frFlat)) {
            if (!arKeys.has(k)) missing.push(k);
          }
          missing.sort();
          analysis.ar_missing_keys = missing;
        }
      } catch (e) {
        ar_info.push({
          pack: packId,
          ar_count: 0,
          fr_count: analysis.fr_count,
          error: e.message,
        });
      }
    } else if (arStrict && hasFr) {
      // Pack sans ar.json : toutes les clés FR sont manquantes en AR.
      analysis.ar_missing_keys = Object.keys(frFlat).sort();
    }

    if (usageIndex) {
      const allKeys = new Set([...Object.keys(frFlat), ...Object.keys(enFlat)]);
      const orphans = [];
      for (const k of allKeys) {
        if (!isReferenced(k, usageIndex)) orphans.push(k);
      }
      orphans.sort();
      analysis.orphan_keys = orphans;
    }

    if (langFilter === 'fr') {
      analysis.missing_in_fr = [];
    } else if (langFilter === 'en') {
      analysis.missing_in_en = [];
      analysis.identical_values = [];
    } else if (langFilter === 'ar') {
      analysis.missing_in_en = [];
      analysis.missing_in_fr = [];
      analysis.identical_values = [];
      analysis.empty_values = [];
      analysis.orphan_keys = [];
    }

    results.push(analysis);
  }

  let total_errors = 0;
  let total_warnings = 0;
  for (const r of results) {
    total_errors += r.missing_in_en.length + r.empty_values.length;
    total_warnings += r.missing_in_fr.length + r.identical_values.length + r.orphan_keys.length;
    if (arStrict) {
      total_warnings += r.ar_missing_keys.length;
    }
  }
  total_warnings += monolingual.length;

  return {
    summary: {
      packs: results.length,
      errors: total_errors,
      warnings: total_warnings,
      info: ar_info.length,
      ar_strict: arStrict,
    },
    monolingual_packs: monolingual,
    ar_info,
    packs: results,
  };
}

// ---------------------------------------------------------------------------
// Affichage console
// ---------------------------------------------------------------------------

const MAX_PREVIEW = 10;

function printConsole(report, args) {
  const { summary, monolingual_packs, ar_info, packs } = report;
  const packsWithErrors = packs.filter((r) => r.missing_in_en.length || r.empty_values.length).length;
  const packsWithWarnings = packs.filter(
    (r) =>
      r.missing_in_fr.length ||
      r.identical_values.length ||
      r.orphan_keys.length ||
      (summary.ar_strict && (r.ar_missing_keys?.length ?? 0) > 0),
  ).length;

  console.log('====== i18n parity report ======');
  console.log(`Total packs detected: ${summary.packs}`);
  console.log(`Packs with errors:    ${packsWithErrors}`);
  console.log(`Packs with warnings:  ${packsWithWarnings}`);
  console.log(`Monolingual packs:    ${monolingual_packs.length}`);
  console.log(`AR info entries:      ${ar_info.length}`);
  console.log('');

  if (!args.quiet) {
    for (const r of packs) {
      const hasFindings =
        r.missing_in_en.length ||
        r.missing_in_fr.length ||
        r.identical_values.length ||
        r.empty_values.length ||
        r.orphan_keys.length ||
        (summary.ar_strict && (r.ar_missing_keys?.length ?? 0) > 0);
      if (!hasFindings) continue;

      console.log('────────────────────────────────────────');
      console.log(`Pack: ${r.pack} (FR=${r.fr_count}, EN=${r.en_count})`);
      printBucket('🔴 Missing in EN', r.missing_in_en);
      printBucket('🔴 Empty values', r.empty_values);
      printBucket('🟡 Missing in FR', r.missing_in_fr);
      printBucket('🟡 Identical FR/EN (suspect)', r.identical_values);
      printBucket('🟡 Possible orphans', r.orphan_keys);
      if (summary.ar_strict) {
        printBucket('🟡 AR missing keys (--ar-strict)', r.ar_missing_keys ?? []);
      }
    }

    if (monolingual_packs.length) {
      console.log('────────────────────────────────────────');
      console.log('🟡 Packs monolingues (FR ou EN manquant) :');
      for (const m of monolingual_packs) {
        const missing = [
          !m.has_fr && 'fr.json',
          !m.has_en && 'en.json',
        ].filter(Boolean).join(' + ');
        console.log(`   - ${m.pack} (manque ${missing})`);
      }
    }

    if (ar_info.length) {
      console.log('────────────────────────────────────────');
      console.log('ℹ️  AR info (Round 1 = FR+EN seul, AR non bloquant) :');
      for (const a of ar_info) {
        const ratio = a.fr_count > 0 ? `${Math.round((a.ar_count / a.fr_count) * 100)}%` : 'n/a';
        console.log(`   - ${a.pack}: AR=${a.ar_count} clés (vs FR=${a.fr_count}, couverture ${ratio})`);
      }
    }
  }

  console.log('');
  console.log(
    `Exit code: ${summary.errors > 0 ? 1 : 0} (errors=${summary.errors}, warnings=${summary.warnings}, info=${summary.info})`,
  );
}

function printBucket(label, keys) {
  if (!keys.length) return;
  console.log(`  ${label}: ${keys.length}`);
  for (const k of keys.slice(0, MAX_PREVIEW)) console.log(`     - ${k}`);
  if (keys.length > MAX_PREVIEW) console.log(`     ... (+${keys.length - MAX_PREVIEW} more)`);
}

// ---------------------------------------------------------------------------
// Entrée principale
// ---------------------------------------------------------------------------

export async function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);

  const i18nRoot = process.env.NAFURA_I18N_ROOT || DEFAULT_I18N_ROOT;
  const appRoot = process.env.NAFURA_APP_ROOT || DEFAULT_APP_ROOT;

  try {
    await stat(i18nRoot);
  } catch {
    console.error(`Dossier i18n introuvable: ${i18nRoot}`);
    return 2;
  }

  let report;
  try {
    report = await runAnalysis({
      i18nRoot,
      appRoot,
      checkUsage: args.checkUsage,
      packFilter: args.pack,
      langFilter: args.lang,
      arStrict: args.arStrict,
    });
  } catch (e) {
    console.error(`Erreur d'exécution: ${e.message}`);
    if (e.stack) console.error(e.stack);
    return 2;
  }

  if (args.json) {
    process.stdout.write(JSON.stringify(report, null, 2) + '\n');
  } else {
    printConsole(report, args);
  }

  return report.summary.errors > 0 ? 1 : 0;
}

// Self-exec uniquement quand lancé en CLI (et pas importé par les tests).
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const code = await main();
  process.exit(code);
}
