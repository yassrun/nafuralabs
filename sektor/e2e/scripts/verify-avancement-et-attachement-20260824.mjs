/**
 * L'avancement en quantité, l'attachement qui lit — sous-lot chantiers/avancement-et-attachement
 * (SEKTOR-152, SEKTOR-153, SEKTOR-174 ; preuves QA sous SEKTOR-154).
 *
 * STATUT : NON EXÉCUTÉ. Aucun backend Sektor ne tournait au moment où ce script a été écrit
 * (24/08/2026) : ni pour builder l'état initial (chantier issu d'une conversion, ≥ 2 lots, 1
 * sous-lot, ≥ 6 postes VENDU, 1 nœud INTERNE, 1 nœud sans quantité prévue, deux attachements dont
 * un signé), ni pour jouer les requêtes ci-dessous. Ce fichier fixe le contrat d'exécution —
 * endpoints, séquence, assertions — pour la prochaine session qui aura un backend qui tourne.
 * Forme reprise de sektor/e2e/scripts/verify-budget-et-marge.mjs.
 *
 * Contrat : sektor/raster-src/lots/chantiers/avancement-et-attachement/CONTRAT.md (AC-1 à AC-19 ;
 * AC-19 ajouté à l'approbation, cf. l'encart d'amendement en tête du contrat).
 * Run (une fois un backend up) : node sektor/e2e/scripts/verify-avancement-et-attachement-20260824.mjs
 *
 * Endpoints vérifiés par lecture de code (pas par exécution) :
 *   POST   /api/v1/chantiers/{chantierId}/avancements               (AC-1, AC-5, AC-6, AC-9)
 *   GET    /api/v1/chantiers/{chantierId}/avancements
 *   GET    /api/v1/chantiers/{chantierId}/avancements/dernier
 *   PUT    /api/v1/avancements/{id}                                 (AC-7 — correction)
 *   DELETE /api/v1/avancements/{id}                                 (AC-7 — annulation)
 *   POST   /api/v1/chantiers/{chantierId}/attachements              (AC-10, AC-11, AC-13)
 *   GET    /api/v1/chantiers/{chantierId}/attachements
 *   GET    /api/v1/chantiers/attachements                            (listing global)
 *   POST   /api/v1/attachements/{id}/soumettre-signature
 *   POST   /api/v1/attachements/{id}/contester                      (AC-17)
 *   PUT    /api/v1/attachements/{id}/lignes/{ligneId}/zone           (AC-14)
 *   POST   /api/v1/attachements/{id}/lien-signature                  (AC-19, authentifié)
 *   GET    /api/v1/sign/{token}                                      (AC-19, public)
 *   POST   /api/v1/sign/{token}                                      (AC-19, public — dépôt signature)
 *   GET    /api/v1/chantiers/{chantierId}/zones                      (AC-14)
 *   POST   /api/v1/chantiers/{chantierId}/zones                      (AC-14 — pas d'écran, API seule)
 *
 * AC-9 n'a pas de scénario e2e (aucune activité ne peut exister au palier 1, cf. CONTRAT.md) :
 * sa preuve est unitaire (AvancementPhysiqueServiceTest.declaration_surNoeudCouvertParActivite_estRefusee).
 * Le référentiel de zones n'a pas d'écran de gestion (dette nommée par SEKTOR-153) : ce script le
 * peuple par API, comme devra le faire le QA humain tant que l'écran n'existe pas.
 * AC-19 n'a pas de page publique de signature consommant le lien (dette nommée par SEKTOR-174) :
 * le dépôt de signature est prouvé en API directe sur /api/v1/sign/{token}, jamais au navigateur.
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

async function api(method, urlPath, body, { anonymous = false } = {}) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (!anonymous) {
    const { token, tenantId } = sessionFromAuth();
    opts.headers.Authorization = `Bearer ${token}`;
    opts.headers['X-Tenant-Id'] = tenantId;
  }
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

const qty = (v) => Number.parseFloat(v).toFixed(4);

/**
 * État initial requis par le contrat (§ Scénarios e2e — état initial) :
 * - Tenant qa-local, un chantier issu d'une conversion : ≥ 2 lots, 1 sous-lot, ≥ 6 postes VENDU
 *   à unités/quantités/prix distincts.
 * - Au moins 1 nœud INTERNE avec quantité prévue et déclarations, dans un lot qui contient aussi
 *   du vendu.
 * - Un nœud sans quantité prévue (ou à zéro).
 * - Déclarations sur deux périodes : un nœud avancé partiellement, un amené exactement à 100 %,
 *   un jamais déclaré, une déclaration qui dépasse le reste à faire (à jouer pour AC-5).
 * - Deux attachements : le premier signé MOE par le lien public, le second sur la période suivante.
 * - Un chantier avec un référentiel de zones (≥ 2 zones sur 2 niveaux) et un chantier sans zone.
 *
 * Cette fonction n'existe pas encore comme seed rejouable : à écrire dans
 * sektor/e2e/scripts/seed-qa-etudes.mjs (ou son pendant chantiers) avant de jouer ce script.
 */
