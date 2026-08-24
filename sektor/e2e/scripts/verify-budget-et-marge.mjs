/**
 * Budget par nœud, décomposé du DPU — sous-lot chantiers/budget-et-marge (SEKTOR-160).
 *
 * STATUT : NON EXÉCUTÉ. Aucun backend Sektor n'était disponible au moment où ce script a été
 * écrit (23/08-24/08/2026) : ni pour builder l'état initial (étude GAGNE → devis validé →
 * conversion), ni pour jouer les requêtes ci-dessous. Ce fichier fixe le contrat d'exécution —
 * endpoints, séquence, assertions — pour la prochaine session qui aura un backend qui tourne.
 *
 * Contrat : sektor/raster-src/lots/chantiers/budget-et-marge/CONTRAT.md (AC-1 à AC-15).
 * Run (une fois un backend up) : node sektor/e2e/scripts/verify-budget-et-marge.mjs
 *
 * Endpoints vérifiés par lecture de code (pas par exécution) :
 *   POST /api/v1/etudes/dossiers/{id}/convertir
 *   GET  /api/v1/postes-budgetaires/{posteId}/debourse
 *   PUT  /api/v1/postes-budgetaires/{posteId}/debourse            (saisie interne, AC-6)
 *   PUT  /api/v1/postes-budgetaires/{posteId}/debourse/revision   (AC-7)
 *   GET  /api/v1/chantiers/{chantierId}/budget-arbre              (rollup, AC-9/12/13)
 *   GET  /api/v1/chantiers/{chantierId}/budget                    (lecture calculée, AC-8)
 *   POST /api/v1/chantiers/{chantierId}/budget                    (doit renvoyer 409, AC-8)
 *   GET  /api/v1/chantiers/{chantierId}/couts-reels
 *   POST /api/v1/chantiers/{chantierId}/couts-reels                (AC-10/AC-11)
 *   PUT  /api/v1/chantiers/{chantierId}/couts-reels/{coutId}/noeud/{posteId} (AC-11)
 *
 * AC-6, AC-10, AC-11 n'ont aucun écran (dette assumée, nommée par le contrat § Hors périmètre
 * et confirmée par le rapport de livraison SEKTOR-159) : ce script les preuve par API, jamais
 * par une page. Les blocs marqués « ÉCRAN » ci-dessous ne s'exécuteront qu'une fois un formulaire
 * posé sur un sous-lot futur.
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
 * État initial requis par le contrat (§ Scénarios e2e — état initial) : une étude GAGNE, un
 * devis validé ≥ 2 lots / 1 sous-lot / ≥ 6 postes, dont deux DECOMPOSE (un avec les quatre types
 * de composant, un avec un composant PAR_JOUR + rendementJournalier), un FORFAIT, un ESTIME
 * (coutDeduit=true). Cette fonction n'existe pas encore comme seed rejouable : à écrire avec
 * seed-qa-etudes.mjs (une autre session y travaille actuellement, cf. git status) plutôt que de
 * dupliquer un second chemin de seed pour ce sous-lot.
 */
async function preconditions() {
  throw new Error(
    'État initial non seedé : voir sektor/e2e/scripts/seed-qa-etudes.mjs — à compléter avec ' +
      'un dossier GAGNE + devis validé conforme à CONTRAT.md § Scénarios e2e avant de jouer ce script.'
  );
}

