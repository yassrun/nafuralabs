/** SEKTOR-198 — preuve démarrage par OS (AC-5/AC-6/AC-8) sur un chantier préparé. */
const API_BASE = process.env.NAFURA_QA_API_BASE ?? 'http://127.0.0.1:8082';

async function json(res) {
  const text = await res.text();
  try { return { status: res.status, ok: res.ok, body: JSON.parse(text), text }; }
  catch { return { status: res.status, ok: res.ok, body: null, text }; }
}
async function api(h, method, path, body) {
  const opts = { method, headers: h };
  if (body !== undefined) opts.body = JSON.stringify(body);
  return json(await fetch(`${API_BASE}${path}`, opts));
}

/**
 * SEKTOR-209/P0-3 — plus aucune provenance forgée via l'API publique : le chantier préparé
 * naît de la conversion légitime (étude gagnée → EN_PREPARATION avec snapshot/arbre/budget).
 */
async function creerChantierDevis(h, suffix) {
  const ing = await api(h, 'GET', '/api/v1/etudes/ingenieurs');
  const charge = Array.isArray(ing.body) && ing.body[0] ? ing.body[0].userId : undefined;
  const clients = await api(h, 'GET', '/api/v1/partners?roles=CLIENT&size=5');
  const client = (Array.isArray(clients.body) ? clients.body : clients.body?.content ?? clients.body?.items ?? [])[0];
  const d = await api(h, 'POST', '/api/v1/etudes/dossiers', { objet: `OS198 ${suffix}`, chargeEtudeUserId: charge, clientNom: `MOA OS ${suffix}` });
  if (d.status !== 201) throw new Error(`dossier ${d.status} ${d.text}`);
  const dossierId = d.body.id;
  const b = await api(h, 'POST', `/api/v1/etudes/dossiers/${dossierId}/documents/init-bordereau-manuel`);
  const dpgfId = b.body.dpgfId;
  const lot = await api(h, 'POST', `/api/v1/etudes/dpgf/${dpgfId}/noeuds`, { type: 'LOT', code: '1', libelle: 'Lot GO' });
  const poste = await api(h, 'POST', `/api/v1/etudes/dpgf/${dpgfId}/noeuds`, {
    type: 'ARTICLE', parentId: lot.body.id, code: '1.1', libelle: 'Poste GO', quantite: 1, unite: 'U',
    origineCout: 'ESTIME', coutUnitaire: 582600, fraisGenerauxPercent: 0, margePercent: 15,
  });
  const dpu = await api(h, 'POST', '/api/v1/etudes/dpu', { dpgfNoeudId: poste.body.id });
  await api(h, 'POST', `/api/v1/etudes/dpu/${dpu.body.id}/composants`, {
    type: 'MATIERE', referenceType: 'LIBRE', libelle: 'Béton', rendement: 1, unite: 'U',
    prixUnitaire: 582600, sourcePrix: 'MANUEL',
  });
  await api(h, 'PUT', `/api/v1/etudes/dossiers/${dossierId}/etape`, { etape: 2 });
  await api(h, 'POST', `/api/v1/etudes/dossiers/${dossierId}/soumettre`);
  let v = await api(h, 'POST', `/api/v1/etudes/dossiers/${dossierId}/valider`);
  if (v.ok && v.body?.status === 'EN_VALIDATION') v = await api(h, 'POST', `/api/v1/etudes/dossiers/${dossierId}/valider`);
  const g = await api(h, 'POST', `/api/v1/etudes/dossiers/${dossierId}/generer-devis`, { clientId: client.id });
  const devisId = g.body?.devisGenereId ?? g.body?.id;
  const dd = await api(h, 'GET', `/api/v1/etudes/devis/${devisId}`);
  await api(h, 'POST', `/api/v1/etudes/devis/${devisId}/submit`);
  const gain = await api(h, 'POST', `/api/v1/etudes/dossiers/${dossierId}/gagne`, {
    dateAttribution: new Date().toISOString().slice(0, 10), devisId, montantAttribue: dd.body?.totalHt,
  });
  if (!gain.ok) throw new Error(`gagne ${gain.status} ${gain.text?.slice(0, 200)}`);
  const conv = await api(h, 'POST', `/api/v1/etudes/dossiers/${dossierId}/convertir`, {});
  if (!conv.ok) throw new Error(`convertir ${conv.status} ${conv.text?.slice(0, 200)}`);
  return conv.body?.chantierId ?? conv.body?.id;
}

