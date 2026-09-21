/**
 * Seed QA — historique de prix composant (consultations + achats).
 *
 * Usage (Mode B) :
 *   eval "$(bash nafura-platform/ops/qa-token.sh)"
 *   node sektor/e2e/scripts/seed-qa-prix-composant.mjs
 */
const API_BASE = (process.env.NAFURA_QA_API_BASE || process.env.ERP_API_BASE || 'http://localhost:8082').replace(
  /\/$/,
  '',
);
const TOKEN = process.env.TOKEN;
const TENANT_ID = process.env.TENANT_ID;
const MARKER = 'QA-PRIX-COMPOSANT-SEED';

if (!TOKEN || !TENANT_ID) {
  console.error('TOKEN et TENANT_ID requis — lancer : eval "$(bash nafura-platform/ops/qa-token.sh)"');
  process.exit(1);
}

function headers() {
  return {
    Authorization: `Bearer ${TOKEN}`,
    'X-Tenant-Id': TENANT_ID,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
}

async function api(method, path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: headers(),
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = text;
  }
  return { ok: res.ok, status: res.status, body: json };
}

function asList(body) {
  if (Array.isArray(body)) return body;
  return body?.content ?? body?.items ?? [];
}

async function findOrCreatePartner(code, raisonSociale) {
  const list = await api('GET', `/api/v1/partners?role=FOURNISSEUR&page=0&size=200&q=${encodeURIComponent(code)}`);
  const hit = asList(list.body).find((p) => p.code === code);
  if (hit) return hit;
  const created = await api('POST', '/api/v1/partners', {
    code,
    raisonSociale,
    roles: ['FOURNISSEUR'],
    ice: '000000000000000',
    email: `${code.toLowerCase()}@qa.nafuralabs.local`,
  });
  if (!created.ok) {
    throw new Error(`partner ${code} ${created.status} ${JSON.stringify(created.body)}`);
  }
  return created.body;
}

async function findOrCreateContact(partner) {
  const list = await api('GET', `/api/v1/partners/${partner.id}/contacts`);
  const existing = asList(list.body).find((c) => c.email);
  if (existing) return existing;
  const created = await api('POST', '/api/v1/partner-contacts', {
    partnerId: partner.id,
    nom: `Contact ${partner.raisonSociale}`,
    email: partner.email || `${partner.code.toLowerCase()}@qa.nafuralabs.local`,
    isPrimary: true,
  });
  if (!created.ok) {
    throw new Error(`contact ${partner.code} ${created.status} ${JSON.stringify(created.body)}`);
  }
  return created.body;
}

async function findUom(code) {
  const list = await api('GET', '/api/v1/units-of-measure?page=0&size=200');
  return asList(list.body).find((u) => u.code === code) ?? null;
}

async function findOrCreateItem({ code, name, uomCode, nature }) {
  const search = await api('GET', `/api/v1/items?page=0&size=100&q=${encodeURIComponent(code)}`);
  const hit = asList(search.body).find((i) => i.code === code || i.name === name);
  if (hit) {
    const detail = await api('GET', `/api/v1/items/${hit.id}`);
    return detail.ok ? detail.body : hit;
  }
  const uom = await findUom(uomCode);
  const created = await api('POST', '/api/v1/items', {
    code,
    name,
    nature: nature || 'MATIERE',
    unitOfMeasureId: uom?.id,
    isActive: true,
  });
  if (!created.ok) {
    throw new Error(`item ${code} ${created.status} ${JSON.stringify(created.body)}`);
  }
  const detail = await api('GET', `/api/v1/items/${created.body.id}`);
  return detail.ok ? detail.body : created.body;
}

