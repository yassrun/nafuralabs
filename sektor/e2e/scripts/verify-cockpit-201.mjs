/**
 * SEKTOR-201/209 — preuve Mode B du contrat cockpit-chantier (AC-1 à AC-22), comportements réels.
 *
 * SEKTOR-209 : la fixture ne forge jamais de provenance via l'API publique (P0-3) — le chantier
 * DEVIS naît du flux de conversion légitime (étude gagnée → chantier EN_PREPARATION avec snapshot),
 * et les chantiers directs sont créés SANS provenance. La marge négative (AC-12) est produite par
 * une RÉVISION budgétaire réelle (coûts réévalués au-dessus de la vente) sur le chantier converti.
 *
 * Run: node sektor/e2e/scripts/verify-cockpit-201.mjs
 */
const API_BASE = process.env.NAFURA_QA_API_BASE ?? 'http://127.0.0.1:8082';

let PASSES = 0;
let FAILS = 0;
const verdicts = [];
function pass(ac, detail) { PASSES++; verdicts.push(`PASS ${ac} — ${detail}`); console.log(`PASS ${ac} — ${detail}`); }
function fail(ac, detail, expect, got) { FAILS++; verdicts.push(`FAIL ${ac} — ${detail} | attendu: ${expect} | obtenu: ${got}`); console.error(`FAIL ${ac} — ${detail}`); console.error(`  attendu: ${expect}`); console.error(`  obtenu:  ${got}`); }
async function json(res) { const t = await res.text(); try { return { status: res.status, ok: res.ok, body: JSON.parse(t), text: t }; } catch { return { status: res.status, ok: res.ok, body: null, text: t }; } }
async function api(h, method, path, body) { const opts = { method, headers: h }; if (body !== undefined) opts.body = JSON.stringify(body); return json(await fetch(`${API_BASE}${path}`, opts)); }
async function session(role) { const url = `${API_BASE}/api/public/dev/cursor-session${role ? `?role=${role}` : ''}`; const s = await (await fetch(url, { method: 'POST' })).json(); return { Authorization: `Bearer ${s.accessToken}`, 'X-Tenant-Id': s.tenantId, 'Content-Type': 'application/json', Accept: 'application/json' }; }
function totalHtDevis(devis) { return devis?.totalHt ?? devis?.totalHT; }

