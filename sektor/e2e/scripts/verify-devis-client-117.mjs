/**
 * Preuve SEKTOR-117 — créer le client Partner puis générer le devis.
 * Run: node sektor/e2e/scripts/verify-devis-client-117.mjs
 *
 * Baseline vu rouge (20/08, backend avant clientId body) :
 *   POST generer-devis {} → 400 etudes.gate.chiffrage.client_manquant
 *   POST generer-devis { clientId } → 400 même message (body ignoré)
 */
const API_BASE = process.env.NAFURA_QA_API_BASE ?? 'http://localhost:8082';
const MOA = 'MOA QA 117 Tanger';

async function json(res) {
  const text = await res.text();
  try {
    return { status: res.status, ok: res.ok, body: JSON.parse(text), text };
  } catch {
    return { status: res.status, ok: res.ok, body: null, text };
  }
}

function headers(session) {
  return {
    Authorization: `Bearer ${session.accessToken}`,
    'X-Tenant-Id': session.tenantId,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
}

async function seedValideeSansClient(h, chargeEtudeUserId, suffix) {
  const created = await json(
    await fetch(`${API_BASE}/api/v1/etudes/dossiers`, {
      method: 'POST',
      headers: h,
      body: JSON.stringify({
        objet: `Devis client 117 ${suffix}`,
        chargeEtudeUserId,
        clientNom: MOA,
      }),
    }),
  );
  if (created.status !== 201) throw new Error(`dossier ${created.status} ${created.text}`);
  const dossierId = created.body.id;

  const init = await json(
    await fetch(`${API_BASE}/api/v1/etudes/dossiers/${dossierId}/documents/init-bordereau-manuel`, {
      method: 'POST',
      headers: h,
    }),
  );
  if (!init.ok) throw new Error(`init-bordereau ${init.status} ${init.text}`);
  const dpgfId = init.body.dpgfId;

  const lot = await json(
    await fetch(`${API_BASE}/api/v1/etudes/dpgf/${dpgfId}/noeuds`, {
      method: 'POST',
      headers: h,
      body: JSON.stringify({ type: 'LOT', code: '1', libelle: 'Lot GO 117' }),
    }),
  );
  if (lot.status !== 201) throw new Error(`lot ${lot.status} ${lot.text}`);

  const art = await json(
    await fetch(`${API_BASE}/api/v1/etudes/dpgf/${dpgfId}/noeuds`, {
      method: 'POST',
      headers: h,
      body: JSON.stringify({
        type: 'ARTICLE',
        parentId: lot.body.id,
        code: '1.1',
        libelle: `Poste 117 ${suffix}`,
        quantite: 1,
        unite: 'u',
        origineCout: 'FORFAIT',
        coutUnitaire: 100,
        fraisGenerauxPercent: 10,
        margePercent: 17.5,
      }),
    }),
  );
  if (art.status !== 201) throw new Error(`article ${art.status} ${art.text}`);

  const etape = await json(
    await fetch(`${API_BASE}/api/v1/etudes/dossiers/${dossierId}/etape`, {
      method: 'PUT',
      headers: h,
      body: JSON.stringify({ etape: 2 }),
    }),
  );
  if (!etape.ok) throw new Error(`etape ${etape.status} ${etape.text}`);

  const soumettre = await json(
    await fetch(`${API_BASE}/api/v1/etudes/dossiers/${dossierId}/soumettre`, {
      method: 'POST',
      headers: h,
    }),
  );
  if (!soumettre.ok) throw new Error(`soumettre ${soumettre.status} ${soumettre.text}`);

  let valider = await json(
    await fetch(`${API_BASE}/api/v1/etudes/dossiers/${dossierId}/valider`, {
      method: 'POST',
      headers: h,
    }),
  );
  if (!valider.ok) throw new Error(`valider ${valider.status} ${valider.text}`);
  if (valider.body.status === 'EN_VALIDATION') {
    valider = await json(
      await fetch(`${API_BASE}/api/v1/etudes/dossiers/${dossierId}/valider`, {
        method: 'POST',
        headers: h,
      }),
    );
    if (!valider.ok) throw new Error(`valider2 ${valider.status} ${valider.text}`);
  }
  if (valider.body.status !== 'VALIDEE') {
    throw new Error(`attendu VALIDEE, reçu ${valider.body.status}`);
  }
  return dossierId;
}

async function main() {
  const sessionRes = await fetch(`${API_BASE}/api/public/dev/cursor-session`, {
    method: 'POST',
    headers: { Accept: 'application/json' },
  });
  const session = await sessionRes.json();
  if (!session?.accessToken || !session?.tenantId) {
    console.log('SKIP cursor-session unavailable');
    process.exit(0);
  }
  const h = headers(session);
  const suffix = Date.now().toString(36);
  let ingenieurs = [];
  const ingRes = await fetch(`${API_BASE}/api/v1/etudes/ingenieurs`, { headers: h });
  if (ingRes.ok) ingenieurs = await ingRes.json();
  const chargeEtudeUserId = ingenieurs[0]?.userId ?? session.userId;

  const dossierId = await seedValideeSansClient(h, chargeEtudeUserId, suffix);

  const refus = await json(
    await fetch(`${API_BASE}/api/v1/etudes/dossiers/${dossierId}/generer-devis`, {
      method: 'POST',
      headers: h,
      body: '{}',
    }),
  );
  if (refus.ok) throw new Error('attendu 400 sans Partner, reçu OK');
  if (!/client_manquant/.test(refus.text)) {
    throw new Error(`attendu client_manquant, reçu ${refus.text}`);
  }
  console.log('ok sans Partner → client_manquant (garde / vu rouge)');

  const partner = await json(
    await fetch(`${API_BASE}/api/v1/partners`, {
      method: 'POST',
      headers: h,
      body: JSON.stringify({
        code: `CLI117${suffix}`.slice(0, 30),
        raisonSociale: `${MOA} ${suffix}`,
        roles: ['CLIENT'],
      }),
    }),
  );
  if (partner.status !== 201) throw new Error(`partner ${partner.status} ${partner.text}`);

  const ok = await json(
    await fetch(`${API_BASE}/api/v1/etudes/dossiers/${dossierId}/generer-devis`, {
      method: 'POST',
      headers: h,
      body: JSON.stringify({ clientId: partner.body.id }),
    }),
  );
  if (!ok.ok) throw new Error(`generer-devis ${ok.status} ${ok.text}`);
  if (ok.body.clientId !== partner.body.id) {
    throw new Error(`clientId ${ok.body.clientId} ≠ ${partner.body.id}`);
  }
  if (!ok.body.devisGenereId) throw new Error('devisGenereId manquant');
  if (ok.body.status !== 'DEVIS_GENERE') {
    throw new Error(`status ${ok.body.status}`);
  }
  console.log('ok Partner + clientId → devis', ok.body.devisGenereId);
}

main().catch((e) => {
  console.error('FAIL', e.message || e);
  process.exit(1);
});