async function ensureConsultation(articles, fournisseurs) {
  const list = await api('GET', '/api/v1/consultations-achat?lien=all');
  for (const row of asList(list.body)) {
    const detail = await api('GET', `/api/v1/consultations-achat/${row.id}`);
    const devis = detail.body?.devis ?? [];
    if (devis.some((d) => d.fichierNom === `${MARKER}.pdf`)) {
      return { consultation: detail.body, action: 'exists' };
    }
  }

  const cles = articles.map((a) => a.cleStable || a.code).filter(Boolean);
  const created = await api('POST', '/api/v1/consultations-achat', { clesStables: cles });
  if (!created.ok) {
    throw new Error(`consultation ${created.status} ${JSON.stringify(created.body)}`);
  }
  let consultation = created.body;
  for (const frn of fournisseurs) {
    const add = await api('POST', `/api/v1/consultations-achat/${consultation.id}/destinataires`, {
      fournisseurId: frn.partner.id,
      contactId: frn.contact.id,
    });
    if (!add.ok) {
      throw new Error(`destinataire ${frn.partner.code} ${add.status} ${JSON.stringify(add.body)}`);
    }
    consultation = add.body;
  }

  const dests = consultation.destinataires ?? [];
  const prices = {
    [articles[0].cleStable || articles[0].code]: [790, 805],
    [articles[1].cleStable || articles[1].code]: [1050, 1080],
    [articles[2].cleStable || articles[2].code]: [9400, 9550],
  };

  for (let i = 0; i < dests.length; i++) {
    const dest = dests[i];
    const lignes = articles.map((art) => {
      const cle = art.cleStable || art.code;
      const pu = (prices[cle] || [100, 110])[i] ?? 100;
      return {
        identite: cle,
        libelle: art.name,
        quantite: 1,
        unite: art.uomCode || art.uniteCode,
        prixUnitaire: pu,
      };
    });
    const imported = await api('POST', `/api/v1/consultations-achat/${consultation.id}/devis`, {
      destinataireId: dest.id,
      fichierNom: `${MARKER}.pdf`,
      lignes,
    });
    if (!imported.ok) {
      throw new Error(`devis ${dest.id} ${imported.status} ${JSON.stringify(imported.body)}`);
    }
    consultation = imported.body;
  }
  return { consultation, action: 'created' };
}

async function ensureBc(article, fournisseur, prix, notes) {
  const list = await api('GET', `/api/v1/bons-commande-achat?fournisseurId=${fournisseur.partner.id}`);
  const existing = asList(list.body).find((b) => b.notes === notes);
  if (existing) return { bc: existing, action: 'exists' };

  const created = await api('POST', '/api/v1/bons-commande-achat', {
    fournisseurId: fournisseur.partner.id,
    fournisseurName: fournisseur.partner.raisonSociale,
    dateLivraisonPrevue: '2026-07-20',
    conditionsPaiement: '30j fin de mois',
    modeReglement: 'VIREMENT',
    tvaTaux: 20,
    notes,
    lignes: [
      {
        articleId: article.id,
        articleCode: article.code,
        articleName: article.name,
        quantite: 12,
        uomCode: article.uomCode || 'M3',
        prixUnitaireHt: prix,
        totalHt: prix * 12,
      },
    ],
  });
  if (!created.ok) {
    throw new Error(`bc ${created.status} ${JSON.stringify(created.body)}`);
  }
  let bc = created.body;
  for (const action of ['submit', 'approve', 'send']) {
    const res = await api('POST', `/api/v1/bons-commande-achat/${bc.id}/${action}`, {
      validateurName: action === 'approve' ? 'QA Seed' : undefined,
    });
    if (res.ok) bc = res.body;
  }
  return { bc, action: 'created' };
}