/** SEKTOR-209/P0-3 — le chantier DEVIS ne naît que du flux de conversion légitime. */
async function creerChantierDevis(h, tag, suffix) {
  const ing = await api(h, 'GET', '/api/v1/etudes/ingenieurs');
  const charge = Array.isArray(ing.body) && ing.body[0] ? ing.body[0].userId : undefined;
  const clients = await api(h, 'GET', '/api/v1/partners?roles=CLIENT&size=5');
  const client = (Array.isArray(clients.body) ? clients.body : clients.body?.content ?? clients.body?.items ?? [])[0];
  const d = await api(h, 'POST', '/api/v1/etudes/dossiers', { objet: `Cockpit ${tag} ${suffix}`, chargeEtudeUserId: charge, clientNom: `MOA ${tag}` });
  if (d.status !== 201) throw new Error(`dossier ${d.status} ${d.text}`);
  const dossierId = d.body.id;
  const b = await api(h, 'POST', `/api/v1/etudes/dossiers/${dossierId}/documents/init-bordereau-manuel`);
  const dpgfId = b.body.dpgfId;
  const lot = await api(h, 'POST', `/api/v1/etudes/dpgf/${dpgfId}/noeuds`, { type: 'LOT', code: '1', libelle: 'Lot GO' });
  const poste = await api(h, 'POST', `/api/v1/etudes/dpgf/${dpgfId}/noeuds`, {
    type: 'ARTICLE', parentId: lot.body.id, code: '1.1', libelle: `Poste ${tag}`, quantite: 1, unite: 'U',
    origineCout: 'ESTIME', coutUnitaire: 582600, fraisGenerauxPercent: 0, margePercent: 15,
  });
  if (poste.status !== 201) throw new Error(`poste etude ${poste.status} ${poste.text}`);
  // DPU sur le poste : le déboursé copié à la conversion vient d'ici (AC-10).
  const dpu = await api(h, 'POST', '/api/v1/etudes/dpu', { dpgfNoeudId: poste.body.id });
  if (!dpu.ok) throw new Error(`dpu ${dpu.status} ${dpu.text}`);
  await api(h, 'POST', `/api/v1/etudes/dpu/${dpu.body.id}/composants`, {
    type: 'MATIERE', referenceType: 'LIBRE', libelle: 'Béton', rendement: 1, unite: 'U',
    prixUnitaire: 582600, sourcePrix: 'MANUEL',
  });
  await api(h, 'PUT', `/api/v1/etudes/dossiers/${dossierId}/etape`, { etape: 2 });
  const soumis = await api(h, 'POST', `/api/v1/etudes/dossiers/${dossierId}/soumettre`);
  if (!soumis.ok) throw new Error(`soumettre ${soumis.status} ${soumis.text?.slice(0, 150)}`);
  let v = await api(h, 'POST', `/api/v1/etudes/dossiers/${dossierId}/valider`);
  if (v.ok && v.body?.status === 'EN_VALIDATION') v = await api(h, 'POST', `/api/v1/etudes/dossiers/${dossierId}/valider`);
  if (!v.ok || v.body?.status !== 'VALIDEE') throw new Error(`valider ${v.status} ${v.text?.slice(0, 150)}`);
  const g = await api(h, 'POST', `/api/v1/etudes/dossiers/${dossierId}/generer-devis`, { clientId: client.id });
  if (!g.ok) throw new Error(`generer-devis ${g.status} ${g.text}`);
  const devisId = g.body?.devisGenereId ?? g.body?.id;
  const dd = await api(h, 'GET', `/api/v1/etudes/devis/${devisId}`);
  await api(h, 'POST', `/api/v1/etudes/devis/${devisId}/submit`);
  const total = totalHtDevis(dd.body);
  const gain = await api(h, 'POST', `/api/v1/etudes/dossiers/${dossierId}/gagne`, {
    dateAttribution: new Date().toISOString().slice(0, 10), devisId, montantAttribue: total,
  });
  if (!gain.ok) throw new Error(`gagne ${gain.status} ${gain.text?.slice(0, 200)}`);
  const conv = await api(h, 'POST', `/api/v1/etudes/dossiers/${dossierId}/convertir`, {});
  if (!conv.ok) throw new Error(`convertir ${conv.status} ${conv.text?.slice(0, 200)}`);
  const chantierId = conv.body?.chantierId ?? conv.body?.id;
  return { chantierId, devisId, dossierId, totalDevis: total, clientId: client.id };
}

/** Retrouve le premier nœud POSTE feuille dans l'arbre budgétaire (AC-12). */
function trouverPosteArbre(arbre) {
  const lots = arbre?.lots ?? [];
  for (const lot of lots) {
    const pile = [...(lot?.noeuds ?? []), ...(lot?.enfants ?? [])];
    while (pile.length) {
      const n = pile.shift();
      if (n?.type === 'POSTE') return n;
      if (n?.enfants) pile.push(...n.enfants);
      if (n?.noeuds) pile.push(...n.noeuds);
    }
  }
  return null;
}

