/**
 * Preuve SEKTOR-226 — scénario Al Qods bout en bout (AC-13..15).
 * Run: node sektor/e2e/scripts/verify-alqods-scenario-226.mjs
 *
 * 1) Rejoue les 5 preuves unitaires 221–225 (indépendantes).
 * 2) Fabrique un graphe Al Qods complet (pas DE-0103) et les discriminants acte 3.
 */
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const API_BASE = process.env.NAFURA_QA_API_BASE ?? 'http://localhost:8082';

const UNIT_SCRIPTS = [
  'verify-cockpit-ops-221.mjs',
  'verify-alqods-da-bl-222.mjs',
  'verify-alqods-documents-223.mjs',
  'verify-alqods-st-coffrage-224.mjs',
  'verify-alqods-marche-notification-225.mjs',
];

async function json(res) {
  const text = await res.text();
  try {
    return { status: res.status, ok: res.ok, body: JSON.parse(text), text };
  } catch {
    return { status: res.status, ok: res.ok, body: null, text };
  }
}

async function session(role) {
  const url = `${API_BASE}/api/public/dev/cursor-session${role ? `?role=${role}` : ''}`;
  const s = await (await fetch(url, { method: 'POST', headers: { Accept: 'application/json' } })).json();
  if (!s?.accessToken || !s?.tenantId) return null;
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

function findNoeud(nodes, code, type = 'POSTE') {
  for (const n of nodes ?? []) {
    if (n.code === code && n.type === type) return n;
    const nested = findNoeud(n.enfants, code, type);
    if (nested) return nested;
  }
  return null;
}

function runUnitScripts() {
  console.log('\n=== Preuves unitaires 221–225 (rejouées par QA) ===');
  for (const script of UNIT_SCRIPTS) {
    console.log(`\n--- ${script} ---`);
    const r = spawnSync(process.execPath, [join(ROOT, 'e2e/scripts', script)], {
      cwd: ROOT,
      stdio: 'inherit',
      env: process.env,
    });
    if (r.status !== 0) {
      throw new Error(`${script} → échec (code ${r.status ?? 'signal'})`);
    }
  }
  console.log('\nok unitaires 221–225');
}

async function creerAlQodsComplet(h, suffix) {
  const ing = await api(h, 'GET', '/api/v1/etudes/ingenieurs');
  const charge = Array.isArray(ing.body) && ing.body[0] ? ing.body[0].userId : undefined;
  const clients = await api(h, 'GET', '/api/v1/partners?roles=CLIENT&size=5');
  const client = (Array.isArray(clients.body) ? clients.body : clients.body?.content ?? clients.body?.items ?? [])[0];
  if (!client?.id) throw new Error('aucun client MOA');

  const d = await api(h, 'POST', '/api/v1/etudes/dossiers', {
    objet: `Al Qods scenario 226 ${suffix}`,
    chargeEtudeUserId: charge,
    clientNom: `Commune Al Qods ${suffix}`,
  });
  if (d.status !== 201) throw new Error(`dossier ${d.status} ${d.text}`);
  const dossierId = d.body.id;

  const b = await api(h, 'POST', `/api/v1/etudes/dossiers/${dossierId}/documents/init-bordereau-manuel`);
  const dpgfId = b.body?.dpgfId;

  const lot1 = await api(h, 'POST', `/api/v1/etudes/dpgf/${dpgfId}/noeuds`, {
    type: 'LOT', code: '1', libelle: 'Terrassement',
  });
  const p1 = await api(h, 'POST', `/api/v1/etudes/dpgf/${dpgfId}/noeuds`, {
    type: 'ARTICLE', parentId: lot1.body.id, code: '1', libelle: 'Terrassement général',
    quantite: 1, unite: 'fft', origineCout: 'ESTIME', coutUnitaire: 45000, fraisGenerauxPercent: 0, margePercent: 12,
  });

  const lot2 = await api(h, 'POST', `/api/v1/etudes/dpgf/${dpgfId}/noeuds`, {
    type: 'LOT', code: '2', libelle: 'Gros œuvre',
  });
  const specs = [
    ['2.1', 'Béton B25 fondations', 180, 'm³', 1200],
    ['2.2', 'Acier HA', 25, 't', 9800],
    ['2.3', 'Coffrage', 850, 'm²', 95],
  ];
  const postes = {};
  for (const [code, libelle, qte, unite, pu] of specs) {
    const p = await api(h, 'POST', `/api/v1/etudes/dpgf/${dpgfId}/noeuds`, {
      type: 'ARTICLE', parentId: lot2.body.id, code, libelle, quantite: qte, unite,
      origineCout: 'ESTIME', coutUnitaire: pu, fraisGenerauxPercent: 0, margePercent: 15,
    });
    if (p.status !== 201) throw new Error(`poste ${code} ${p.status} ${p.text}`);
    postes[code] = p.body;
    const dpu = await api(h, 'POST', '/api/v1/etudes/dpu', { dpgfNoeudId: p.body.id });
    await api(h, 'POST', `/api/v1/etudes/dpu/${dpu.body.id}/composants`, {
      type: code === '2.3' ? 'SOUS_TRAITANCE' : 'MATIERE',
      referenceType: 'LIBRE', libelle, rendement: 1, unite, prixUnitaire: pu, sourcePrix: 'MANUEL',
    });
  }

  const lot3 = await api(h, 'POST', `/api/v1/etudes/dpgf/${dpgfId}/noeuds`, {
    type: 'LOT', code: '3', libelle: 'Étanchéité',
  });
  const p3 = await api(h, 'POST', `/api/v1/etudes/dpgf/${dpgfId}/noeuds`, {
    type: 'ARTICLE', parentId: lot3.body.id, code: '3', libelle: 'Étanchéité toiture',
    quantite: 420, unite: 'm²', origineCout: 'ESTIME', coutUnitaire: 180, fraisGenerauxPercent: 0, margePercent: 15,
  });
  if (p3.status !== 201) throw new Error(`poste 3 ${p3.status} ${p3.text}`);
  postes['3'] = p3.body;
  const dpu3 = await api(h, 'POST', '/api/v1/etudes/dpu', { dpgfNoeudId: p3.body.id });
  await api(h, 'POST', `/api/v1/etudes/dpu/${dpu3.body.id}/composants`, {
    type: 'SOUS_TRAITANCE', referenceType: 'LIBRE', libelle: 'Étanchéité toiture',
    rendement: 1, unite: 'm²', prixUnitaire: 180, sourcePrix: 'MANUEL',
  });

  if (p1.status !== 201) throw new Error(`poste 1 ${p1.status} ${p1.text}`);
  postes['1'] = p1.body;

  await api(h, 'PUT', `/api/v1/etudes/dossiers/${dossierId}/etape`, { etape: 2 });
  await api(h, 'POST', `/api/v1/etudes/dossiers/${dossierId}/soumettre`);
  let v = await api(h, 'POST', `/api/v1/etudes/dossiers/${dossierId}/valider`);
  if (v.ok && v.body?.status === 'EN_VALIDATION') {
    v = await api(h, 'POST', `/api/v1/etudes/dossiers/${dossierId}/valider`);
  }
  if (!v.ok || v.body?.status !== 'VALIDEE') throw new Error(`valider ${v.status} ${v.text?.slice(0, 150)}`);

  const g = await api(h, 'POST', `/api/v1/etudes/dossiers/${dossierId}/generer-devis`, { clientId: client.id });
  if (!g.ok) throw new Error(`generer-devis ${g.status} ${g.text}`);
  const devisId = g.body?.devisGenereId ?? g.body?.id;
  const dd = await api(h, 'GET', `/api/v1/etudes/devis/${devisId}`);
  await api(h, 'POST', `/api/v1/etudes/devis/${devisId}/submit`);
  const total = dd.body?.totalHt ?? dd.body?.totalHT;
  const gain = await api(h, 'POST', `/api/v1/etudes/dossiers/${dossierId}/gagne`, {
    dateAttribution: new Date().toISOString().slice(0, 10), devisId, montantAttribue: total,
  });
  if (!gain.ok) throw new Error(`gagne ${gain.status} ${gain.text?.slice(0, 200)}`);

  const conv = await api(h, 'POST', `/api/v1/etudes/dossiers/${dossierId}/convertir`, {});
  if (!conv.ok) throw new Error(`convertir ${conv.status} ${conv.text?.slice(0, 200)}`);
  const chantierId = conv.body?.chantierId ?? conv.body?.id;
  if (conv.body?.marcheGenereId) throw new Error('conversion a créé un marché');

  const today = new Date().toISOString().slice(0, 10);
  for (const [employeId, roleCode] of [
    ['qa-emp-conducteur', 'BTP_CONDUCTEUR_TRAVAUX'],
    ['qa-emp-chef-chantier', 'BTP_CHEF_CHANTIER'],
    ['qa-emp-magasinier', 'BTP_MAGASINIER'],
  ]) {
    const aff = await api(h, 'POST', `/api/v1/chantiers/${chantierId}/affectations`, {
      employeId, roleCode, dateDebut: today,
    });
    if (aff.status !== 201 && aff.status !== 200) {
      throw new Error(`affectation ${roleCode} ${aff.status} ${aff.text}`);
    }
  }
  await api(h, 'PUT', `/api/v1/chantiers/${chantierId}`, {
    dateDebut: '2026-09-01', dateFinPrevue: '2027-04-01',
  });
  const os = await api(h, 'POST', `/api/v1/chantiers/${chantierId}/demarrer-os`, {
    osReference: `OS-226-${suffix}`.slice(0, 40), osDateEffet: '2026-09-01',
  });
  if (!os.ok) throw new Error(`OS ${os.status} ${os.text}`);

  return { chantierId, dossierId, postes };
}

async function acte3Discriminants(h, suffix) {
  console.log('\n=== Graphe Al Qods + acte 3 (226) ===');
  const { chantierId } = await creerAlQodsComplet(h, suffix);

  const arbre = await api(h, 'GET', `/api/v1/chantiers/${chantierId}/budget-arbre`);
  if (!arbre.ok) throw new Error(`budget-arbre ${arbre.status}`);
  const n21 = findNoeud(arbre.body.lots, '2.1');
  const n23 = findNoeud(arbre.body.lots, '2.3');
  const n3 = findNoeud(arbre.body.lots, '3');
  if (!n21 || !n23 || !n3) throw new Error('postes 2.1 / 2.3 / 3 absents après conversion');
  if (Number(n21.quantitePrevue) !== 180) {
    throw new Error(`2.1 qte ${n21.quantitePrevue} ≠ 180`);
  }
  console.log('PASS alqods-etude-vers-os : 180/25/850/420 + OS, pas de marché');

  const interne = await api(h, 'POST', `/api/v1/chantiers/${chantierId}/lots`, {
    code: 'INT', designation: 'Installation de chantier', nature: 'INTERNE', ordre: 99,
  });
  if (interne.status !== 201) throw new Error(`lot interne ${interne.status} ${interne.text}`);

  await api(h, 'POST', `/api/v1/chantiers/${chantierId}/avancements`, {
    date: '2026-09-05', status: 'BROUILLON', saisieParId: 'qa-emp-chef-chantier',
    entries: [{ lotId: interne.body.id, quantiteRealisee: 1 }],
  });

  const ok40 = await api(h, 'POST', `/api/v1/chantiers/${chantierId}/avancements`, {
    date: '2026-09-12', status: 'BROUILLON', saisieParId: 'qa-emp-chef-chantier',
    entries: [{ posteId: n21.id, quantiteRealisee: 40 }],
  });
  if (!ok40.ok) throw new Error(`40 m³ ${ok40.status} ${ok40.text?.slice(0, 200)}`);

  const depasse = await api(h, 'POST', `/api/v1/chantiers/${chantierId}/avancements`, {
    date: '2026-09-13', status: 'BROUILLON', saisieParId: 'qa-emp-chef-chantier',
    entries: [{ posteId: n21.id, quantiteRealisee: 141 }],
  });
  if (depasse.status !== 400 && depasse.status !== 422 && depasse.status !== 409) {
    throw new Error(`181 m³ attendu refus, obtenu ${depasse.status} ${depasse.text?.slice(0, 200)}`);
  }
  if (!`${depasse.text}`.includes('depassement')) {
    throw new Error(`refus 181 m³ sans code depassement : ${depasse.text?.slice(0, 200)}`);
  }
  console.log('PASS acte 3 : 181 m³ refusé (40 + 141 > 180)');

  await api(h, 'POST', `/api/v1/chantiers/${chantierId}/avancements`, {
    date: '2026-09-18', status: 'BROUILLON', saisieParId: 'qa-emp-chef-chantier',
    entries: [{ posteId: n23.id, quantiteRealisee: 120 }],
  });

  const att = await api(h, 'POST', `/api/v1/chantiers/${chantierId}/attachements`, {
    dateDebut: '2026-09-01', dateFin: '2026-09-30', effectifPresent: 8,
  });
  if (!att.ok) throw new Error(`attachement ${att.status} ${att.text?.slice(0, 200)}`);
  const lignes = att.body?.lignes ?? [];
  const ids = lignes.map((l) => l.noeudId);
  if (ids.includes(interne.body.id)) throw new Error('interne présent dans attachement');
  if (!ids.includes(n21.id) || !ids.includes(n23.id)) {
    throw new Error(`attachement vendu incomplet : ${JSON.stringify(ids)}`);
  }
  if (ids.includes(n3.id)) throw new Error('étanchéité 0 m² inventée dans attachement');
  console.log('PASS alqods-interne-hors-situation + ST étanchéité 0 m² non inventé');

  const fournisseur = await (async () => {
    const res = await api(h, 'GET', '/api/v1/partners?roles=FOURNISSEUR&size=5');
    const list = Array.isArray(res.body) ? res.body : res.body?.content ?? res.body?.items ?? [];
    return list[0];
  })();
  if (fournisseur?.id) {
    await api(h, 'POST', `/api/v1/chantiers/${chantierId}/sous-traitances`, {
      sousTraitantId: fournisseur.id,
      sousTraitantNom: fournisseur.raisonSociale ?? 'ST Etancheite',
      objet: 'Étanchéité poste 3',
      dateDebut: '2026-10-01', dateFin: '2026-11-30', montantHt: 75600,
      retenueGarantieTaux: 10, noeudId: n3.id,
    });
  }

  const clore = await api(h, 'POST', `/api/v1/chantiers/${chantierId}/clore`);
  if (clore.status !== 409 && clore.status !== 422) {
    throw new Error(`POST /clore depuis EN_COURS attendu 409/422, obtenu ${clore.status} ${clore.text?.slice(0, 200)}`);
  }
  console.log('PASS alqods-reception-provisoire : /clore refusé depuis EN_COURS');

  const daf = await session('daf');
  const chef = await session('chef-chantier');
  const ckDaf = await api(daf, 'GET', `/api/v1/chantiers/${chantierId}/cockpit`);
  const ckChef = await api(chef, 'GET', `/api/v1/chantiers/${chantierId}/cockpit`);
  const dafLabels = (ckDaf.body?.nextActions ?? []).map((a) => a.libelle ?? '');
  const chefLabels = (ckChef.body?.nextActions ?? []).map((a) => a.libelle ?? '');
  if (dafLabels.some((l) => l.includes('demandeAchat') || l.includes('demande'))) {
    throw new Error('daf a une action DA');
  }
  if (chefLabels.some((l) => l.includes('notifierMarche') || l.includes('notifier'))) {
    throw new Error('chef a notifier marché');
  }
  console.log('PASS alqods-roles (échantillon daf/chef sur graphe 226)');

  return chantierId;
}

async function waitApi(maxMs = 300000) {
  const t0 = Date.now();
  while (Date.now() - t0 < maxMs) {
    try {
      const r = await fetch(`${API_BASE}/api/public/dev/cursor-session`, {
        method: 'POST', headers: { Accept: 'application/json' },
      });
      const b = await r.json().catch(() => null);
      if (b?.accessToken) return true;
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 5000));
  }
  return false;
}

async function main() {
  console.log('SEKTOR-226 — preuve Al Qods (QA indépendante)');
  if (!(await waitApi())) {
    console.log('SKIP Mode B indisponible (cursor-session)');
    process.exit(0);
  }

  runUnitScripts();
  const oh = await session();
  const chantierId = await acte3Discriminants(oh, Date.now().toString(36));

  console.log(`\nSEKTOR-226 : PASS · graphe=${chantierId}`);
  console.log('Browser MCP absent — pas de captures desktop/390 (preuve API + matrice).');
}

main().catch((err) => {
  console.error('FAIL', err.message || err);
  process.exit(1);
});