async function main() {
  const s = await (await fetch(`${API_BASE}/api/public/dev/cursor-session`, { method: 'POST' })).json();
  const h = { Authorization: `Bearer ${s.accessToken}`, 'X-Tenant-Id': s.tenantId, 'Content-Type': 'application/json', Accept: 'application/json' };
  const suffix = Date.now().toString(36);

  const id = await creerChantierDevis(h, suffix);
  console.log(`chantier converti: ${id}`);

  // 5) Bloqueurs stables : un chantier EN_PREPARATION sans responsables ni dates renvoie les codes.
  const refus0 = await api(h, 'POST', `/api/v1/chantiers/${id}/demarrer-os`, { osReference: 'OS-X', osDateEffet: '2026-09-01' });
  console.log(`bloqueurs → ${refus0.status} ${JSON.stringify(refus0.body)}`);
  if (refus0.status === 422 && Array.isArray(refus0.body?.bloqueurs)
      && refus0.body.bloqueurs.includes('responsables')) {
    console.log('PASS AC-5 — bloqueurs stables renvoyés (422), rien n\'est démarré');
  } else {
    throw new Error(`attendu 422 bloqueurs, obtenu ${refus0.status} ${refus0.text}`);
  }

  // Préparer : responsables + dates (règles centralisées satisfaites).
  const aff1 = await api(h, 'POST', `/api/v1/chantiers/${id}/affectations`, { employeId: 'qa-emp-conducteur', roleCode: 'BTP_CONDUCTEUR_TRAVAUX', dateDebut: '2026-09-01' });
  const aff2 = await api(h, 'POST', `/api/v1/chantiers/${id}/affectations`, { employeId: 'qa-emp-chef-chantier', roleCode: 'BTP_CHEF_CHANTIER', dateDebut: '2026-09-01' });
  if (!aff1.ok || !aff2.ok) throw new Error(`affectations ${aff1.status}/${aff2.status} ${aff1.text} ${aff2.text}`);
  const upd = await api(h, 'PUT', `/api/v1/chantiers/${id}`, { dateDebut: '2026-09-01', dateFinPrevue: '2027-05-01' });
  if (!upd.ok) throw new Error(`dates ${upd.status} ${upd.text}`);

  // 1) Refus sans OS — le formulaire exige l'OS.
  const sansOs = await api(h, 'POST', `/api/v1/chantiers/${id}/demarrer-os`, {});
  console.log(`sans OS → ${sansOs.status} ${JSON.stringify(sansOs.body)}`);
  if (sansOs.status === 400 || sansOs.status === 422) console.log('PASS AC-6a — démarrage refusé sans OS');
  else throw new Error(`attendu refus sans OS, obtenu ${sansOs.status}`);

  // 2) Démarrage par OS atomique.
  const os = await api(h, 'POST', `/api/v1/chantiers/${id}/demarrer-os`, {
    osReference: `OS-2026-${suffix}`.slice(0, 40), osDateEffet: '2026-09-01',
  });
  const ck = await api(h, 'GET', `/api/v1/chantiers/${id}/cockpit`);
  console.log(`OS → ${os.status} · cockpit=${ck.body?.identity?.status} · OS=${ck.body?.schedule?.osReference}`);
  if (os.ok && ck.body?.identity?.status === 'EN_COURS' && ck.body?.schedule?.osReference) {
    console.log('PASS AC-6b — démarrage par OS atomique → EN_COURS, OS posé');
  } else {
    throw new Error(`démarrage OS ${os.status} ${os.text}`);
  }

  // 3) Cockpit après démarrage : EN_COURS, action primaire opérationnelle (avancement).
  const primaire = ck.body?.nextActions?.[0];
  console.log(`cockpit status=${ck.body?.identity?.status} action1=${JSON.stringify(primaire)}`);
  if (ck.body?.identity?.status === 'EN_COURS') console.log('PASS AC-2 — cockpit EN_COURS');
  else throw new Error(`cockpit status ${ck.body?.identity?.status}`);

  // 4) Chantier sans planning démarrable (AC-8) : aucune activité créée.
  const activites = await api(h, 'GET', `/api/v1/chantiers/${id}/activites`);
  const acts = Array.isArray(activites.body) ? activites.body : activites.body?.content ?? [];
  if (acts.length === 0) console.log('PASS AC-8 — démarré sans aucun planning/activité');
  else throw new Error(`activités inattendues ${acts.length}`);

  console.log(`\nchantierId=${id}`);
  console.log('SEKTOR-198 : 5/5 PASS');
  process.exit(0);
}

main().catch((e) => { console.error('FAIL', e); process.exit(1); });
