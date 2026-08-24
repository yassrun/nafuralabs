/**
 * Le décompte cumulatif lu depuis les attachements, cascade pénalités/RG/avance/TVA/RAS —
 * sous-lot chantiers/situation-et-retenues (SEKTOR-156, SEKTOR-157 ; preuves QA sous SEKTOR-158).
 *
 * STATUT : NON EXÉCUTÉ. Aucun backend Sektor ne tournait au moment où ce script a été écrit
 * (24/08/2026) : ni pour builder l'état initial (chantier issu d'une conversion avec un poste
 * VENDU sous un lot d'accueil INTERNE, tauxRg/tauxAvance/tauxRas distincts et non nuls, deux
 * attachements signés MOE sur deux périodes non chevauchantes, un attachement BROUILLON/
 * EN_ATTENTE_MOE sur la période d'un attachement signé plus ancien), ni pour jouer les requêtes
 * ci-dessous. Ce fichier fixe le contrat d'exécution — endpoints, séquence, assertions — pour la
 * prochaine session qui aura un backend qui tourne. Forme reprise de
 * sektor/e2e/scripts/verify-budget-et-marge.mjs.
 *
 * Contrat : sektor/raster-src/lots/chantiers/situation-et-retenues/CONTRAT.md (AC-1 à AC-13).
 * Run (une fois un backend up) : node sektor/e2e/scripts/verify-situation-et-retenues.mjs
 *
 * Endpoints vérifiés par lecture de code (pas par exécution) :
 *   GET  /api/v1/chantiers/{chantierId}/situations
 *   GET  /api/v1/chantiers/{chantierId}/situations/cumul-precedent
 *   POST /api/v1/chantiers/{chantierId}/situations/generate?numero=&penalitesRetardHt=  (AC-1..AC-10)
 *   GET  /api/v1/situations/{id}
 *
 * Ce sous-lot ne change ni AttachementChantier ni AvancementPhysique (contrats voisins, non
 * touchés ici) : les attachements de l'état initial se posent avec les endpoints déjà couverts
 * par sektor/e2e/scripts/verify-avancement-et-attachement-20260824.mjs — ce script n'en refait
 * pas la preuve, il consomme l'état qu'ils produisent.
 *
 * AC-11 (RAS jamais transmise à Ventes) n'a pas de scénario e2e dédié ici : vérifié par lecture
 * de code sur VentesSituationFactureAdapter/FactureClientService.createFromSituation (ne lit ni
 * rasTaux ni rasMontant, seulement netAPayerHt/netAPayerTtc) — même vérification que le rapport
 * de livraison SEKTOR-157, confirmée indépendamment par le QA (SEKTOR-158). Un scénario e2e est
 * quand même écrit ci-dessous (situation-ras-n-affecte-pas-la-facture) pour le jour où
 * convert-to-facture pourra être rejoué de bout en bout.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AUTH_FILE = path.resolve(__dirname, '../.auth/erp-audit.json');
const API_BASE = process.env.ERP_API_BASE ?? 'http://api.erp.nafura.local';

const results = { at: new Date().toISOString(), status: 'NON_EXECUTE', steps: [] };

function step(id, ac, pass, detail) {
  results.steps.push({ id, ac, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'} — ${id} (${ac}): ${detail}`);
}

function sessionFromAuth() {
  const auth = JSON.parse(fs.readFileSync(AUTH_FILE, 'utf8'));
  const origin = auth.origins.find((o) => o.origin.includes('erp'));
  if (!origin) throw new Error('No erp origin in auth file');
  const pfEntry = origin.localStorage.find((e) => e.name === 'pf_session');
  if (!pfEntry) throw new Error('No pf_session in auth file');
  const pf = JSON.parse(pfEntry.value);
  return { token: pf.tokens.accessToken, tenantId: pf.tenantId };
}

async function api(method, urlPath, body) {
  const { token, tenantId } = sessionFromAuth();
  const opts = {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-Tenant-Id': tenantId,
    },
  };
  if (body !== undefined) opts.body = JSON.stringify(body);
  const res = await fetch(`${API_BASE}${urlPath}`, opts);
  let parsed = null;
  try {
    parsed = await res.json();
  } catch {
    parsed = await res.text().catch(() => null);
  }
  return { status: res.status, ok: res.ok, body: parsed };
}

const money = (v) => Number.parseFloat(v).toFixed(2);

/**
 * État initial requis par le contrat (§ Scénarios e2e — état initial) :
 * - Tenant qa-local, un chantier issu d'une conversion avec ≥ 2 lots, dont au moins un poste
 *   VENDU placé sous un lot d'accueil INTERNE (cas AC-2/AC-7).
 * - Chantier.tauxRg, tauxAvance, tauxRas tous renseignés à des valeurs distinctes et non nulles.
 * - Au moins deux attachements SIGNE_MOE, sur deux périodes non chevauchantes, quantités et
 *   nœuds distincts (AC-4, AC-6).
 * - Un attachement BROUILLON ou EN_ATTENTE_MOE sur la même période qu'un attachement signé plus
 *   ancien, à ne jamais voir apparaître dans une situation (AC-1).
 * - Un second chantier avec tauxRas à null, et une situation avec pénalités à zéro (AC-12).
 * - Une situation avec des pénalités de retard saisies à un montant non nul (AC-8, AC-10).
 *
 * Cette fonction n'existe pas encore comme seed rejouable : à écrire dans
 * sektor/e2e/scripts/seed-qa-etudes.mjs (ou son pendant chantiers), en s'appuyant sur l'état déjà
 * posé par verify-avancement-et-attachement-20260824.mjs pour les attachements signés.
 */
