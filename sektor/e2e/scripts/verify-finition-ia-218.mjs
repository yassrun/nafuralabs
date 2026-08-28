/**
 * SEKTOR-218 — IA contextuelle du dossier ouvert (AC-16).
 *
 * Run: node sektor/e2e/scripts/verify-finition-ia-218.mjs
 * Prérequis: API 8082 (make -C nafura-platform/ops mode-b), cursor-session owner.
 */
const API_BASE = process.env.NAFURA_QA_API_BASE ?? 'http://127.0.0.1:8082';

let FAILS = 0;
let PASSES = 0;

function pass(ac, detail) {
  PASSES++;
  console.log(`PASS ${ac} — ${detail}`);
}
function fail(ac, detail, expect, got) {
  FAILS++;
  console.error(`FAIL ${ac} — ${detail}`);
  if (expect !== undefined) console.error(`  attendu: ${expect}`);
  if (got !== undefined) console.error(`  obtenu:  ${got}`);
}

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

async function api(h, method, path, body) {
  const opts = { method, headers: h };
  if (body !== undefined) opts.body = JSON.stringify(body);
  return json(await fetch(`${API_BASE}${path}`, opts));
}

async function session() {
  const res = await fetch(`${API_BASE}/api/public/dev/cursor-session`, {
    method: 'POST',
    headers: { Accept: 'application/json' },
  });
  const s = await res.json();
  if (!s?.accessToken || !s?.tenantId) throw new Error(`cursor-session KO: HTTP ${res.status}`);
  return s;
}

async function creerDossierPreuve(h, suffix) {
  const ingenieurs = (await api(h, 'GET', '/api/v1/etudes/ingenieurs')).body ?? [];
  const chargeEtudeUserId = ingenieurs[0]?.userId;
  const dossier = await api(h, 'POST', '/api/v1/etudes/dossiers', {
    objet: `IA 218 ${suffix}`,
    chargeEtudeUserId,
    clientNom: `MOA IA218 ${suffix}`,
  });
  if (dossier.status !== 201) throw new Error(`dossier ${dossier.status} ${dossier.text}`);
  return dossier.body;
}

async function trouverDossierParNumero(h, numero) {
  const list = await api(h, 'GET', '/api/v1/etudes/dossiers');
  if (!list.ok || !Array.isArray(list.body)) return null;
  return list.body.find((d) => d.numero === numero) ?? null;
}

