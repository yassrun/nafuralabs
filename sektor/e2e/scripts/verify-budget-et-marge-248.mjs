/**
 * Preuve SEKTOR-248 — budget-et-marge Mode B (AC-1..15, sauf PAR_JOUR API gap).
 * Run: node sektor/e2e/scripts/verify-budget-et-marge-248.mjs
 *
 * Contrat : sektor/raster-src/lots/chantiers/budget-et-marge/CONTRAT.md
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const WEB_CHANTIERS = join(ROOT, 'sources/web/app/chantiers');
const I18N_FR = join(ROOT, 'sources/web/public/assets/i18n/applications/erp/chantiers/fr.json');
const API_BASE = process.env.NAFURA_QA_API_BASE ?? 'http://localhost:8082';

const FORBIDDEN_PATTERNS = [
  /\bearned value\b/i,
  /\bevm\b/i,
  /\bvaleur acquise\b/i,
  /\bvaleur planifiée\b/i,
  /\bwbs\b/i,
  /\bventilation analytique\b/i,
  /\bcv\s*\/\s*sv\b/i,
];

let FAILS = 0;

async function json(res) {
  const text = await res.text();
  try {
    return { status: res.status, ok: res.ok, body: JSON.parse(text), text };
  } catch {
    return { status: res.status, ok: res.ok, body: null, text };
  }
}

async function session() {
  const url = `${API_BASE}/api/public/dev/cursor-session`;
  const s = await (await fetch(url, { method: 'POST', headers: { Accept: 'application/json' } })).json();
  if (!s?.accessToken || !s?.tenantId) throw new Error('cursor-session indisponible — lancer make mode-b');
  return {
    Authorization: `Bearer ${s.accessToken}`,
    'X-Tenant-Id': s.tenantId,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
}

async function api(h, method, path, body) {
  const opts = { method, headers: h };
  if (body !== undefined) opts.body = JSON.stringify(body);
  return json(await fetch(`${API_BASE}${path}`, opts));
}

function pass(label, detail = '') {
  console.log(`PASS ${label}${detail ? ` — ${detail}` : ''}`);
}

function fail(label, detail) {
  FAILS++;
  console.error(`FAIL ${label} — ${detail}`);
}

function assertPass(label, cond, detail) {
  if (cond) pass(label, detail);
  else fail(label, detail);
}

function num(v) {
  return v == null ? null : Number(v);
}

function approx(a, b, eps = 0.05) {
  return Math.abs(num(a) - num(b)) <= eps;
}

function money(v) {
  return num(v)?.toFixed(2) ?? 'null';
}

function findNoeud(nodes, code, type = 'POSTE') {
  for (const n of nodes ?? []) {
    if (n.code === code && n.type === type) return n;
    const nested = findNoeud(n.enfants, code, type);
    if (nested) return nested;
  }
  return null;
}

function findByDesignation(nodes, designation, type = 'POSTE') {
  for (const n of nodes ?? []) {
    if (n.designation === designation && n.type === type) return n;
    const nested = findByDesignation(n.enfants, designation, type);
    if (nested) return nested;
  }
  return null;
}

function collectPostes(nodes, out = []) {
  for (const n of nodes ?? []) {
    if (n.type === 'POSTE') out.push(n);
    collectPostes(n.enfants, out);
  }
  return out;
}

function sumDeboursePrevu(nodes) {
  return collectPostes(nodes).reduce((s, p) => s + num(p.totaux?.deboursePrevuHt ?? 0), 0);
}

function walkDpgf(arbre, out = []) {
  const walk = (n) => {
    if (!n) return;
    out.push(n);
    (n.enfants ?? n.noeudsEnfants ?? n.children ?? []).forEach(walk);
  };
  const racines = arbre?.noeuds ?? arbre?.hierarchie ?? arbre?.racines ?? arbre?.lots ?? arbre ?? [];
  (Array.isArray(racines) ? racines : [racines]).forEach(walk);
  return out;
}

function trouverNoeudDpgf(arbre, code) {
  return walkDpgf(arbre).find((n) => n.code === code);
}

function grepForbidden(dir) {
  const hits = [];
  const scan = (p) => {
    if (!existsSync(p)) return;
    const src = readFileSync(p, 'utf8');
    for (const re of FORBIDDEN_PATTERNS) {
      if (re.test(src)) hits.push(`${p}: ${re}`);
    }
  };
  scan(I18N_FR);
  if (existsSync(WEB_CHANTIERS)) {
    for (const rel of [
      'budget-chantier-detail/budget-chantier-detail.page.ts',
      'budget-chantier-detail/components/reviser-budget-dialog/reviser-budget-dialog.component.ts',
    ]) {
      scan(join(WEB_CHANTIERS, rel));
    }
  }
  return hits;
}

async function buildChantierBudget(h, suffix) {
  const ing = await api(h, 'GET', '/api/v1/etudes/ingenieurs');
  const charge = Array.isArray(ing.body) && ing.body[0] ? ing.body[0].userId : undefined;
  const clients = await api(h, 'GET', '/api/v1/partners?roles=CLIENT&size=5');
  const client = (Array.isArray(clients.body) ? clients.body : clients.body?.content ?? [])[0];
  if (!client?.id) throw new Error('aucun client MOA');

  const d = await api(h, 'POST', '/api/v1/etudes/dossiers', {
    objet: `Budget marge 248 ${suffix}`,
    chargeEtudeUserId: charge,
    clientNom: `MOA Budget ${suffix}`,
  });
  if (d.status !== 201) throw new Error(`dossier ${d.status} ${d.text}`);
  const dossierId = d.body.id;

  const b = await api(h, 'POST', `/api/v1/etudes/dossiers/${dossierId}/documents/init-bordereau-manuel`);
  const dpgfId = b.body?.dpgfId;

  const lot1 = await api(h, 'POST', `/api/v1/etudes/dpgf/${dpgfId}/noeuds`, {
    type: 'LOT', code: '1', libelle: 'Gros œuvre',
  });
  const lot2 = await api(h, 'POST', `/api/v1/etudes/dpgf/${dpgfId}/noeuds`, {
    type: 'LOT', code: '2', libelle: 'Second œuvre',
  });
  const sousLot = await api(h, 'POST', `/api/v1/etudes/dpgf/${dpgfId}/noeuds`, {
    type: 'SOUS_LOT', parentId: lot2.body.id, code: '2.1', libelle: 'Menuiseries',
  });

  const specs = [
    {
      type: 'ARTICLE', parentId: lot1.body.id, code: '1.1', libelle: 'Béton armé',
      quantite: 100, unite: 'm3', origineCout: 'DECOMPOSE', coutUnitaire: 1352,
      fraisGenerauxPercent: 0, margePercent: 10,
    },
    {
      type: 'ARTICLE', parentId: lot1.body.id, code: '1.2', libelle: 'Coffrage estimé',
      quantite: 220, unite: 'm2', origineCout: 'ESTIME', estimationSaisieEn: 'COUT',
      coutUnitaire: 480, fraisGenerauxPercent: 0, margePercent: 10,
    },
    {
      type: 'ARTICLE', parentId: lot1.body.id, code: '1.3', libelle: 'Aciers forfait',
      quantite: 18, unite: 'T', origineCout: 'FORFAIT', coutUnitaire: 9200,
      fraisGenerauxPercent: 0, margePercent: 10,
    },
    {
      type: 'ARTICLE', parentId: sousLot.body.id, code: '2.1.1', libelle: 'Fenêtres déduites',
      quantite: 40, unite: 'U', origineCout: 'ESTIME', estimationSaisieEn: 'VENTE',
      prixUnitaire: 3180, fraisGenerauxPercent: 5, margePercent: 10,
    },
    {
      type: 'ARTICLE', parentId: sousLot.body.id, code: '2.1.2', libelle: 'Portes intérieures',
      quantite: 60, unite: 'U', origineCout: 'ESTIME', estimationSaisieEn: 'COUT',
      coutUnitaire: 1400, fraisGenerauxPercent: 5, margePercent: 10,
    },
    {
      type: 'ARTICLE', parentId: lot2.body.id, code: '2.2', libelle: 'Peinture',
      quantite: 1500, unite: 'm2', origineCout: 'ESTIME', estimationSaisieEn: 'COUT',
      coutUnitaire: 95, fraisGenerauxPercent: 5, margePercent: 10,
    },
  ];

  let noeud11Id = null;
  for (const p of specs) {
    const r = await api(h, 'POST', `/api/v1/etudes/dpgf/${dpgfId}/noeuds`, p);
    if (r.status !== 201) throw new Error(`poste ${p.code} ${r.status} ${r.text}`);
    if (p.code === '1.1') noeud11Id = r.body?.id;
  }
  if (!noeud11Id) throw new Error('poste 1.1 sans id');

  const arbreDpgf = await api(h, 'GET', `/api/v1/etudes/dpgf/${dpgfId}/arbre`);

  const dpuRes = await api(h, 'POST', '/api/v1/etudes/dpu', { dpgfNoeudId: noeud11Id });
  if (!dpuRes.ok) throw new Error(`dpu 1.1 ${dpuRes.status} ${dpuRes.text}`);
  const dpuId = dpuRes.body?.id ?? dpuRes.body;
  for (const c of [
    { type: 'MATIERE', libelle: 'Ciment', rendement: 350, unite: 'KG', prixUnitaire: 1.2 },
    { type: 'MAIN_DOEUVRE', libelle: 'Coffreur', rendement: 0.4, unite: 'H', prixUnitaire: 45 },
    { type: 'MATERIEL', libelle: 'Bétonnière', rendement: 0.05, unite: 'J', prixUnitaire: 280 },
    { type: 'SOUS_TRAITANCE', libelle: 'Ferraillage', rendement: 0.1, unite: 'T', prixUnitaire: 9000 },
  ]) {
    await api(h, 'POST', `/api/v1/etudes/dpu/${dpuId}/composants`, {
      ...c, referenceType: 'LIBRE', sourcePrix: 'MANUEL',
    });
  }
  await api(h, 'POST', `/api/v1/etudes/dpu/${dpuId}/recompute`);

  let sommeAttendue = 0;
  for (const n of walkDpgf(arbreDpgf.body)) {
    if (n.type !== 'ARTICLE') continue;
    const q = num(n.quantite) ?? 0;
    const cu = num(n.coutUnitaire) ?? 0;
    sommeAttendue += q * cu;
  }

  await api(h, 'PUT', `/api/v1/etudes/dossiers/${dossierId}/etape`, { etape: 2 });
  const soumis = await api(h, 'POST', `/api/v1/etudes/dossiers/${dossierId}/soumettre`);
  if (!soumis.ok) throw new Error(`soumettre ${soumis.status} ${soumis.text?.slice(0, 300)}`);
  let v = await api(h, 'POST', `/api/v1/etudes/dossiers/${dossierId}/valider`);
  if (v.ok && v.body?.status === 'EN_VALIDATION') {
    v = await api(h, 'POST', `/api/v1/etudes/dossiers/${dossierId}/valider`);
  }
  if (!v.ok || v.body?.status !== 'VALIDEE') {
    throw new Error(`valider ${v.status} ${v.text?.slice(0, 300)} (soumis=${soumis.body?.status})`);
  }

  const g = await api(h, 'POST', `/api/v1/etudes/dossiers/${dossierId}/generer-devis`, { clientId: client.id });
  if (!g.ok) throw new Error(`generer-devis ${g.status} ${g.text}`);
  const devisId = g.body?.devisGenereId ?? g.body?.id;
  await api(h, 'POST', `/api/v1/etudes/devis/${devisId}/submit`);
  const dd = await api(h, 'GET', `/api/v1/etudes/devis/${devisId}`);
  const total = dd.body?.totalHt ?? dd.body?.totalHT;

  const gain = await api(h, 'POST', `/api/v1/etudes/dossiers/${dossierId}/gagne`, {
    dateAttribution: '2026-08-26', devisId, montantAttribue: total,
  });
  if (!gain.ok) throw new Error(`gagne ${gain.status} ${gain.text?.slice(0, 200)}`);

  const conv = await api(h, 'POST', `/api/v1/etudes/dossiers/${dossierId}/convertir`, {});
  if (!conv.ok) throw new Error(`convertir ${conv.status} ${conv.text?.slice(0, 200)}`);
  const chantierId = conv.body?.chantierId ?? conv.body?.id;

  const today = new Date().toISOString().slice(0, 10);
  await api(h, 'PUT', `/api/v1/chantiers/${chantierId}`, {
    dateDebut: '2026-09-01',
    dateFinPrevue: '2027-04-01',
  });
  await api(h, 'POST', `/api/v1/chantiers/${chantierId}/affectations`, {
    employeId: 'qa-emp-conducteur',
    roleCode: 'BTP_CONDUCTEUR_TRAVAUX',
    dateDebut: today,
  });
  await api(h, 'POST', `/api/v1/chantiers/${chantierId}/affectations`, {
    employeId: 'qa-emp-chef-chantier',
    roleCode: 'BTP_CHEF_CHANTIER',
    dateDebut: today,
  });

  const os = await api(h, 'POST', `/api/v1/chantiers/${chantierId}/demarrer-os`, {
    osReference: `OS-248-${suffix}`.slice(0, 40), osDateEffet: '2026-09-01',
  });
  if (!os.ok) throw new Error(`OS ${os.status} ${os.text?.slice(0, 200)}`);

  return {
    chantierId,
    dossierId,
    dpuId,
    noeud11Id,
    sommeAttendue: Math.round(sommeAttendue * 100) / 100,
  };
}

async function main() {
  console.log('=== SEKTOR-248 — budget-et-marge Mode B ===');
  const h = await session();
  const suffix = Date.now().toString(36);
  const ctx = await buildChantierBudget(h, suffix);
  const { chantierId, dpuId, sommeAttendue } = ctx;

  const arbre0 = await api(h, 'GET', `/api/v1/chantiers/${chantierId}/budget-arbre`);
  if (!arbre0.ok) throw new Error(`budget-arbre ${arbre0.status}`);
  const lots = arbre0.body.lots ?? [];

  const n11 = findNoeud(lots, '1.1');
  const n12 = findNoeud(lots, '1.2');
  const n13 = findNoeud(lots, '1.3');
  const n211 = findNoeud(lots, '2.1.1');
  const n212 = findNoeud(lots, '2.1.2');
  const n22 = findNoeud(lots, '2.2');
  const lot1 = findNoeud(lots, '1', 'LOT');
  if (!n11 || !n12 || !n13 || !n211 || !n22 || !lot1) throw new Error('postes budget-arbre incomplets');

  // AC-1 / AC-2 — déboursé décomposé copié du DPU
  const deb11 = await api(h, 'GET', `/api/v1/postes-budgetaires/${n11.id}/debourse`);
  const rubs = (deb11.body?.rubriques ?? []).map((r) => r.rubrique);
  assertPass(
    'budget-conversion-debourse-copie-du-dpu/AC-1',
    ['MATIERE', 'MAIN_DOEUVRE', 'MATERIEL', 'SOUS_TRAITANCE'].every((r) => rubs.includes(r)),
    rubs.join(','),
  );
  assertPass(
    'budget-conversion-debourse-copie-du-dpu/AC-2',
    deb11.body?.origine === 'DECOMPOSE' && num(deb11.body?.prevuHt) > 0,
    `origine=${deb11.body?.origine} prevu=${deb11.body?.prevuHt}`,
  );

  // AC-4 — somme déboursés = Σ coût × quantité du devis
  const sommeArbre = num(arbre0.body?.totaux?.deboursePrevuHt);
  const summary = await api(h, 'GET', `/api/v1/chantiers/${chantierId}/summary`);
  const debInit = num(summary.body?.debourseInitialHt);
  assertPass(
    'budget-conversion-debourse-copie-du-dpu/AC-4',
    approx(sommeArbre, sommeAttendue) && approx(debInit, sommeAttendue),
    `arbre=${money(sommeArbre)} summary=${money(debInit)} attendu=${money(sommeAttendue)}`,
  );

  // AC-3 — forfait, estimé déduit, décomposé sans DPU
  const deb13 = await api(h, 'GET', `/api/v1/postes-budgetaires/${n13.id}/debourse`);
  const st = (deb13.body?.rubriques ?? []).find((r) => r.rubrique === 'SOUS_TRAITANCE');
  assertPass(
    'budget-conversion-poste-forfait-et-estime/AC-3-forfait',
    deb13.body?.origine === 'FORFAIT' && num(st?.prevuHt) === num(deb13.body?.prevuHt),
    `SOUS_TRAITANCE=${st?.prevuHt}`,
  );

  const deb211 = await api(h, 'GET', `/api/v1/postes-budgetaires/${n211.id}/debourse`);
  assertPass(
    'budget-conversion-poste-forfait-et-estime/AC-3-estime-deduit',
    deb211.body?.origine === 'ESTIME' && deb211.body?.nonFiable === true,
    `nonFiable=${deb211.body?.nonFiable}`,
  );

  const deb12 = await api(h, 'GET', `/api/v1/postes-budgetaires/${n12.id}/debourse`);
  const nv12 = (deb12.body?.rubriques ?? []).find((r) => r.rubrique === 'NON_VENTILE');
  assertPass(
    'budget-conversion-poste-forfait-et-estime/AC-3-estime',
    deb12.body?.origine === 'ESTIME' && num(nv12?.prevuHt) > 0,
    `NON_VENTILE=${nv12?.prevuHt}`,
  );

  // AC-5 — instantané : modifier le DPU source ne change pas le budget chantier
  const prevuAvant = deb11.body?.prevuHt;
  await api(h, 'POST', `/api/v1/etudes/dpu/${dpuId}/composants`, {
    type: 'MATIERE', referenceType: 'LIBRE', libelle: 'Bruit AC-5',
    rendement: 999, unite: 'KG', prixUnitaire: 999, sourcePrix: 'MANUEL',
  });
  await api(h, 'POST', `/api/v1/etudes/dpu/${dpuId}/recompute`);
  const deb11Apres = await api(h, 'GET', `/api/v1/postes-budgetaires/${n11.id}/debourse`);
  assertPass(
    'budget-instantane-etude-modifiee-apres-coup/AC-5',
    money(prevuAvant) === money(deb11Apres.body?.prevuHt),
    `${prevuAvant} → ${deb11Apres.body?.prevuHt}`,
  );

  // AC-6 — interne saisi
  const lotInt = await api(h, 'POST', `/api/v1/chantiers/${chantierId}/lots`, {
    code: 'INT', designation: 'Installation de chantier', nature: 'INTERNE', ordre: 99,
  });
  if (lotInt.status !== 201) throw new Error(`lot interne ${lotInt.status}`);
  const posteInt = await api(h, 'POST', `/api/v1/lots/${lotInt.body.id}/postes-budgetaires`, {
    code: 'INT.1', designation: 'Base vie', unite: 'ens', quantite: 1,
  });
  if (posteInt.status !== 201) throw new Error(`poste interne ${posteInt.status}`);
  const saisieInt = await api(h, 'PUT', `/api/v1/postes-budgetaires/${posteInt.body.id}/debourse`, {
    rubriques: [
      { rubrique: 'MATIERE', montantHt: 500 },
      { rubrique: 'MAIN_DOEUVRE', montantHt: 1500 },
    ],
  });
  assertPass('budget-noeud-interne-saisi/AC-6', saisieInt.ok && saisieInt.body?.origine === 'SAISI', `${saisieInt.status}`);

  // AC-7 — révision sur le nœud
  const rev = await api(h, 'PUT', `/api/v1/postes-budgetaires/${n11.id}/debourse/revision`, {
    rubriques: [{ rubrique: 'MATIERE', montantHt: 50000 }],
  });
  assertPass(
    'budget-revision-sur-le-noeud/AC-7',
    rev.ok && num(rev.body?.ecartRevisionHt) !== 0,
    `ecart=${rev.body?.ecartRevisionHt}`,
  );

  // AC-8 — agrégat non stocké
  const refusBudget = await api(h, 'POST', `/api/v1/chantiers/${chantierId}/budget`, { lignes: [] });
  assertPass(
    'budget-aucun-agregat-stocke-au-chantier/AC-8-post',
    refusBudget.status === 409 && `${refusBudget.text}`.includes('agregat_non_stocke'),
    `${refusBudget.status}`,
  );
  const lectureBudget = await api(h, 'GET', `/api/v1/chantiers/${chantierId}/budget`);
  assertPass('budget-aucun-agregat-stocke-au-chantier/AC-8-get', lectureBudget.ok, `${lectureBudget.status}`);

  // AC-9 — rollup poste → lot → chantier
  const sumPostesLot1 = sumDeboursePrevu([lot1]);
  const lot1Revise = num(lot1.totaux?.debourseReviseHt);
  assertPass(
    'budget-rollup-poste-lot-chantier/AC-9-lot',
    approx(sumPostesLot1, lot1.totaux?.deboursePrevuHt),
    `Σ postes=${money(sumPostesLot1)} lot=${money(lot1.totaux?.deboursePrevuHt)}`,
  );
  const arbre1 = await api(h, 'GET', `/api/v1/chantiers/${chantierId}/budget-arbre`);
  const chantierRevise = num(arbre1.body?.totaux?.debourseReviseHt);
  assertPass(
    'budget-rollup-poste-lot-chantier/AC-9-chantier',
    chantierRevise >= lot1Revise,
    `chantier revise=${money(chantierRevise)} lot1=${money(lot1Revise)}`,
  );

  // AC-10 — imputation réel sur nœuds
  const im1 = await api(h, 'POST', `/api/v1/chantiers/${chantierId}/couts-reels`, {
    posteId: n11.id, rubrique: 'MATIERE', montantHt: 80000, dateCout: '2026-09-10', source: 'saisie',
  });
  assertPass('budget-imputation-reel-sur-le-noeud/AC-10-vendu', im1.status === 201, `${im1.status}`);
  const imInt = await api(h, 'POST', `/api/v1/chantiers/${chantierId}/couts-reels`, {
    posteId: posteInt.body.id, rubrique: 'MAIN_DOEUVRE', montantHt: 800, dateCout: '2026-09-11', source: 'saisie',
  });
  assertPass('budget-imputation-reel-sur-le-noeud/AC-10-interne', imInt.status === 201, `${imInt.status}`);

  // AC-11 — coût non imputé → Frais de chantier + ré-imputation
  const sansNoeud = await api(h, 'POST', `/api/v1/chantiers/${chantierId}/couts-reels`, {
    rubrique: 'MAIN_DOEUVRE', montantHt: 300, dateCout: '2026-09-12', source: 'pointage',
  });
  assertPass('budget-cout-non-impute-frais-de-chantier/AC-11-create', sansNoeud.status === 201, `${sansNoeud.status}`);
  const arbreFrais = await api(h, 'GET', `/api/v1/chantiers/${chantierId}/budget-arbre`);
  const frais = findByDesignation(arbreFrais.body?.lots, 'Frais de chantier');
  assertPass('budget-cout-non-impute-frais-de-chantier/AC-11-frais', !!frais?.id, frais?.id ?? 'absent');
  const coutId = sansNoeud.body?.id;
  const reimp = coutId
    ? await api(h, 'PUT', `/api/v1/chantiers/${chantierId}/couts-reels/${coutId}/noeud/${n22.id}`)
    : { status: 'skip' };
  assertPass('budget-cout-non-impute-frais-de-chantier/AC-11-reimpute', reimp.status === 200, `${reimp.status}`);

  // Avancement partiel pour AC-13
  await api(h, 'POST', `/api/v1/chantiers/${chantierId}/avancements`, {
    date: '2026-09-15', status: 'BROUILLON', saisieParId: 'qa-emp-chef-chantier',
    entries: [{ posteId: n11.id, quantiteRealisee: 50 }],
  });
  await api(h, 'POST', `/api/v1/chantiers/${chantierId}/avancements`, {
    date: '2026-09-16', status: 'BROUILLON', saisieParId: 'qa-emp-chef-chantier',
    entries: [{ posteId: n22.id, quantiteRealisee: 750 }],
  });
  await api(h, 'POST', `/api/v1/chantiers/${chantierId}/couts-reels`, {
    posteId: n22.id, rubrique: 'MATIERE', montantHt: 50000, dateCout: '2026-09-17', source: 'saisie',
  });

  const arbreFinal = await api(h, 'GET', `/api/v1/chantiers/${chantierId}/budget-arbre`);
  const n11f = findNoeud(arbreFinal.body?.lots, '1.1');
  const n22f = findNoeud(arbreFinal.body?.lots, '2.2');
  const nIntf = findNoeud(arbreFinal.body?.lots, 'INT.1') ?? findByDesignation(arbreFinal.body?.lots, 'Base vie');

  // AC-12 — marge par poste et lot
  assertPass(
    'budget-marge-par-poste-et-par-lot/AC-12-vendu',
    num(n11f?.totaux?.margePrevueHt) === num(n11f?.totaux?.venduHt) - num(n11f?.totaux?.deboursePrevuHt),
    `marge=${n11f?.totaux?.margePrevueHt}`,
  );
  if (nIntf) {
    assertPass(
      'budget-marge-par-poste-et-par-lot/AC-12-interne',
      num(nIntf.totaux?.venduHt) === 0 && num(nIntf.totaux?.margePrevueHt) < 0,
      `marge interne=${nIntf.totaux?.margePrevueHt}`,
    );
  } else {
    fail('budget-marge-par-poste-et-par-lot/AC-12-interne', 'poste interne absent de l arbre');
  }

  // AC-13 — déboursé fait et écart (signes opposés)
  const ecart11 = num(n11f?.totaux?.ecartHt);
  const ecart22 = num(n22f?.totaux?.ecartHt);
  assertPass(
    'budget-valeur-acquise-et-ecart/AC-13-11',
    num(n11f?.totaux?.debourseFaitHt) > 0 && ecart11 < 0,
    `fait=${n11f?.totaux?.debourseFaitHt} ecart=${ecart11}`,
  );
  assertPass(
    'budget-valeur-acquise-et-ecart/AC-13-22',
    num(n22f?.totaux?.debourseFaitHt) > 0 && ecart22 > 0,
    `fait=${n22f?.totaux?.debourseFaitHt} ecart=${ecart22}`,
  );

  // AC-14 — sans planning
  const activites = await api(h, 'GET', `/api/v1/chantiers/${chantierId}/activites`);
  const actList = Array.isArray(activites.body) ? activites.body : activites.body?.content ?? [];
  assertPass('budget-sans-aucun-planning/AC-14', actList.length === 0, `${actList.length} activité`);

  // AC-15 — vocabulaire
  const hits = grepForbidden();
  assertPass('budget-vocabulaire-chantier/AC-15', hits.length === 0, hits.join(' | ') || 'aucun terme interdit');

  // AC-6 + AC-12 lot mixte
  assertPass(
    'budget-noeud-interne-saisi/AC-12-lot-mixte',
    num(lot1.totaux?.deboursePrevuHt) > 0 && num(nIntf?.totaux?.deboursePrevuHt) > 0,
    'lot vendu + interne visibles',
  );

  console.log(`\n=== VERDICT — FAIL: ${FAILS} ===`);
  console.log(`chantierId=${chantierId} · sommeAttendue=${money(sommeAttendue)}`);
  process.exit(FAILS ? 1 : 0);
}

main().catch((e) => {
  console.error('ERREUR', e);
  process.exit(1);
});