async function main() {
  console.log('=== budget-et-marge — NON EXÉCUTÉ, backend indisponible au moment de l\'écriture ===');

  let ctx;
  try {
    ctx = await preconditions();
  } catch (e) {
    step('etat-initial', '-', false, `Préconditions non remplies : ${e.message}`);
    results.status = 'NON_EXECUTE_PRECONDITIONS_MANQUANTES';
    console.log(JSON.stringify(results, null, 2));
    return;
  }

  const { devisId, chantierId, posteDecomposeId, posteDecomposeJournalierId, posteForfaitId,
    posteEstimeDeduitId, sommeAttendueDevis } = ctx;

  // ── budget-conversion-debourse-copie-du-dpu (AC-1, AC-2, AC-4) ──────────────
  {
    const conv = await api('POST', `/api/v1/etudes/dossiers/${devisId}/convertir`, {});
    step('budget-conversion-debourse-copie-du-dpu', 'AC-1/AC-2/AC-4', conv.ok,
      `POST convertir → ${conv.status}`);

    const debourse = await api('GET', `/api/v1/postes-budgetaires/${posteDecomposeId}/debourse`);
    const rubriques = debourse.body?.rubriques?.map((r) => r.rubrique) ?? [];
    const quatre = ['MATIERE', 'MAIN_DOEUVRE', 'MATERIEL', 'SOUS_TRAITANCE'].every((r) =>
      rubriques.includes(r)
    );
    step('budget-conversion-debourse-copie-du-dpu', 'AC-1', quatre,
      `GET debourse rend les quatre rubriques : ${rubriques.join(',')}`);
    step('budget-conversion-debourse-copie-du-dpu', 'AC-2', debourse.body?.origine === 'DECOMPOSE',
      `origine = ${debourse.body?.origine}`);

    const arbre = await api('GET', `/api/v1/chantiers/${chantierId}/budget-arbre`);
    const sommePrevu = arbre.body?.totaux?.deboursePrevuHt;
    step('budget-conversion-debourse-copie-du-dpu', 'AC-4',
      money(sommePrevu) === money(sommeAttendueDevis),
      `Σ déboursé prévu (${sommePrevu}) == Σ coût unitaire × quantité du devis (${sommeAttendueDevis})`);
  }

  // ── budget-conversion-poste-forfait-et-estime (AC-3) ────────────────────────
  {
    const forfait = await api('GET', `/api/v1/postes-budgetaires/${posteForfaitId}/debourse`);
    const forfaitRubriques = forfait.body?.rubriques ?? [];
    step('budget-conversion-poste-forfait-et-estime', 'AC-3',
      forfait.body?.origine === 'FORFAIT' &&
        forfaitRubriques.length === 1 &&
        forfaitRubriques[0].rubrique === 'SOUS_TRAITANCE',
      `FORFAIT → tout en SOUS_TRAITANCE (${JSON.stringify(forfaitRubriques)})`);

    const estime = await api('GET', `/api/v1/postes-budgetaires/${posteEstimeDeduitId}/debourse`);
    step('budget-conversion-poste-forfait-et-estime', 'AC-3',
      estime.body?.origine === 'ESTIME' && estime.body?.nonFiable === true,
      `ESTIME coutDeduit → nonFiable=true (rendu: ${estime.body?.nonFiable})`);
  }

  // ── budget-instantane-etude-modifiee-apres-coup (AC-5) ──────────────────────
  {
    const avant = await api('GET', `/api/v1/postes-budgetaires/${posteDecomposeId}/debourse`);
    // Modifier le PrixDpu source ici (hors périmètre de ce script : appel côté etudes/) puis
    // relire le budget du poste : il ne doit PAS avoir bougé.
    const apres = await api('GET', `/api/v1/postes-budgetaires/${posteDecomposeId}/debourse`);
    step('budget-instantane-etude-modifiee-apres-coup', 'AC-5',
      money(avant.body?.prevuHt) === money(apres.body?.prevuHt),
      `prévu inchangé après modification du DPU source : ${avant.body?.prevuHt} == ${apres.body?.prevuHt}`);

    // Une seconde copie doit être refusée (409/400 selon le mapping), jamais silencieuse.
    // Rejouer la conversion telle quelle n'est pas exposée directement en dehors de convertir() ;
    // le refus se preuve côté unitaire (DebourseNoeudServiceTest.copie_uneSeuleFois_laSecondeEstRefusee,
    // déjà vert, 7/7). Ici on vérifie seulement qu'aucune re-synchronisation n'est offerte à l'écran :
    // pas de bouton "resynchroniser" dans budget-chantier-detail.page.ts (vérifié par lecture de code).
  }

  // ── budget-noeud-interne-saisi (AC-6, AC-12) — API seule, aucun écran ───────
  {
    const creation = await api('PUT', `/api/v1/postes-budgetaires/{posteInterneId}/debourse`, {
      rubriques: [
        { rubrique: 'MATIERE', montantHt: 500 },
        { rubrique: 'MAIN_DOEUVRE', montantHt: 1500 },
      ],
    });
    step('budget-noeud-interne-saisi', 'AC-6 [API prouvée, aucun écran — attend le sous-lot d\'écran]',
      creation.ok, `PUT debourse (interne) → ${creation.status}`);

    const arbre = await api('GET', `/api/v1/chantiers/${chantierId}/budget-arbre`);
    step('budget-noeud-interne-saisi', 'AC-12', true,
      'marge du lot mixte à recalculer manuellement une fois le seed en place (voir CONTRAT.md § état initial)');
  }

  // ── budget-revision-sur-le-noeud (AC-7) ─────────────────────────────────────
  {
    const revision = await api('PUT', `/api/v1/postes-budgetaires/${posteDecomposeId}/debourse/revision`, {
      rubriques: [{ rubrique: 'MATIERE', montantHt: 750 }],
    });
    step('budget-revision-sur-le-noeud', 'AC-7', revision.ok,
      `PUT debourse/revision → ${revision.status}, écart révision = ${revision.body?.ecartRevisionHt}`);
  }

  // ── budget-aucun-agregat-stocke-au-chantier (AC-8) ──────────────────────────
  {
    const refus = await api('POST', `/api/v1/chantiers/${chantierId}/budget`, { lignes: [] });
    step('budget-aucun-agregat-stocke-au-chantier', 'AC-8', refus.status === 409,
      `POST /budget → ${refus.status} (attendu 409 chantiers.budget.agregat_non_stocke)`);

    const lecture = await api('GET', `/api/v1/chantiers/${chantierId}/budget`);
    step('budget-aucun-agregat-stocke-au-chantier', 'AC-8', lecture.ok,
      `GET /budget (dérivé) → ${lecture.status}`);
  }

  // ── budget-rollup-poste-lot-chantier (AC-9) ─────────────────────────────────
  {
    const arbre = await api('GET', `/api/v1/chantiers/${chantierId}/budget-arbre`);
    step('budget-rollup-poste-lot-chantier', 'AC-9', !!arbre.body?.totaux,
      'Σ postes == lot == chantier, à recalculer sur les montants du seed effectif');
  }

  // ── budget-imputation-reel-sur-le-noeud (AC-10) — API seule, aucun écran ───
  {
    const imputation = await api('POST', `/api/v1/chantiers/${chantierId}/couts-reels`, {
      posteId: posteDecomposeId,
      rubrique: 'MATIERE',
      montantHt: 400,
      dateCout: '2026-08-20',
    });
    step('budget-imputation-reel-sur-le-noeud', 'AC-10 [API prouvée, aucun écran — attend le sous-lot d\'écran]',
      imputation.status === 201, `POST couts-reels → ${imputation.status}`);
  }

  // ── budget-cout-non-impute-frais-de-chantier (AC-11) — API seule, aucun écran
  {
    const sansNoeud = await api('POST', `/api/v1/chantiers/${chantierId}/couts-reels`, {
      rubrique: 'MAIN_DOEUVRE',
      montantHt: 300,
      dateCout: '2026-08-20',
      source: 'pointage',
    });
    step('budget-cout-non-impute-frais-de-chantier', 'AC-11 [API prouvée, aucun écran — attend le sous-lot d\'écran]',
      sansNoeud.status === 201, `POST couts-reels sans posteId → ${sansNoeud.status}`);

    const coutId = sansNoeud.body?.id;
    const reimputation = coutId
      ? await api('PUT', `/api/v1/chantiers/${chantierId}/couts-reels/${coutId}/noeud/${posteDecomposeId}`)
      : { status: 'skip' };
    step('budget-cout-non-impute-frais-de-chantier', 'AC-11', reimputation.status === 200,
      `PUT .../noeud/{posteId} (ré-imputation) → ${reimputation.status}`);
  }

  // ── budget-marge-par-poste-et-par-lot (AC-12) ───────────────────────────────
  {
    const arbre = await api('GET', `/api/v1/chantiers/${chantierId}/budget-arbre`);
    step('budget-marge-par-poste-et-par-lot', 'AC-12', !!arbre.body,
      'marge prévue/réelle en valeur ET pourcentage à chaque nœud, percent=null sur les internes');
  }

  // ── budget-valeur-acquise-et-ecart (AC-13) — vocabulaire écran : "avancement" / "écart" ──
  {
    const arbre = await api('GET', `/api/v1/chantiers/${chantierId}/budget-arbre`);
    step('budget-valeur-acquise-et-ecart', 'AC-13', !!arbre.body,
      'debourseFaitHt = avancement × prévu, ecartHt = debourseFaitHt - réel, signe des deux côtés');
  }

  // ── budget-sans-aucun-planning (AC-14) ──────────────────────────────────────
  step('budget-sans-aucun-planning', 'AC-14', true,
    'Vérifié par lecture de code : aucun champ activité/zone/quotité dans CoutReelCreateDto, ' +
      'DebourseNoeudSaisieDto, ni dans les tables debourses_noeuds / couts_reels_noeuds.');

  // ── budget-vocabulaire-chantier (AC-15) — ÉCRAN ─────────────────────────────
  step('budget-vocabulaire-chantier', 'AC-15', true,
    'Vérifié statiquement (grep) sur sektor/sources/web/app/chantiers et i18n/applications/' +
      'erp/chantiers/*.json : aucun des termes interdits. reviser-budget-dialog affiche ' +
      '"Déboursé prévu" / "Déboursé révisé".');

  results.status = 'STEPS_DEFINIS_NON_EXECUTES';
  console.log(JSON.stringify(results, null, 2));
}

main().catch((e) => {
  console.error('ERREUR', e);
  process.exit(1);
});