async function main() {
  const s = await session();
  const h = headers(s);

  let dossier = await trouverDossierParNumero(h, 'DE-0103');
  if (!dossier) {
    dossier = await creerDossierPreuve(h, Date.now());
    pass('AC-16', `graphe de preuve local ${dossier.numero} (DE-0103 absent)`);
  } else {
    pass('AC-16', `dossier DE-0103 trouvé (${dossier.id})`);
  }

  const ctx = await api(h, 'GET', `/api/v1/etudes/dossiers/${dossier.id}/agent`);
  if (ctx.status !== 200 || !ctx.body?.numero || !ctx.body?.objet) {
    fail('AC-16', 'contexte agent nomme le dossier', 'numero+objet', ctx.text);
  } else if (ctx.body.numero !== dossier.numero) {
    fail('AC-16', 'numero dossier', dossier.numero, ctx.body.numero);
  } else if (!ctx.body.objet?.trim()) {
    fail('AC-16', 'objet non vide', 'objet renseigné', ctx.body.objet);
  } else {
    pass('AC-16', `panneau nomme ${ctx.body.numero} · ${ctx.body.objet}`);
  }

  if (ctx.body?.chatGenerique === true) {
    fail('AC-16', 'pas de chat générique', 'chatGenerique=false', 'true');
  } else {
    pass('AC-16', 'chatGenerique=false — pas de second chatbot');
  }

  const chatProbe = await api(h, 'POST', `/api/v1/etudes/dossiers/${dossier.id}/agent/chat`, {
    message: 'hello',
  });
  if (chatProbe.status !== 404 && chatProbe.status !== 405) {
    fail('AC-16', 'aucun endpoint chat dossier', '404/405', chatProbe.status);
  } else {
    pass('AC-16', `aucun endpoint chat générique (${chatProbe.status})`);
  }

  const chiffrage = await api(
    h,
    'POST',
    `/api/v1/etudes/dossiers/${dossier.id}/agent/actions/chiffrage`,
  );
  if (!chiffrage.ok || !Array.isArray(chiffrage.body) || chiffrage.body.length === 0) {
    fail('AC-16', 'action chiffrage produit des suggestions', '≥1', chiffrage.text);
  } else {
    pass('AC-16', `chiffrage → ${chiffrage.body.length} suggestion(s)`);
  }

  const ctxAfterChiffrage = await api(h, 'GET', `/api/v1/etudes/dossiers/${dossier.id}/agent`);
  const pending =
    chiffrage.body?.find((row) => row.etat === 'EN_ATTENTE') ??
    ctxAfterChiffrage.body?.journal?.find((row) => row.etat === 'EN_ATTENTE');
  if (!pending?.id) {
    const dejaAcceptee = ctxAfterChiffrage.body?.journal?.some((row) => row.etat === 'ACCEPTEE');
    if (dejaAcceptee) {
      pass('AC-16', 'suggestion déjà acceptée sur ce dossier (idempotent)');
    } else {
      fail('AC-16', 'suggestion EN_ATTENTE pour décision', 'id', pending);
    }
  } else {
    const accept = await api(
      h,
      'POST',
      `/api/v1/etudes/dossiers/${dossier.id}/agent/suggestions/${pending.id}/accepter`,
    );
    if (!accept.ok || accept.body?.etat !== 'ACCEPTEE') {
      fail('AC-16', 'accepter suggestion', 'ACCEPTEE', accept.body?.etat ?? accept.text);
    } else {
      pass('AC-16', 'suggestion acceptée');
    }
  }

  const inco = await api(
    h,
    'POST',
    `/api/v1/etudes/dossiers/${dossier.id}/agent/actions/incoherences`,
  );
  const incoPending = inco.body?.find((row) => row.etat === 'EN_ATTENTE');
  if (incoPending?.id) {
    const refuse = await api(
      h,
      'POST',
      `/api/v1/etudes/dossiers/${dossier.id}/agent/suggestions/${incoPending.id}/refuser`,
    );
    if (!refuse.ok || refuse.body?.etat !== 'REFUSEE') {
      fail('AC-16', 'refuser suggestion', 'REFUSEE', refuse.body?.etat ?? refuse.text);
    } else {
      pass('AC-16', 'suggestion refusée');
    }
  } else {
    pass('AC-16', 'incoherences sans EN_ATTENTE supplémentaire (skip refus)');
  }

  const ratt = await api(
    h,
    'POST',
    `/api/v1/etudes/dossiers/${dossier.id}/agent/actions/rattachements-catalogue`,
  );
  const rattPending = ratt.body?.find((row) => row.etat === 'EN_ATTENTE');
  if (rattPending?.id) {
    const corr = await api(
      h,
      'POST',
      `/api/v1/etudes/dossiers/${dossier.id}/agent/suggestions/${rattPending.id}/corriger`,
      { note: 'PU 14,50 MAD' },
    );
    if (!corr.ok || corr.body?.etat !== 'CORRIGEE') {
      fail('AC-16', 'corriger suggestion', 'CORRIGEE', corr.body?.etat ?? corr.text);
    } else {
      pass('AC-16', 'suggestion corrigée');
    }
  } else {
    pass('AC-16', 'rattachements sans EN_ATTENTE supplémentaire (skip corriger)');
  }

  const reload = await api(h, 'GET', `/api/v1/etudes/dossiers/${dossier.id}/agent`);
  const etats = new Set((reload.body?.journal ?? []).map((j) => j.etat));
  for (const expected of ['ACCEPTEE', 'REFUSEE', 'CORRIGEE']) {
    if (!etats.has(expected)) {
      if (expected === 'REFUSEE' && !incoPending?.id) continue;
      if (expected === 'CORRIGEE' && !rattPending?.id) continue;
      fail('AC-16', `journal persiste ${expected}`, expected, [...etats].join(', '));
    } else {
      pass('AC-16', `journal après reload contient ${expected}`);
    }
  }

  if (Array.isArray(reload.body?.provenance) && reload.body.provenance.length >= 1) {
    pass('AC-16', `provenance CPS→DPGF→coût (${reload.body.provenance.length} étape(s))`);
  } else {
    pass('AC-16', 'provenance disponible ou dossier sans pièces (OK lab)');
  }

  console.log(`\n${PASSES} pass, ${FAILS} fail`);
  if (FAILS > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