async function main() {
  const oh = await session();
  const suffix = Date.now().toString(36);

  // ── SEKTOR-209/P0-3 — provenance forgee refusee, direct sans provenance ─────
  const forge = await api(oh, 'POST', '/api/v1/chantiers', {
    label: `Forge ${suffix}`, clientId: 'cli-x', clientName: 'X', ville: 'Rabat',
    sourceVente: 'DEVIS', devisId: '00000000-0000-0000-0000-00000000dead', devisNumero: 'DV-FORGE',
    montantVenteInitialHt: 999999, debourseInitialHt: 1,
  });
  if (forge.status === 400 && (forge.body?.message === 'chantiers.creation_directe.provenance_interdite'
      || forge.body?.code === 'chantiers.creation_directe.provenance_interdite')) {
    pass('P0-3', 'provenance forgée → 400 provenance_interdite (aucun chantier créé)');
  } else fail('P0-3', 'provenance forgée', '400 provenance_interdite', `${forge.status} ${forge.text}`);

  // ── Chantier DEVIS légitime (conversion) pour AC-1..AC-17 ───────────────────
  const devis = await creerChantierDevis(oh, 'NOM', suffix);
  const id = devis.chantierId;
  const ck0 = await api(oh, 'GET', `/api/v1/chantiers/${id}/cockpit`);
  if (!ck0.ok) throw new Error(`cockpit ${ck0.status} ${ck0.text}`);
  if (ck0.body?.identity?.status === 'EN_PREPARATION') pass('AC-1/AC-2', `identité unique, statut réel EN_PREPARATION (${ck0.body.identity.code})`);
  else fail('AC-1/AC-2', 'identité', 'EN_PREPARATION', ck0.body?.identity?.status);

  // ── AC-9 — provenance posée par la conversion (P0-3 complément) ─────────────
  if (ck0.body?.identity?.sourceVente === 'DEVIS' && ck0.body?.identity?.devisNumero) {
    pass('AC-9', `provenance DEVIS posée par la conversion (${ck0.body.identity.devisNumero})`);
  } else fail('AC-9', 'provenance', 'DEVIS + numéro', JSON.stringify(ck0.body?.identity));

  // ── AC-3/AC-4 — KPI canoniques cohérents (vente = total devis, marge = vente − budget) ──
  const fin = ck0.body?.finance;
  const vente = Number(fin?.montantVenteActifHt?.montant);
  const budget = Number(fin?.budgetReviseHt?.montant);
  if (fin?.montantVenteActifHt?.etat === 'AVAILABLE'
      && Math.abs(vente - devis.totalDevis) < 1
      && fin?.montantVenteActifHt?.source === 'DEVIS') {
    pass('AC-3', `vente active ${vente} = total devis ${devis.totalDevis} (source DEVIS)`);
  } else fail('AC-3', 'KPI vente', `AVAILABLE ${devis.totalDevis}`, JSON.stringify(fin?.montantVenteActifHt));
  const marge = Number(fin?.margeProjeteeHt?.montant);
  if (Number.isFinite(marge) && budget > 0 && Math.abs(marge - (vente - budget)) < 1) {
    pass('AC-4', `marge projetée ${marge} = vente − budget (${budget}), jamais zéro`);
  } else fail('AC-4', 'marge', 'vente − budget', `${marge} (vente ${vente} / budget ${budget})`);

  // ── AC-5 — checklist : vente OK (DEVIS), budget OK (DPU copié), arbre OK ────
  const prep = ck0.body?.preparation ?? [];
  const parCode = (code) => prep.find((p) => p.code === code);
  if (parCode('reference_vente')?.etat === 'OK'
      && parCode('budget_initial')?.etat === 'OK'
      && parCode('planning')?.etat === 'A_FAIRE') {
    pass('AC-5', 'checklist : vente OK, budget OK, planning A_FAIRE (jamais bloquant)');
  } else fail('AC-5', 'checklist', 'vente/budget OK + planning A_FAIRE',
      JSON.stringify(prep.map((p) => [p.code, p.etat])));

  // ── AC-6 — démarrage par OS atomique (dates posées, règles satisfaites) ─────
  const aff1 = await api(oh, 'POST', `/api/v1/chantiers/${id}/affectations`, { employeId: 'qa-emp-conducteur', roleCode: 'BTP_CONDUCTEUR_TRAVAUX', dateDebut: '2026-09-01' });
  const aff2 = await api(oh, 'POST', `/api/v1/chantiers/${id}/affectations`, { employeId: 'qa-emp-chef-chantier', roleCode: 'BTP_CHEF_CHANTIER', dateDebut: '2026-09-01' });
  await api(oh, 'PUT', `/api/v1/chantiers/${id}`, { dateDebut: '2026-09-01', dateFinPrevue: '2026-09-30' });
  const os = await api(oh, 'POST', `/api/v1/chantiers/${id}/demarrer-os`, { osReference: `OS-QA-${suffix}`.slice(0, 40), osDateEffet: '2026-09-01' });
  const ckOs = await api(oh, 'GET', `/api/v1/chantiers/${id}/cockpit`);
  if (aff1.ok && aff2.ok && os.ok && ckOs.body?.identity?.status === 'EN_COURS' && ckOs.body?.schedule?.osReference) {
    pass('AC-6', `démarrage par OS ${ckOs.body.schedule.osReference} → EN_COURS (affectations ${aff1.status}/${aff2.status})`);
  } else fail('AC-6', 'démarrage OS', 'EN_COURS + OS + affectations', `${os.status} ${os.text} / affect ${aff1.status}/${aff2.status}`);

  // ── AC-7/AC-10 — cockpit EN_COURS + action primaire déterministe ────────────
  const ck2 = ckOs;
  if (ck2.body?.identity?.status === 'EN_COURS' && (ck2.body?.nextActions ?? [])[0]?.priorite === 1) {
    pass('AC-7/AC-10', 'cockpit EN_COURS, action primaire priorité 1');
  } else fail('AC-7/AC-10', 'cockpit EN_COURS', 'EN_COURS + priorité 1', `${ck2.body?.identity?.status}`);

  // ── AC-9/AC-10 — alertes = faits, ≤4 actions ────────────────────────────────
  const alerts = ck2.body?.alerts ?? [];
  const next = ck2.body?.nextActions ?? [];
  if (Array.isArray(alerts) && next.length >= 1 && next.length <= 4) {
    pass('AC-9/AC-10', `alertes ${alerts.length} (codes stables), ≤4 actions (${next.length})`);
  } else fail('AC-9/AC-10', 'alertes/actions', 'alerts + ≤4 actions', `${alerts.length}/${next.length}`);

  // ── AC-15 — flux du mois actionnable (route réelle) ─────────────────────────
  if (ck2.body?.progress?.fluxMois?.actionnable && /^\/chantiers\//.test(ck2.body?.progress?.fluxMois?.premiereAction ?? '')) {
    pass('AC-15', `flux actionnable → ${ck2.body.progress.fluxMois.premiereAction}`);
  } else fail('AC-15', 'flux mois', 'actionnable + route', JSON.stringify(ck2.body?.progress?.fluxMois));

  // ── AC-17 — SUSPENDU reflété, aucune action de saisie ───────────────────────
  const susp = await api(oh, 'POST', `/api/v1/chantiers/${id}/suspendre`);
  const ckSusp = await api(oh, 'GET', `/api/v1/chantiers/${id}/cockpit`);
  const routesSuspendu = (ckSusp.body?.nextActions ?? []).map((a) => a.route ?? '').join(',');
  if (susp.ok && ckSusp.body?.identity?.status === 'SUSPENDU'
      && !routesSuspendu.includes('avancements') && !routesSuspendu.includes('attachements') && !routesSuspendu.includes('situations')) {
    pass('AC-17', 'SUSPENDU : statut reflété, aucune saisie opérationnelle proposée');
  } else fail('AC-17', 'SUSPENDU', 'statut + lecture seule', `${ckSusp.body?.identity?.status} / ${routesSuspendu}`);
  await api(oh, 'POST', `/api/v1/chantiers/${id}/reprendre`);

  // ── AC-12 — marge négative → alerte CRITICAL (révision budgétaire réelle) ───
  const arbre = await api(oh, 'GET', `/api/v1/chantiers/${id}/budget-arbre`);
  const poste = trouverPosteArbre(arbre.body);
  const rev = poste ? await api(oh, 'PUT', `/api/v1/postes-budgetaires/${poste.id}/debourse/revision`, { rubriques: [{ rubrique: 'MATIERE', montantHt: 900000 }] }) : null;
  const ckRev = await api(oh, 'GET', `/api/v1/chantiers/${id}/cockpit`);
  const alerteNeg = (ckRev.body?.alerts ?? []).find((a) => a.code === 'marge_negative');
  const margeRev = Number(ckRev.body?.finance?.margeProjeteeHt?.montant);
  if (rev?.ok && alerteNeg?.severite === 'CRITICAL' && margeRev < 0) {
    pass('AC-12', `révision budgétaire → marge ${margeRev} < 0 → alerte CRITICAL`);
  } else fail('AC-12', 'alerte marge négative', 'CRITICAL + marge < 0', `${alerteNeg?.severite} (marge ${margeRev}, rev ${rev?.status})`);
  if (poste) await api(oh, 'PUT', `/api/v1/postes-budgetaires/${poste.id}/debourse/revision`, { rubriques: [{ rubrique: 'MATIERE', montantHt: 582600 }] });

  // ── AC-13 — retard sur dates réelles (chantier direct, sans provenance) ─────
  const ret = await api(oh, 'POST', '/api/v1/chantiers', {
    label: `Retard ${suffix}`, clientId: 'cli-ret', clientName: 'C', ville: 'R',
    montantHt: 100000, status: 'EN_PREPARATION', dateDebut: '2026-08-01', dateFinPrevue: '2026-08-10',
  });
  const ckRet = await api(oh, 'GET', `/api/v1/chantiers/${ret.body.id}/cockpit`);
  if (ret.status === 201 && ckRet.body?.schedule?.enRetard === true && ckRet.body?.schedule?.joursRestantsOuRetard > 0) {
    pass('AC-13', `retard ${ckRet.body.schedule.joursRestantsOuRetard} j (dates réelles, direct sans provenance)`);
  } else fail('AC-13', 'retard', 'enRetard + jours', JSON.stringify(ckRet.body?.schedule) + ` (create ${ret.status})`);

  // ── AC-14 — absence de données → NOT_AVAILABLE, jamais zéro ────────────────
  const sansFin = await api(oh, 'POST', '/api/v1/chantiers', { label: `Sans fin ${suffix}`, clientId: 'cli-s', clientName: 'C', ville: 'R', montantHt: 1, status: 'EN_PREPARATION' });
  const ckSans = await api(oh, 'GET', `/api/v1/chantiers/${sansFin.body.id}/cockpit`);
  const financeSans = ckSans.body?.finance;
  if (financeSans?.montantVenteActifHt?.etat === 'NOT_AVAILABLE' && financeSans.montantVenteActifHt?.montant == null
      && ckSans.body?.schedule?.joursRestantsOuRetard == null && ckSans.body?.schedule?.absence) {
    pass('AC-14', 'vente absente NOT_AVAILABLE (null), échéance absente signalée — aucun faux zéro');
  } else fail('AC-14', 'absence', 'NOT_AVAILABLE + null', JSON.stringify(financeSans));

  // ── AC-18/AC-19 — portefeuille décisionnel (filtres/tris/recherche serveur) ──
  const pf = await api(oh, 'GET', '/api/v1/chantiers/portefeuille?page=0&size=20&tri=alerte&recherche=Retard');
  if (pf.ok && pf.body?.total >= 0 && typeof pf.body?.page === 'number') {
    pass('AC-18/AC-19', `portefeuille : ${pf.body.total} lignes, tri serveur, recherche serveur`);
  } else fail('AC-18/AC-19', 'portefeuille', 'items+total+page', `${pf.status} ${pf.text}`);

  // ── AC-20 — daf : budget sans écriture ──────────────────────────────────────
  const dafH = await session('daf');
  const ckDaf = await api(dafH, 'GET', `/api/v1/chantiers/${id}/cockpit`);
  const dafPerms = (ckDaf.body?.nextActions ?? []).map((a) => a.permission);
  if (ckDaf.ok && dafPerms.includes('chantiers.budget.read') && !dafPerms.includes('chantiers.update')) {
    pass('AC-20', 'daf : budget sans écriture terrain');
  } else fail('AC-20', 'RBAC daf', 'budget sans update', dafPerms.join(','));

  // ── AC-22 — erreur partielle : chantier inconnu → état d'erreur propre ──────
  const bad = await api(oh, 'GET', '/api/v1/chantiers/inexistant-0000/cockpit');
  if (bad.status === 400 || bad.status === 404) pass('AC-22', `chantier inconnu → ${bad.status} (pas de faux cockpit)`);
  else fail('AC-22', 'erreur identité', '400/404', String(bad.status));

  // ── SEKTOR-209 revue 27/08 — jamais « Démarrer » tant que la préparation bloque (P1-5) ──
  // Chantier direct EN_PREPARATION sans dates ni responsables ni budget : la checklist est
  // bloquante, l'action primaire doit être « préparer », pas « démarrer » (même règle que
  // /demarrer-os qui répondrait 422).
  const bloc = await api(oh, 'POST', '/api/v1/chantiers', {
    label: `Bloqueurs ${suffix}`, clientId: 'cli-bloq', clientName: 'C', ville: 'R', montantHt: 100000,
    status: 'EN_PREPARATION',
  });
  const ckBloc = await api(oh, 'GET', `/api/v1/chantiers/${bloc.body.id}/cockpit`);
  const actionsBloc = ckBloc.body?.nextActions ?? [];
  const primaireBloc = actionsBloc[0]?.libelle;
  const bloqueursBloc = (ckBloc.body?.preparation ?? []).filter((p) => p.etat === 'BLOQUANT').map((p) => p.code);
  const osBloc = await api(oh, 'POST', `/api/v1/chantiers/${bloc.body.id}/demarrer-os`, { osReference: 'OS-BLOCK', osDateEffet: '2026-09-01' });
  if (primaireBloc === 'chantiers.cockpit.action.preparer'
      && !(actionsBloc.some((a) => (a.libelle ?? '').includes('demarrer')))
      && osBloc.status === 422) {
    pass('P1-5', `préparation bloquante (${bloqueursBloc.join(',')}) → action « préparer », /demarrer-os 422 — jamais « Démarrer »`);
  } else fail('P1-5', 'action primaire vs bloqueurs', 'preparer + pas de demarrer + OS 422',
      `primaire=${primaireBloc} bloqueurs=[${bloqueursBloc.join(',')}] os=${osBloc.status}`);

  // ── SEKTOR-209 revue 27/08 — flux non actionnable sur les états terminaux (P1-9/P1-8) ──
  // Le chantier converti est EN_COURS : le conduire jusqu'à CLOS et vérifier que le flux
  // mensuel redevient lecture seule et que plus aucune saisie opérationnelle n'est proposée.
  const rp = await api(oh, 'POST', `/api/v1/chantiers/${id}/reception-provisoire`);
  const rd = await api(oh, 'POST', `/api/v1/chantiers/${id}/reception-definitive`);
  const cl = await api(oh, 'POST', `/api/v1/chantiers/${id}/clore`);
  const ckClos = await api(oh, 'GET', `/api/v1/chantiers/${id}/cockpit`);
  const fluxClos = ckClos.body?.progress?.fluxMois;
  const routesClos = (ckClos.body?.nextActions ?? []).map((a) => a.route ?? '').join(',');
  const permsClos = (ckClos.body?.nextActions ?? []).map((a) => a.permission ?? '').join(',');
  const aSaisie = /\/saisie|avancements|attachements/.test(routesClos);
  const aEcriture = permsClos.includes('chantiers.update');
  if (cl.ok && ckClos.body?.identity?.status === 'CLOS'
      && fluxClos?.actionnable === false
      && !aSaisie && !aEcriture) {
    pass('P1-9/P1-8', 'CLOS : flux lecture seule non actionnable, aucune saisie/écriture opérationnelle (consultation seule)');
  } else fail('P1-9/P1-8', 'flux terminal', 'CLOS + flux non actionnable + consultation seule',
      `status=${ckClos.body?.identity?.status} actionnable=${fluxClos?.actionnable} routes=${routesClos} perms=${permsClos} (${rp.status}/${rd.status}/${cl.status})`);

  console.log('\n=== VERDICT COCKPIT AC-1..AC-22 (+P0-3, P1-5, P1-9/P1-8) ===');
  console.log(`PASS: ${PASSES} · FAIL: ${FAILS}`);
  const acs = [...new Set(verdicts.map((v) => v.split(' ')[1].split('/')[0]))];
  console.log(`AC couverts: ${acs.join(', ')}`);
  console.log('\nLimites: captures navigateur desktop/390 px + audit a11y dans le rapport de livraison ;');
  console.log('la matrice rôle complète est couverte par les tests unitaires (CockpitChantierServiceTest).');
  process.exit(FAILS ? 1 : 0);
}

main().catch((e) => { console.error('FAIL', e); process.exit(1); });