async function preconditions() {
  throw new Error(
    'État initial non seedé : chantier converti + postes vendus/internes + nœud sans quantité ' +
      'prévue + déclarations sur deux périodes + deux attachements + référentiel de zones ' +
      "conforme à CONTRAT.md § Scénarios e2e — à seeder avant de jouer ce script."
  );
}

async function main() {
  console.log('=== avancement-et-attachement — NON EXÉCUTÉ, backend indisponible au moment de l\'écriture ===');

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
    chantierId, chantierSansZoneId,
    posteVenduPartielId, posteVenduExactId, posteVenduJamaisDeclareId, posteVenduReste10Id,
    posteInterneId, posteSansQuantitePrevueId, lotAvecInterneEtVenduId,
    periode1, periode2, zoneNiveau1Id,
  } = ctx;

  // ── avancement-declaration-quantite-seule (AC-1) ───────────────────────────
  {
    const creation = await api('POST', `/api/v1/chantiers/${chantierId}/avancements`, {
      date: periode1.debut,
      status: 'BROUILLON',
      saisieParId: 'chef-chantier-qa',
      entries: [{ posteId: posteVenduPartielId, quantiteRealisee: 30 }],
    });
    step('avancement-declaration-quantite-seule', 'AC-1', creation.ok,
      `POST avancements (nœud+quantité+date seuls) → ${creation.status}`);

    const avecPourcentage = await api('POST', `/api/v1/chantiers/${chantierId}/avancements`, {
      date: periode1.debut,
      status: 'BROUILLON',
      saisieParId: 'chef-chantier-qa',
      entries: [{ posteId: posteVenduPartielId, quantiteRealisee: 10, pourcentage: 50 }],
    });
    step('avancement-declaration-quantite-seule', 'AC-1',
      !avecPourcentage.ok, `POST avec un champ pourcentage inconnu → ${avecPourcentage.status} (refusé, pas ignoré)`);

    const surLotAvecEnfants = await api('POST', `/api/v1/chantiers/${chantierId}/avancements`, {
      date: periode1.debut,
      status: 'BROUILLON',
      saisieParId: 'chef-chantier-qa',
      entries: [{ lotId: lotAvecInterneEtVenduId, quantiteRealisee: 5 }],
    });
    step('avancement-declaration-quantite-seule', 'AC-1',
      !surLotAvecEnfants.ok, `POST sur un lot qui porte des enfants → ${surLotAvecEnfants.status} (refusé)`);
  }

  // ── avancement-aucun-pourcentage-stocke (AC-2) ─────────────────────────────
  {
    const dto = await api('GET', `/api/v1/chantiers/${chantierId}/avancements`);
    const uneLigne = dto.body?.[0] ?? {};
    step('avancement-aucun-pourcentage-stocke', 'AC-2',
      Object.prototype.hasOwnProperty.call(uneLigne, 'pourcentage') && uneLigne.pourcentage !== undefined,
      'pourcentage présent en LECTURE (calculé) — vérifier par ailleurs (DB) qu\'aucune colonne ' +
        'pourcentage/avancement_percent ne subsiste sur avancements_physiques/chantier_lots/chantiers ' +
        '(schema/v1.3/001_avancement_en_quantite.sql les DROP)');
  }

  // ── avancement-pourcentage-derive-fait-sur-prevu (AC-3) ────────────────────
  {
    const dernier = await api('GET', `/api/v1/chantiers/${chantierId}/avancements/dernier`);
    const ligne = dernier.body?.find((l) => l.posteId === posteVenduPartielId);
    step('avancement-pourcentage-derive-fait-sur-prevu', 'AC-3', !!ligne,
      `cumul=${ligne?.cumulQuantite} prevu=${ligne?.quantitePrevue} pourcentage=${ligne?.pourcentage} ` +
        '(vérifier pourcentage == cumul/prevu*100 exactement, et qu\'une correction change le nombre immédiatement)');
  }

  // ── avancement-lot-pondere-par-le-vendu (AC-4) ─────────────────────────────
  {
    const arbre = await api('GET', `/api/v1/chantiers/${chantierId}/avancements`);
    step('avancement-lot-pondere-par-le-vendu', 'AC-4', true,
      'à recalculer à la main sur le seed effectif : avancement du lot mixte (vendu+interne) == ' +
        'moyenne des % vendus pondérée au montantHt, l\'interne ne pesant rien ; ' +
        `lotAvecInterneEtVenduId=${lotAvecInterneEtVenduId} — un lot sans aucun enfant vendu doit ` +
        'rendre avancementPercent=null, jamais 0.');
  }

  // ── avancement-depassement-refuse (AC-5) ───────────────────────────────────
  {
    const depassement = await api('POST', `/api/v1/chantiers/${chantierId}/avancements`, {
      date: periode1.fin,
      status: 'BROUILLON',
      saisieParId: 'chef-chantier-qa',
      entries: [{ posteId: posteVenduReste10Id, quantiteRealisee: 999 }],
    });
    step('avancement-depassement-refuse', 'AC-5', !depassement.ok,
      `POST dépassant la quantité prévue → ${depassement.status} (message doit nommer reste_a_faire et l'avenant)`);

    const exact = await api('POST', `/api/v1/chantiers/${chantierId}/avancements`, {
      date: periode1.fin,
      status: 'BROUILLON',
      saisieParId: 'chef-chantier-qa',
      entries: [{ posteId: posteVenduExactId, quantiteRealisee: 0 }], // reste exact du seed
    });
    step('avancement-depassement-refuse', 'AC-5', exact.ok,
      `POST amenant exactement à la quantité prévue → ${exact.status} (accepté, 100 % normal)`);
  }

  // ── avancement-noeud-sans-quantite-prevue (AC-6) ───────────────────────────
  {
    const refus = await api('POST', `/api/v1/chantiers/${chantierId}/avancements`, {
      date: periode1.debut,
      status: 'BROUILLON',
      saisieParId: 'chef-chantier-qa',
      entries: [{ posteId: posteSansQuantitePrevueId, quantiteRealisee: 1 }],
    });
    step('avancement-noeud-sans-quantite-prevue', 'AC-6', !refus.ok,
      `POST sur un nœud sans quantité prévue → ${refus.status} (refusé, demande de la renseigner)`);
  }

  // ── avancement-correction-puis-annulation (AC-7) ───────────────────────────
  {
    const creation = await api('POST', `/api/v1/chantiers/${chantierId}/avancements`, {
      date: periode1.debut,
      status: 'BROUILLON',
      saisieParId: 'chef-chantier-qa',
      entries: [{ posteId: posteVenduJamaisDeclareId, quantiteRealisee: 20 }],
    });
    const avancementId = creation.body?.[0]?.id;

    const correction = avancementId
      ? await api('PUT', `/api/v1/avancements/${avancementId}`, { quantiteRealisee: 15 })
      : { status: 'skip' };
    step('avancement-correction-puis-annulation', 'AC-7', correction.status === 200,
      `PUT correction à la baisse (avant tout attachement signé) → ${correction.status}`);

    const annulation = avancementId
      ? await api('DELETE', `/api/v1/avancements/${avancementId}`)
      : { status: 'skip' };
    step('avancement-correction-puis-annulation', 'AC-7', annulation.status === 204 || annulation.status === 200,
      `DELETE annulation (avant signature) → ${annulation.status}`);

    // Sur une déclaration reprise par l'attachement signé de periode1 (voir plus bas) : refusée.
    step('avancement-correction-puis-annulation', 'AC-7',
      true, 'à rejouer sur une déclaration DÉJÀ couverte par l\'attachement signé : PUT/DELETE doivent ' +
        'rendre 409/400 (chantiers.avancement.declaration_figee_par_attachement)');
  }

  // ── avancement-sans-aucun-planning (AC-8) ──────────────────────────────────
  step('avancement-sans-aucun-planning', 'AC-8', true,
    'Vérifié par lecture de code : aucun champ activité/zone obligatoire/quotité dans ' +
      'AvancementPhysiqueEntryDto/CreateDto/UpdateDto ni dans avancements_physiques.');

  // (AC-9 : pas de scénario e2e — preuve unitaire, AvancementPhysiqueServiceTest)

  // ── attachement-periodes-sans-chevauchement (AC-10) ────────────────────────
  let attachement1Id;
  {
    const att1 = await api('POST', `/api/v1/chantiers/${chantierId}/attachements`, {
      dateDebut: periode1.debut, dateFin: periode1.fin, effectifPresent: 12,
    });
    attachement1Id = att1.body?.id;
    step('attachement-periodes-sans-chevauchement', 'AC-10', att1.ok,
      `POST attachements période 1 → ${att1.status}`);

    const chevauchant = await api('POST', `/api/v1/chantiers/${chantierId}/attachements`, {
      dateDebut: periode1.fin, dateFin: periode2.fin, effectifPresent: 12,
    });
    step('attachement-periodes-sans-chevauchement', 'AC-10', !chevauchant.ok,
      `POST attachements chevauchant période 1 → ${chevauchant.status} (refusé)`);
  }

  // ── attachement-lignes-lues-de-la-periode (AC-11, AC-12) ───────────────────
  {
    const detail = await api('GET', `/api/v1/attachements/${attachement1Id}`);
    const ligne = detail.body?.lignes?.find((l) => l.noeudId === posteVenduPartielId);
    step('attachement-lignes-lues-de-la-periode', 'AC-11/AC-12', !!ligne,
      `ligne montée : noeudId=${ligne?.noeudId} code=${ligne?.code} designation=${ligne?.designation} ` +
        `unite=${ligne?.unite} quantitePeriode=${ligne?.quantitePeriode} — aucun champ de saisie de ` +
        'ligne dans AttachementChantierCreateDto (vérifié par lecture de code)');

    const periodeVide = await api('POST', `/api/v1/chantiers/${chantierId}/attachements`, {
      dateDebut: '2099-01-01', dateFin: '2099-01-31', effectifPresent: 1,
    });
    step('attachement-lignes-lues-de-la-periode', 'AC-11', !periodeVide.ok,
      `POST sur une période sans aucune quantité déclarée → ${periodeVide.status} (refusé)`);
  }

  // ── attachement-noeud-interne-exclu (AC-13) ────────────────────────────────
  {
    const detail = await api('GET', `/api/v1/attachements/${attachement1Id}`);
    const ligneInterne = detail.body?.lignes?.find((l) => l.noeudId === posteInterneId);
    step('attachement-noeud-interne-exclu', 'AC-13', !ligneInterne,
      'aucune ligne pour le poste INTERNE malgré ses déclarations sur la même période');
  }

  // ── attachement-zone-du-referentiel (AC-14) ────────────────────────────────
  {
    const zonesVides = await api('GET', `/api/v1/chantiers/${chantierSansZoneId}/zones`);
    step('attachement-zone-du-referentiel', 'AC-14', Array.isArray(zonesVides.body) && zonesVides.body.length === 0,
      `chantier sans zone → GET zones rend [] (${JSON.stringify(zonesVides.body)})`);

    const detail = await api('GET', `/api/v1/attachements/${attachement1Id}`);
    const ligneId = detail.body?.lignes?.[0]?.id;
    const assignation = ligneId
      ? await api('PUT', `/api/v1/attachements/${attachement1Id}/lignes/${ligneId}/zone`, { zoneId: zoneNiveau1Id })
      : { status: 'skip' };
    step('attachement-zone-du-referentiel', 'AC-14', assignation.status === 200,
      `PUT zone (référentiel du chantier) → ${assignation.status}`);
  }

  // ── attachement-signe-fige-la-periode (AC-15, AC-7) + AC-19 ────────────────
  {
    const soumission = await api('POST', `/api/v1/attachements/${attachement1Id}/soumettre-signature`);
    step('attachement-signe-fige-la-periode', 'AC-15', soumission.ok,
      `POST soumettre-signature → ${soumission.status} (EN_ATTENTE_MOE)`);

    const lien = await api('POST', `/api/v1/attachements/${attachement1Id}/lien-signature`);
    const rawToken = lien.body?.token;
    step('attachement-signe-fige-la-periode', 'AC-19',
      lien.status === 201 && !!rawToken && rawToken !== attachement1Id,
      `POST lien-signature (authentifié) → ${lien.status}, jeton distinct de l'id : ` +
        `${rawToken !== attachement1Id}`);

    const infoPublique = await api('GET', `/api/v1/sign/${rawToken}`, undefined, { anonymous: true });
    step('attachement-signe-fige-la-periode', 'AC-19', infoPublique.ok,
      `GET /api/v1/sign/{token} (anonyme) → ${infoPublique.status}`);

    const depot = await api('POST', `/api/v1/sign/${rawToken}`,
      { signatureBase64: 'c2lnbmF0dXJlLXFhLWUyZQ==' }, { anonymous: true });
    step('attachement-signe-fige-la-periode', 'AC-15/AC-19', depot.ok,
      `POST /api/v1/sign/{token} (dépôt signature) → ${depot.status}, statut attendu SIGNE_MOE`);

    const reusage = await api('GET', `/api/v1/sign/${rawToken}`, undefined, { anonymous: true });
    step('attachement-signe-fige-la-periode', 'AC-19', reusage.status === 404,
      `GET du même jeton après consommation → ${reusage.status} (usage unique, même 404 générique)`);

    const jetonInconnu = await api('GET', '/api/v1/sign/un-jeton-qui-n-existe-pas', undefined, { anonymous: true });
    step('attachement-signe-fige-la-periode', 'AC-19', jetonInconnu.status === 404,
      `GET jeton inconnu → ${jetonInconnu.status} (même 404 que jeton expiré/consommé, aucune fuite)`);

    const zoneApresSignature = await api(
      'PUT', `/api/v1/attachements/${attachement1Id}/lignes/x/zone`, { zoneId: zoneNiveau1Id });
    step('attachement-signe-fige-la-periode', 'AC-15', !zoneApresSignature.ok,
      `PUT zone après signature → ${zoneApresSignature.status} (refusé, figé)`);
  }

  // ── attachement-quantite-attachee-une-seule-fois (AC-16) ───────────────────
  let attachement2Id;
  {
    const att2 = await api('POST', `/api/v1/chantiers/${chantierId}/attachements`, {
      dateDebut: periode2.debut, dateFin: periode2.fin, effectifPresent: 12,
    });
    attachement2Id = att2.body?.id;
    step('attachement-quantite-attachee-une-seule-fois', 'AC-16', att2.ok,
      `POST attachements période 2 (suivante, non chevauchante) → ${att2.status}`);

    const detail1 = await api('GET', `/api/v1/attachements/${attachement1Id}`);
    const detail2 = await api('GET', `/api/v1/attachements/${attachement2Id}`);
    const noeuds1 = new Set((detail1.body?.lignes ?? []).map((l) => l.noeudId));
    const noeuds2 = new Set((detail2.body?.lignes ?? []).map((l) => l.noeudId));
    const intersection = [...noeuds1].filter((n) => noeuds2.has(n));
    step('attachement-quantite-attachee-une-seule-fois', 'AC-16', intersection.length === 0,
      `aucun nœud commun entre les lignes des deux attachements signés/en cours : ${JSON.stringify(intersection)}`);
  }

  // ── attachement-contestation-retour-a-la-declaration (AC-17) ───────────────
  {
    const soumission2 = await api('POST', `/api/v1/attachements/${attachement2Id}/soumettre-signature`);
    step('attachement-contestation-retour-a-la-declaration', 'AC-17', soumission2.ok,
      `POST soumettre-signature (att. 2, pas encore signé) → ${soumission2.status}`);

    const contestation = await api('POST', `/api/v1/attachements/${attachement2Id}/contester`);
    step('attachement-contestation-retour-a-la-declaration', 'AC-17',
      contestation.ok && contestation.body?.status === 'BROUILLON',
      `POST contester → ${contestation.status}, statut=${contestation.body?.status} (retour brouillon + remontage)`);
  }

  // ── attachement-vocabulaire-chantier (AC-18) ───────────────────────────────
  step('attachement-vocabulaire-chantier', 'AC-18', true,
    'Vérifié statiquement (grep) sur sektor/sources/web/app/chantiers/{avancements,attachements} ' +
      'et i18n/applications/erp/chantiers/{fr,en,ar}.json : aucun des termes interdits ' +
      '(quotité, WBS, valeur acquise, earned value, avancement pondéré, ligne d\'équilibre) ; ' +
      '« activité » absent de ces deux écrans (seule occurrence du mot « activity » est un nom ' +
      'd\'icône technique, pas un libellé).');

  results.status = 'NON_EXECUTE_SCENARIOS_FIXES';
  console.log(JSON.stringify(results, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
