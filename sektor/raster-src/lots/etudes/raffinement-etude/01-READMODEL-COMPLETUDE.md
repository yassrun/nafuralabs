# Read model de complétude — SEKTOR-202 (préparation, avant feu vert)

> Préparation **read-only** posée avant le lancement de SEKTOR-202 (séquencement : attendre
> livraison + revue de la continuité Étude–Devis–Chantier). Ne modifie aucun fichier source.
> Contrat : [`CONTRAT.md`](CONTRAT.md) AC-1 à AC-7 · Plan : [`00-PLAN.md`](00-PLAN.md).

---

## 1. Inventaire des validations actuelles

### 1.1 Backend

| Emplacement | Règles portées | Limites face au contrat |
|---|---|---|
| `domain/dossier/StatutDossierEtude.java` | machine à transitions (BROUILLON → … → CONVERTIE), `estModifiable()`, `estTerminal()` | ok ; reste la source du cycle de vie (AC-7 s'appuie dessus) |
| `domain/dossier/DossierEtude.java` | `currentStep` 1..5, `status`, `validationEtape` N1/N2, `structureVerrouillee()` | 5 étapes techniques persistées ; la phase UI (4) n'existe que côté front |
| `service/gate/EtapeGate.java` | interface d'une règle d'étape : `etape()`, `bloquant()`, `evaluer(ContexteGate)` | `bloquant` booléen binaire → pas de sévérité `BLOCKING/WARNING/INFO` |
| `service/gate/GatesEtude.java` | 5 gates : Documents, Bordereau, Décomposition, Consultation, Chiffrage | messages = clés i18n brutes, **aucun code stable**, pas de faits, pas d'action de résolution (AC-1) |
| `service/gate/ResultatGate.java` | `record ResultatGate(etape, bloquant, problemes)` ; `ProblemeGate(noeudId, codeArticle, libelle, message)` | structure plate, pas de phase UI, pas de sévérité, pas de compteur par périmètre (AC-1, AC-2) |
| `service/gate/ContexteGate.java` | inputs des règles (articles, noeuds, pièces, client, avis, consultation) | ne transporte ni type AO ni échéance ni voie documentaire ni qualité chiffrage |
| `service/DossierEtudeService.allerAEtape` | **gates en avant seulement** ; `assertGateFranchie` → `GateNonFranchieException(ResultatGate)` → 422 avec gate (AC-3 partiel) | la règle de gate 5 (prix/taux) est rejouée à l'entrée en synthèse **en plus** de 3/4/5 (redondance) |
| `service/DossierEtudeService.soumettre` | rejoue les 5 gates | ne cite pas les codes bloquants (message i18n seul) (AC-3) |
| `service/DossierEtudeService.synthese` | `anomaliesBloquantes` = **somme des problèmes des gates bloquantes seulement** ; `phase`/`actionPrincipale` par switch statique | les WARNING/INFO (part coûts estimés, avis ouverts, consultation informative) sont **invisibles dans le compteur** → audit « 26 % de coûts non établis avec anomalie étape 4 : 0 » (AC-2, AC-25) |
| `service/DossierEtudeService.chargerContexte` | `hasBordereau = hasDpgf || piece BORDEREAU` ; `hasCps = hasDpgf || piece CPS` | la voie manuelle n'est **pas un état** : c'est le fait d'avoir un DPGF qui éteint l'exigence BDP/CPS (AC-4) |
| `service/gate/GatesEtude.GateDocuments` | exige `hasBordereau` **et** `hasCps` inconditionnellement + pièces attendues obligatoires non liées | CPS **obligatoire par défaut** → contraire à AC-4 (« optionnel par défaut ») ; audit « CONVERTIE affiche BDP/CPS obligatoires non déposés mais anomalie étape 1 : 0 » |
| `service/DossierPieceAttendueService.seedMinimalSiAbsent` | seed BDP **et** CPS en `obligatoire=true` à la création | idem AC-4 ; le seed doit passer `CPS → obligatoire=false` par défaut |
| `service/DossierEtudeService.create/update` | exige objet, MOA (clientId ou clientNom), chargé d'étude (`requireIngenieur`) | **échéance et type AO non exigés** : l'AOC n'est créé que si `dateLimiteDepot != null` ; sinon `appelOffreClientId == null` → `enrichirAoListing` ne pose rien → `Type AO = —` sur dossier avancé (AC-5, audit) |
| `api/controller/DossierEtudeController` | `GET /gates`, `GET /synthese`, transitions ; 422 gate avec payload | `/gates` et `/synthese` exposent des structures **différentes** du même état → deux sources de lecture (AC-2) |
| `api/controller/DossierDocumentController.initBordereauManuel` | crée un DPGF vide (voie manuelle implicite) | aucune trace « Bordereau saisi manuellement » lisible dans le read model (AC-4) |

### 1.2 Frontend

| Emplacement | Règle front | Problème (AC) |
|---|---|---|
| `dossiers/utils/dossier-etape.util.ts` | mapping 5 étapes backend → 4 étapes UI (`backendGateEtapesForUi`, `uiEtapePourGate`) ; `estAlerteQualiteChiffrage` teste une sous-chaîne de message | la **structure des 4 phases vit côté front** ; AC-1 exige que le moteur la porte ; un test de message i18n est fragile |
| `dossiers/dossier-detail/dossier-detail.page.ts` | `anomaliesEtapeCourante` recomputé depuis les gates + étape UI courante ; `gatePresentation` soft/hard ; `rechargerGates` | **recalcul front du compteur** → peut diverger de la synthèse (AC-2) ; doublons de lecture gates/synthèse |
| `dossiers/components/dossier-summary-header` | `anomaliesAffichees` = input étape sinon fallback `synthese.anomaliesBloquantes` | deux sources de compteur dans le même bandeau (AC-2) |
| `dossiers/components/gate-blocage` | bannière soft/hard/ok | consomme `ResultatGate` plat ; devra lire le read model |
| `dossiers/components/synthese-validation-panel` | `problemesFinaux` agrégé des gates 3+5 | troisième agrégation front du même état (AC-2) |
| `dossiers/config/listing.config.ts` + `dossier-listing` | pagination + recherche (voir SEKTOR-206) | double pagination et recherche non serveur (AC-28, AC-29) |
| `models/index.ts` | `ProblemeGate{noeudId, codeArticle, libelle, message, etape?}` ; `ResultatGate{etape, bloquant, problemes}` | à remplacer par le contrat du read model |

### 1.3 Divergences constatées (causes racines des anomalies de l'audit)

1. **Compteur étape 1 = 0 sur une étude CONVERTIE** : la synthèse ne compte que les gates
   `bloquant && !problemes.isEmpty()`, et l'en-tête n'affiche que l'étape UI courante → les
   pièces « obligatoires » de l'étape 1 n'apparaissent nulle part une fois le dossier avancé.
2. **CPS obligatoire** : seed `obligatoire=true` + `GateDocuments` exige `hasCps` → contraire
   à AC-4 (optionnel par défaut, configurable).
3. **26 % coûts estimés avec compteur 0** : `part_couts_estimes` est une INFO de la gate 5 ;
   le compteur ne compte que les BLOCKING → l'alerte existe, le compteur dit zéro.
4. **Type AO = —** : l'AOC n'existe que si `dateLimiteDepot` était renseigné à la création ;
   un dossier « avancé » sans AOC affiche `—` au listing sans anomalie.
5. **Deux sources de lecture** : `GET /gates` (5 étapes) et `GET /synthese` (compteur) donnent
   deux vues du même état ; le front en fabrique une troisième (étape UI courante).

---

## 2. Cible : un seul moteur, un seul contrat

### 2.1 Principe

Un service `CompletudeEtudeService` (backend, BC Études) évalue **toutes** les règles et
retourne un unique `CompletudeEtude` consommé par : liste (projection par dossier), en-tête du
détail, bandeau de phase, synthèse, **et** les transitions (`allerAEtape`, `soumettre`,
`convertir`, `gagner`) qui n'ajoutent **aucune** règle équivalente (AC-3). Le front ne calcule
plus ni compteur ni mapping de phases.

### 2.2 Contrat JSON

```json
{
  "dossierId": "…",
  "voie": "AUTO | MANUEL",
  "phaseUi": 1,
  "libellePhaseKey": "etudes.phase.1",
  "etapeBackend": 1,
  "lectureSeule": false,
  "compteurs": {
    "bloquants": 1, "warnings": 2, "infos": 1, "total": 4,
    "parPhase": [
      { "phase": 1, "bloquants": 1, "warnings": 0, "infos": 0, "total": 1 },
      { "phase": 2, "bloquants": 0, "warnings": 1, "infos": 0, "total": 1 },
      { "phase": 3, "bloquants": 0, "warnings": 1, "infos": 1, "total": 2 },
      { "phase": 4, "bloquants": 0, "warnings": 0, "infos": 0, "total": 0 }
    ]
  },
  "controles": [ { "…": "voir ControleEtude" } ],
  "qualiteChiffrage": { "partEtablie": 74.0, "partEstimee": 26.0, "composantsLibres": 4, "composantsIncertains": 0 },
  "prochaineAction": { "code": "CHIFFRER_POSTE", "libelleKey": "etudes.action.chiffrer_poste", "ciblePhase": 3 }
}
```

`ControleEtude` (AC-1) :

```json
{
  "code": "ETU-115",
  "phase": 3,
  "etapeBackend": 5,
  "severite": "BLOCKING | WARNING | INFO",
  "messageKey": "etudes.controle.115",
  "faits": { "prixManquants": 3, "tauxManquants": 1 },
  "action": "DEPOSER_PIECE | CHOISIR_VOIE | CORRIGER_ARBRE | CHIFFRER_POSTE | TRAITER_BLOCAGE | DEMANDER_VALIDATION | GENERER_DEVIS",
  "cibles": { "noeudId": "…", "articleId": "…", "etapeBackend": 5, "phaseUi": 3 }
}
```

### 2.3 Catalogue de codes (stables, testables)

| Code | Phase | Sévérité | Condition | Action de résolution |
|---|---|---|---|---|
| `ETU-101` | 1 | BLOCKING | voie AUTO et aucun BDP source (extraction impossible) | `DEPOSER_PIECE` |
| `ETU-102` | 1 | INFO | voie MANUEL (mention « Bordereau saisi manuellement ») | `CHOISIR_VOIE` |
| `ETU-103` | 1 | BLOCKING | pièce attendue affichée obligatoire absente (hors BDP/CPS) | `DEPOSER_PIECE` |
| `ETU-104` | 1 | BLOCKING | CPS obligatoire (config tenant) et absent | `DEPOSER_PIECE` |
| `ETU-105` | 1 | INFO | CPS optionnel et absent | `DEPOSER_PIECE` |
| `ETU-106` | 1 | BLOCKING | type AO manquant (quitter le cadrage interdit) | `TRAITER_BLOCAGE` |
| `ETU-107` | 1 | BLOCKING | échéance (date limite) manquante (quitter le cadrage interdit) | `TRAITER_BLOCAGE` |
| `ETU-110` | 2 | BLOCKING | bordereau vide (aucun article) | `CORRIGER_ARBRE` |
| `ETU-111` | 2 | BLOCKING | article sans unité ou quantité ≤ 0 | `CORRIGER_ARBRE` |
| `ETU-112` | 2 | WARNING | lot/sous-lot sans article descendant | `CORRIGER_ARBRE` |
| `ETU-113` | 2 | WARNING | codes articles dupliqués (bruit OCR exclu) | `CORRIGER_ARBRE` |
| `ETU-115` | 3 | BLOCKING | origine de coût absente | `CHIFFRER_POSTE` |
| `ETU-116` | 3 | BLOCKING | coût unitaire manquant ou ≤ 0 | `CHIFFRER_POSTE` |
| `ETU-117` | 3 | BLOCKING | origine DECOMPOSE sans DPU/composants à rendement utile | `CHIFFRER_POSTE` |
| `ETU-118` | 3 | BLOCKING | prix de vente unitaire manquant ou ≤ 0 | `CHIFFRER_POSTE` |
| `ETU-119` | 3 | BLOCKING | FG ou marge manquante | `CHIFFRER_POSTE` |
| `ETU-120` | 3 | WARNING | part des coûts estimés > 0 (faits : `partEstimee`) | `CHIFFRER_POSTE` |
| `ETU-121` | 3 | WARNING | avis fournisseur OUVERT/ÉCARTÉ (faits : compteurs) | `TRAITER_BLOCAGE` |
| `ETU-122` | 3 | INFO | consultation optionnelle non engagée | `TRAITER_BLOCAGE` |
| `ETU-123` | 3 | BLOCKING | consultation obligatoire et devis reçus < minimum | `TRAITER_BLOCAGE` |

> Écarts vs brouillon initial (décidés à l'implémentation) : `ETU-114` (mention saisie manuelle en
> phase 2) fusionné dans `ETU-102` ; `ETU-122/123` ramenés en **phase 3** (la consultation nourrit
> le déboursé, aligné sur `backendGateEtapesForUi`) ; `ETU-130/131` (composants libres, marge sous
> seuil) repoussés en SEKTOR-207 qui porte la synthèse décisionnelle.

### 2.4 Gates réutilisées (AC-3)

- `allerAEtape` (avant), `soumettre`, `convertir`, `gagner` appellent `CompletudeEtudeService.evaluer(dossier)`.
- Refus : 422 `{ "code": "ETU-GATE", "controles": [ {code, phase, severite, messageKey, faits, action, cibles} ] }`
  (les codes bloquants seulement). Le front rend les cibles ; il n'existe plus de règle cachée.
- Les warnings n'exigent une décision explicite que lorsqu'un AC le prévoit (AC-26 → SEKTOR-207).

### 2.5 Compteurs uniques (AC-2)

- Endpoint unique `GET /etudes/dossiers/{id}/completude`. Détail, bandeau, synthèse et gates
  lisent ce contrat. Le badge de phase = `compteurs.parPhase[phaseUi]` ; le bandeau = même source.
- Une alerte visible ne peut coexister avec un compteur zéro : les INFO/WARNING comptent
  (corrige l'audit « 26 % avec compteur 0 » et « CONVERTIE avec étape 1 = 0 »).
- Listing (SEKTOR-206) : projection agrégée du même moteur, sans N+1 (une requête par page,
  évaluation en mémoire des dossiers de la page).

### 2.6 Deux voies documentaires (AC-4)

- Nouveau champ `voieDocumentaire` (`AUTO | MANUEL`) sur `DossierEtude`, choisi explicitement
  en phase 1 (« Déposer un BDP pour extraction » / « Saisir le bordereau manuellement »).
- `MANUEL` → `ETU-102` INFO visible « Bordereau saisi manuellement » ; gate documents sans BDP ;
  l'extraction (extraire-bordereau) reste possible mais marquée voie incompatible si déclenchée.
- `AUTO` → `ETU-101` BLOCKING tant qu'aucun BDP source ; la provenance BDP → brouillon → DPGF
  validé est chaînée (SEKTOR-203) ; l'extraction exige le BDP.
- CPS : seed `obligatoire=false` (modif `DossierPieceAttendueService.seedMinimalSiAbsent`) ;
  `ETU-105` INFO par défaut, `ETU-104` BLOCKING si `etudes.cpsObligatoire=true` (tenant setting,
  à ajouter à `ParametresEtudeService`, pattern `etudes.consultation.*`) ou selon type AO.
- Toute pièce affichée « obligatoire » absente → `ETU-103` BLOCKING ; gain/conversion refusés.

### 2.7 Obligations API (AC-5)

- `create` : objet, MOA, chargé d'étude (déjà en place) ; **type AO et échéance deviennent des
  obligations de la phase 1** : `ETU-106`/`ETU-107` BLOCKING pour quitter le cadrage. Un dossier
  avancé ne peut plus exister avec `Type AO = —`.
- `update`/imports/scripts QA : impossible de poser `currentStep > 1` ou un statut avancé sans
  passer le moteur (les endpoints de transition sont déjà les seuls chemins ; le read model
  l'audite).

### 2.8 Terminaux honnêtes (AC-7)

- `GAGNE`/`CONVERTIE` : `lectureSeule=true` ; `prochaineAction` = `CONSULTER`/`VOIR_CHANTIER` ;
  les contrôles restent visibles (mêmes codes, sévérité INFO) avec l'historique des anomalies,
  hypothèses et sources ; aucune action d'écriture proposée.

---

## 3. Zones de conflit avec le lot Chantier (séquencement)

Fichiers Études modifiés par l'agent Chantier (continuité Étude–Devis–Chantier, non commités) :

- `backend/etudes/.../service/DossierEtudeService.java` (gagne/convertir/ChainageAval)
- `backend/etudes/.../api/controller/DossierEtudeController.java`
- `backend/etudes/.../api/request/DossierGagneDto.java`, `service/DevisService.java`,
  `service/port/bc/ChainageAvalPort.java`, `adapters/bc/ChainageAvalAdapter.java` + tests
- `web/app/etudes/devis/**`, `web/app/etudes/dossiers/dossier-detail/dossier-detail.page.ts`,
  `web/app/etudes/dossiers/services/dossier-etude-api.service.ts`

SEKTOR-202 touche directement `DossierEtudeService` (gates/compteurs) et le contrôleur
(obligations API). **Ne pas éditer ces fichiers avant la revue humaine de la continuité.**
La préparation ci-dessus est posée pour démarrer dès le feu vert, en worktree isolé
`etudes/raffinement-etude` (branche `etudes/raffinement-etude`), repartant de la continuité
validée.

## 4. Ordre d'implémentation (une fois feu vert)

1. `ControleEtude`/`CompletudeEtude` + codes (2.3) + tests table-driven de chaque code
   (voie manuelle / automatique).
2. `CompletudeEtudeService` (moteur unique) ; bascule de `evaluerGates`/`synthese` dessus ;
   suppression des agrégations front (dossier-detail, summary-header, synthese-validation-panel).
3. Voie documentaire + CPS configurable (2.6) + obligations API phase 1 (2.7).
4. Transitions sur le moteur (2.4) + 422 par codes ; terminaux honnêtes (2.8).
5. Preuves : test d'intégration égalité compteur/bandeau/synthèse/gate ; test API dossier
   avancé refusé avec pièce obligatoire absente ; contrat JSON documenté.
