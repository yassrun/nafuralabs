/**
 * Preuve SEKTOR-228 — CTA conversion sans marché (AC-D2, dette SEKTOR-213).
 * Run: node sektor/e2e/scripts/verify-dette-conversion-228.mjs
 *
 * Discriminants :
 *   - aucun « Créer chantier et marché » sur le geste conversion (grep chrome)
 *   - convertir avec libellé vide refusé si envoyé explicitement
 *   - convertir avec libellé seul → marcheGenereId nul, chantier EN_PREPARATION
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const API_BASE = process.env.NAFURA_QA_API_BASE ?? 'http://localhost:8082';

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

function assertChrome() {
  const here = dirname(fileURLToPath(import.meta.url));
  const root = join(here, '../..');
  const files = [
    join(root, 'sources/web/app/etudes/dossiers/components/dossier-summary-header/dossier-summary-header.component.ts'),
    join(root, 'sources/web/app/etudes/dossiers/components/conversion-chantier-dialog/conversion-chantier-dialog.component.ts'),
    join(root, 'sources/web/public/assets/i18n/applications/erp/fr.json'),
    join(root, 'sources/web/public/assets/i18n/applications/erp/en.json'),
  ];
  for (const f of files) {
    if (!existsSync(f)) throw new Error(`VU ROUGE chrome : ${f} absent`);
  }
  const header = readFileSync(files[0], 'utf8');
  const dialog = readFileSync(files[1], 'utf8');
  const fr = readFileSync(files[2], 'utf8');
  if (header.includes('Créer chantier et marché')) {
    throw new Error('VU ROUGE : header CTA dit encore « Créer chantier et marché »');
  }
  if (!header.includes('Créer le chantier')) {
    throw new Error('VU ROUGE : header CTA sans « Créer le chantier »');
  }
  if (dialog.includes('Créer chantier et marché')) {
    throw new Error('VU ROUGE : dialog dit encore « Créer chantier et marché »');
  }
  if (!dialog.includes('[disabled]="!canConvert()"')) {
    throw new Error('VU ROUGE : Convertir reste actif sans libellé');
  }
  if (!dialog.includes('Facultatif — avant l\'OS')) {
    throw new Error('VU ROUGE : hints date/durée facultatifs absents');
  }
  if (fr.includes('Créer chantier et marché')) {
    throw new Error('VU ROUGE : fr.json contient encore « Créer chantier et marché »');
  }
  if (!fr.includes('"cta": "Créer le chantier"')) {
    throw new Error('VU ROUGE : i18n conversion.cta absent');
  }
}

async function dossierGagne(h, suffix) {
  const ing = await api(h, 'GET', '/api/v1/etudes/ingenieurs');
  const charge = Array.isArray(ing.body) && ing.body[0] ? ing.body[0].userId : undefined;
  const clients = await api(h, 'GET', '/api/v1/partners?roles=CLIENT&size=5');
  const client = (Array.isArray(clients.body) ? clients.body : clients.body?.content ?? clients.body?.items ?? [])[0];
  if (!client?.id) throw new Error('aucun client pour 228');

  const d = await api(h, 'POST', '/api/v1/etudes/dossiers', {
    objet: `Dette conversion 228 ${suffix}`,
    chargeEtudeUserId: charge,
    clientNom: `MOA 228 ${suffix}`,
  });
  if (d.status !== 201) throw new Error(`dossier ${d.status} ${d.text}`);
  const dossierId = d.body.id;

  const b = await api(h, 'POST', `/api/v1/etudes/dossiers/${dossierId}/documents/init-bordereau-manuel`);
  const dpgfId = b.body?.dpgfId;
  const lot = await api(h, 'POST', `/api/v1/etudes/dpgf/${dpgfId}/noeuds`, {
    type: 'LOT', code: '1', libelle: 'Gros œuvre',
  });
  const poste = await api(h, 'POST', `/api/v1/etudes/dpgf/${dpgfId}/noeuds`, {
    type: 'ARTICLE', parentId: lot.body.id, code: '1.1', libelle: 'Fondations',
    quantite: 10, unite: 'm3', origineCout: 'ESTIME', coutUnitaire: 500, fraisGenerauxPercent: 0, margePercent: 10,
  });
  if (poste.status !== 201) throw new Error(`poste ${poste.status} ${poste.text}`);

  await api(h, 'PUT', `/api/v1/etudes/dossiers/${dossierId}/etape`, { etape: 2 });
  const soumis = await api(h, 'POST', `/api/v1/etudes/dossiers/${dossierId}/soumettre`);
  if (!soumis.ok) throw new Error(`soumettre ${soumis.status} ${soumis.text?.slice(0, 150)}`);

  let v = await api(h, 'POST', `/api/v1/etudes/dossiers/${dossierId}/valider`);
  if (v.ok && v.body?.status === 'EN_VALIDATION') {
    v = await api(h, 'POST', `/api/v1/etudes/dossiers/${dossierId}/valider`);
  }
  if (!v.ok || v.body?.status !== 'VALIDEE') {
    throw new Error(`valider ${v.status} ${v.text?.slice(0, 150)}`);
  }

  const g = await api(h, 'POST', `/api/v1/etudes/dossiers/${dossierId}/generer-devis`, { clientId: client.id });
  if (!g.ok) throw new Error(`generer-devis ${g.status} ${g.text}`);
  const devisId = g.body?.devisGenereId ?? g.body?.id;
  const dd = await api(h, 'GET', `/api/v1/etudes/devis/${devisId}`);
  await api(h, 'POST', `/api/v1/etudes/devis/${devisId}/submit`);
  const total = dd.body?.totalHt ?? dd.body?.totalHT;

  const gain = await api(h, 'POST', `/api/v1/etudes/dossiers/${dossierId}/gagne`, {
    dateAttribution: new Date().toISOString().slice(0, 10),
    devisId,
    montantAttribue: total,
  });
  if (!gain.ok) throw new Error(`gagne ${gain.status} ${gain.text?.slice(0, 200)}`);

  return { dossierId, objet: d.body.objet };
}

async function main() {
  assertChrome();
  console.log('PASS chrome : CTA « Créer le chantier », dialog sans marché, Convertir gated');

  const probe = await fetch(`${API_BASE}/api/public/dev/cursor-session`, {
    method: 'POST', headers: { Accept: 'application/json' },
  });
  const probeBody = await probe.json().catch(() => null);
  if (!probeBody?.accessToken) {
    console.log('SKIP API : cursor-session unavailable');
    process.exit(0);
  }

  const h = await session();
  const suffix = Date.now().toString(36);
  const { dossierId, objet } = await dossierGagne(h, suffix);

  const refuse = await api(h, 'POST', `/api/v1/etudes/dossiers/${dossierId}/convertir`, {
    chantierLabel: '   ',
  });
  if (refuse.ok) {
    throw new Error('libellé vide accepté — attendu refus API');
  }
  const msg = refuse.body?.message ?? refuse.text ?? '';
  if (!String(msg).includes('libelle_chantier_requis')) {
    throw new Error(`refus libellé vide incohérent : ${msg.slice(0, 200)}`);
  }
  console.log('PASS API : libellé vide refusé');

  const conv = await api(h, 'POST', `/api/v1/etudes/dossiers/${dossierId}/convertir`, {
    chantierLabel: objet,
  });
  if (!conv.ok) throw new Error(`convertir ${conv.status} ${conv.text?.slice(0, 200)}`);
  if (conv.body?.marcheId || conv.body?.marcheGenereId) {
    throw new Error(`conversion a créé un marché : ${JSON.stringify(conv.body)}`);
  }
  const chantierId = conv.body?.chantierId ?? conv.body?.id;
  if (!chantierId) throw new Error('chantierId absent après conversion');

  const syn = await api(h, 'GET', `/api/v1/etudes/dossiers/${dossierId}/synthese`);
  if (syn.body?.marcheGenereId) {
    throw new Error(`marcheGenereId après conversion : ${syn.body.marcheGenereId}`);
  }
  console.log('PASS API : marcheGenereId nul après conversion');

  const ch = await api(h, 'GET', `/api/v1/chantiers/${chantierId}`);
  if (!ch.ok) throw new Error(`GET chantier ${ch.status}`);
  if (ch.body?.statut !== 'EN_PREPARATION' && ch.body?.status !== 'EN_PREPARATION') {
    throw new Error(`statut attendu EN_PREPARATION, obtenu ${ch.body?.statut ?? ch.body?.status}`);
  }
  if (ch.body?.sourceVente !== 'DEVIS') {
    throw new Error(`source vente attendue DEVIS, obtenu ${ch.body?.sourceVente}`);
  }
  console.log('PASS API : chantier EN_PREPARATION, sourceVente DEVIS');

  console.log('PASS SEKTOR-228');
}

main().catch((e) => {
  console.error('FAIL', e.message ?? e);
  process.exit(1);
});