async function ensureFacture(bc, article, fournisseur, prix) {
  const list = await api('GET', `/api/v1/factures-fournisseur?bcId=${bc.id}`);
  const existing = asList(list.body).find((f) => f.notes === MARKER);
  if (existing) return { facture: existing, action: 'exists' };

  const detail = await api('GET', `/api/v1/bons-commande-achat/${bc.id}`);
  const ligne = (detail.body?.lignes ?? [])[0];
  if (!ligne?.id) return { facture: null, action: 'skipped', reason: 'no-bc-line' };

  const created = await api('POST', '/api/v1/factures-fournisseur', {
    numeroFournisseur: 'F-QA-BETON-001',
    fournisseurId: fournisseur.partner.id,
    fournisseurName: fournisseur.partner.raisonSociale,
    bcId: bc.id,
    bcNumero: bc.numero,
    dateFacture: '2026-03-12',
    dateEcheance: '2026-04-12',
    notes: MARKER,
    lignes: [
      {
        designation: article.name,
        bcLigneId: ligne.id,
        compteCode: '6111',
        quantite: 12,
        prixUnitaireHt: prix,
        totalHt: prix * 12,
        tvaTaux: 20,
      },
    ],
  });
  if (!created.ok) {
    return { facture: null, action: 'failed', status: created.status, body: created.body };
  }
  let facture = created.body;
  const validated = await api('POST', `/api/v1/factures-fournisseur/${facture.id}/validate`);
  if (validated.ok) facture = validated.body;
  return { facture, action: 'created', validated: validated.ok };
}

async function main() {
  const log = [];
  const lafarge = {
    partner: await findOrCreatePartner('FRN-LAFARGE-QA', 'LafargeHolcim QA'),
  };
  lafarge.contact = await findOrCreateContact(lafarge.partner);
  const ciments = {
    partner: await findOrCreatePartner('FRN-CIMAT-QA', 'Ciments du Maroc QA'),
  };
  ciments.contact = await findOrCreateContact(ciments.partner);
  const sika = {
    partner: await findOrCreatePartner('FRN-SIKA-QA', 'Sika Maroc QA'),
  };
  sika.contact = await findOrCreateContact(sika.partner);
  log.push({ step: 'fournisseurs', ok: true });

  const beton = await findOrCreateItem({
    code: 'ART-BETON-B20',
    name: 'Béton B20',
    uomCode: 'M3',
  });
  const ciment = await findOrCreateItem({
    code: 'ART-CIM-325',
    name: 'Ciment CPJ 32,5 R',
    uomCode: 'T',
  });
  const acier = await findOrCreateItem({
    code: 'ART-ACIER-HA',
    name: 'Acier HA Ø12',
    uomCode: 'T',
  });
  log.push({
    step: 'articles',
    ok: true,
    beton: { id: beton.id, code: beton.code, cleStable: beton.cleStable },
    ciment: { id: ciment.id, code: ciment.code, cleStable: ciment.cleStable },
    acier: { id: acier.id, code: acier.code, cleStable: acier.cleStable },
  });

  const consultation = await ensureConsultation(
    [beton, ciment, acier],
    [lafarge, ciments],
  );
  log.push({
    step: 'consultation',
    ok: true,
    action: consultation.action,
    id: consultation.consultation.id,
    numero: consultation.consultation.numero,
  });

  const bcBeton = await ensureBc(beton, lafarge, 835, `${MARKER}-BETON`);
  log.push({
    step: 'bc-beton',
    ok: true,
    action: bcBeton.action,
    id: bcBeton.bc.id,
    numero: bcBeton.bc.numero,
    status: bcBeton.bc.status,
  });
  const facture = await ensureFacture(bcBeton.bc, beton, lafarge, 820);
  log.push({
    step: 'facture-beton',
    ok: facture.action !== 'failed',
    ...facture,
    id: facture.facture?.id,
    numero: facture.facture?.numeroInterne,
  });

  const bcCiment = await ensureBc(ciment, sika, 1048, `${MARKER}-CIMENT`);
  log.push({
    step: 'bc-ciment',
    ok: true,
    action: bcCiment.action,
    id: bcCiment.bc.id,
    numero: bcCiment.bc.numero,
    status: bcCiment.bc.status,
  });

  const failed = log.filter((e) => e.ok === false);
  console.log(JSON.stringify({ ok: failed.length === 0, log }, null, 2));
  process.exit(failed.length === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