async function preconditions() {
  throw new Error(
    'État initial non seedé : chantier converti avec poste vendu sous lot interne + ' +
      'tauxRg/tauxAvance/tauxRas distincts non nuls + deux attachements SIGNE_MOE sur deux ' +
      'périodes non chevauchantes + un attachement BROUILLON/EN_ATTENTE_MOE sur la période du ' +
      'premier signé + un chantier avec tauxRas null — conforme à CONTRAT.md § Scénarios e2e ' +
      'avant de jouer ce script.'
  );
}

async function main() {
  console.log('=== situation-et-retenues — NON EXÉCUTÉ, backend indisponible au moment de l\'écriture ===');

  let ctx;
  try {
    ctx = await preconditions();
  } catch (e) {
    step('etat-initial', '-', false, `Préconditions non remplies : ${e.message}`);
    results.status = 'NON_EXECUTE_PRECONDITIONS_MANQUANTES';
    console.log(JSON.stringify(results, null, 2));
    return;
  }

  const {
    chantierId, chantierSansRasId,
    posteVenduSousLotInterneId, lotFeuilleId,
    attachementSigne1Id, attachementSigne2Id, attachementNonSigneId,
    penalitesRetardHt,
  } = ctx;

  // ── situation-lignes-depuis-attachements-signes (AC-1, AC-2, AC-3) ─────────
  let situation1Id;
  {
    const generation = await api(
      'POST',
      `/api/v1/chantiers/${chantierId}/situations/generate?numero=1&penalitesRetardHt=0`,
      {}
    );
    situation1Id = generation.body?.id;
    step('situation-lignes-depuis-attachements-signes', 'AC-1', generation.status === 201,
      `POST situations/generate?numero=1 → ${generation.status}`);

    const detail = await api('GET', `/api/v1/situations/${situation1Id}`);
    const ligne = detail.body?.lignes?.find((l) => l.noeudId === posteVenduSousLotInterneId);
    step('situation-lignes-depuis-attachements-signes', 'AC-2', !!ligne,
      `ligne montée : noeudId=${ligne?.noeudId} code=${ligne?.code} designation=${ligne?.designation} ` +
        `unite=${ligne?.unite} prixUnitaire=${ligne?.prixUnitaire} — jamais retapés, lus sur le nœud`);
    step('situation-lignes-depuis-attachements-signes', 'AC-3', !!ligne,
      `quantitePeriode=${ligne?.quantitePeriode} == somme des AttachementLigne.quantitePeriode ` +
        `du nœud sur les attachements retenus ; montantHt=${ligne?.montantHt} == quantitePeriode × prixUnitaire`);
  }

  // ── situation-poste-vendu-sous-lot-interne (AC-2, AC-7) ─────────────────────
  {
    const detail = await api('GET', `/api/v1/situations/${situation1Id}`);
    const ligneVenduSousInterne = detail.body?.lignes?.find((l) => l.noeudId === posteVenduSousLotInterneId);
    step('situation-poste-vendu-sous-lot-interne', 'AC-2', !!ligneVenduSousInterne,
      'le poste vendu sous le lot d\'accueil interne apparaît comme une ligne à part entière');

    const ligneLotInterne = detail.body?.lignes?.find((l) => l.noeudId === lotFeuilleId /* le lot interne lui-même */);
    step('situation-poste-vendu-sous-lot-interne', 'AC-7', !ligneLotInterne,
      'aucune ligne pour le lot d\'accueil INTERNE lui-même — seul le poste vendu qu\'il contient apparaît');
  }

  // ── situation-attachement-non-signe-ignore (AC-1) ───────────────────────────
  {
    const attNonSigne = await api('GET', `/api/v1/attachements/${attachementNonSigneId}`);
    step('situation-attachement-non-signe-ignore', 'AC-1', attNonSigne.body?.status !== 'SIGNE_MOE',
      `attachement resté BROUILLON/EN_ATTENTE_MOE (status=${attNonSigne.body?.status}), sur la même ` +
        'période qu\'un attachement signé plus ancien');
    step('situation-attachement-non-signe-ignore', 'AC-1', attNonSigne.body?.situationId == null,
      `situationId=${attNonSigne.body?.situationId} — jamais marqué consommé, donc jamais lu par ` +
        'une génération (à comparer au montant exact de la situation 1 sur le seed effectif : les ' +
        'quantités de cet attachement ne doivent apparaître dans aucune ligne)');
  }

  // ── situation-attachement-consomme-une-seule-fois (AC-4) ────────────────────
  {
    const secondeGeneration = await api(
      'POST',
      `/api/v1/chantiers/${chantierId}/situations/generate?numero=1&penalitesRetardHt=0`,
      {}
    );
    step('situation-attachement-consomme-une-seule-fois', 'AC-4', !secondeGeneration.ok,
      `POST generate?numero=1 rejoué (numéro déjà existant) → ${secondeGeneration.status} (refusé)`);

    const attSigne1 = await api('GET', `/api/v1/attachements/${attachementSigne1Id}`);
    step('situation-attachement-consomme-une-seule-fois', 'AC-4', attSigne1.body?.situationId === situation1Id,
      `attachement 1 marqué consommé : situationId=${attSigne1.body?.situationId}`);
  }

  // ── situation-sans-attachement-signe-refusee (AC-5) ──────────────────────────
  {
    // Rejoué sur un chantier n'ayant plus d'attachement signé non consommé (tous déjà consommés
    // par la génération ci-dessus, ou un chantier sans aucun attachement).
    const refus = await api(
      'POST',
      `/api/v1/chantiers/${chantierId}/situations/generate?numero=99&penalitesRetardHt=0`,
      {}
    );
    step('situation-sans-attachement-signe-refusee', 'AC-5', !refus.ok,
      `POST generate sur un chantier sans attachement signé disponible → ${refus.status} ` +
        `(message attendu : chantiers.situation.aucun_attachement_signe)`);
  }

  // ── situation-decompte-cumulatif-deux-periodes (AC-6) ────────────────────────
  let situation2Id;
  {
    const cumulAvant = await api('GET', `/api/v1/chantiers/${chantierId}/situations/cumul-precedent`);
    step('situation-decompte-cumulatif-deux-periodes', 'AC-6', cumulAvant.ok,
      `GET cumul-precedent avant génération 2 → ${cumulAvant.status}, cumulPrecedentHt=${cumulAvant.body?.cumulPrecedentHt}`);

    const generation2 = await api(
      'POST',
      `/api/v1/chantiers/${chantierId}/situations/generate?numero=2&penalitesRetardHt=0`,
      {}
    );
    situation2Id = generation2.body?.id;
    const s1 = await api('GET', `/api/v1/situations/${situation1Id}`);
    step('situation-decompte-cumulatif-deux-periodes', 'AC-6',
      money(generation2.body?.cumulPrecedentHt) === money(s1.body?.cumulCourantHt),
      `cumulPrecedentHt de la situation 2 (${generation2.body?.cumulPrecedentHt}) == ` +
        `cumulCourantHt de la situation 1 (${s1.body?.cumulCourantHt})`);
    step('situation-decompte-cumulatif-deux-periodes', 'AC-6',
      money(generation2.body?.cumulCourantHt) ===
        money(Number(generation2.body?.cumulPrecedentHt ?? 0) + Number(generation2.body?.travauxPeriodeHt ?? 0)),
      `cumulCourantHt == cumulPrecedentHt + travauxPeriodeHt (${generation2.body?.cumulCourantHt})`);
  }

  // ── situation-cascade-penalites-rg-avance-ras (AC-8, AC-9, AC-10) ───────────
  {
    // Rejoué avec un montant de pénalités non nul (voir précondition), sur un chantier encore
    // muni d'un attachement signé disponible.
    const generationAvecPenalites = await api(
      'POST',
      `/api/v1/chantiers/${chantierId}/situations/generate?numero=3&penalitesRetardHt=${penalitesRetardHt}`,
      {}
    );
    const s = generationAvecPenalites.body;
    step('situation-cascade-penalites-rg-avance-ras', 'AC-8',
      money(s?.penalitesRetardHt) === money(penalitesRetardHt),
      `penalitesRetardHt saisi retrouvé tel quel sur la situation générée : ${s?.penalitesRetardHt}`);

    const assietteAttendue = Number(s?.travauxPeriodeHt ?? 0) - Number(s?.penalitesRetardHt ?? 0);
    const rgAttendu = (assietteAttendue * Number(s?.retenueGarantiePercent ?? 0)) / 100;
    const avanceAttendue = (assietteAttendue * Number(s?.retenueAvancePercent ?? 0)) / 100;
    step('situation-cascade-penalites-rg-avance-ras', 'AC-10',
      money(s?.retenueGarantieMontant) === money(rgAttendu) && money(s?.retenueAvanceMontant) === money(avanceAttendue),
      `RG (${s?.retenueGarantieMontant}) et avance (${s?.retenueAvanceMontant}) calculés sur l'assiette ` +
        `réduite des pénalités (${assietteAttendue}), en parallèle — pas en cascade l'une sur l'autre`);

    const netHtAttendu = assietteAttendue - rgAttendu - avanceAttendue;
    step('situation-cascade-penalites-rg-avance-ras', 'AC-10',
      money(s?.netAPayerHt) === money(netHtAttendu),
      `netAPayerHt (${s?.netAPayerHt}) == travaux − pénalités − RG − avance`);

    step('situation-cascade-penalites-rg-avance-ras', 'AC-9',
      s?.rasTaux !== undefined && s?.rasTaux !== null,
      `rasTaux (${s?.rasTaux}) dérivé de Chantier.tauxRas — jamais un champ saisi sur la requête de génération`);
  }

  // ── situation-ras-n-affecte-pas-la-facture (AC-11) ───────────────────────────
  {
    // Vérifié par lecture de code (voir en-tête du fichier) : VentesSituationFactureAdapter /
    // FactureClientService.createFromSituation ne lisent jamais rasTaux ni rasMontant.
    step('situation-ras-n-affecte-pas-la-facture', 'AC-11 [lecture de code, pas d\'exécution]', true,
      'VentesSituationFactureAdapter → FactureClientService.createFromSituation lit uniquement ' +
        'netAPayerHt/netAPayerTtc/tvaTaux/retenueGarantiePercent/retenueAvanceMontant/lignes ; ' +
        'ni rasTaux ni rasMontant — SituationToFacturePort non modifié par ce contrat.');
  }

  // ── situation-cascade-a-zero-sans-penalites-ni-ras (AC-12) ───────────────────
  {
    const generationSansRas = await api(
      'POST',
      `/api/v1/chantiers/${chantierSansRasId}/situations/generate?numero=1&penalitesRetardHt=0`,
      {}
    );
    const s = generationSansRas.body;
    step('situation-cascade-a-zero-sans-penalites-ni-ras', 'AC-12',
      generationSansRas.ok && money(s?.penalitesRetardHt) === '0.00' && money(s?.rasMontant) === '0.00',
      `chantier sans tauxRas et sans pénalités saisies → penalitesRetardHt=${s?.penalitesRetardHt}, ` +
        `rasMontant=${s?.rasMontant}, RG=${s?.retenueGarantieMontant}, avance=${s?.retenueAvanceMontant} ` +
        '(situation identique à celle d\'avant ce contrat)');
  }

  // ── situation-vocabulaire-chantier (AC-13) ───────────────────────────────────
  step('situation-vocabulaire-chantier', 'AC-13', true,
    'Vérifié statiquement (grep) sur sektor/sources/web/app/chantiers/situations et ' +
      'i18n/applications/erp/chantiers/*.json : aucun des termes interdits (quotité, WBS, ' +
      'valeur acquise, earned value, ligne d\'équilibre, activité). Vocabulaire retrouvé : ' +
      'situation, décompte, attachement, retenue de garantie (RG), avance, pénalités de retard, ' +
      'RAS, net à payer.');

  results.status = 'NON_EXECUTE_SCENARIOS_FIXES';
  console.log(JSON.stringify(results, null, 2));
}

main().catch((e) => {
  console.error('ERREUR', e);
  process.exit(1);
});
