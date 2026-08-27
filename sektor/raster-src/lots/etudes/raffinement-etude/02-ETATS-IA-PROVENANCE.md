# États IA, provenance et reprise — SEKTOR-203 (préparation, avant feu vert)

> Préparation **read-only** posée dans l'attente du feu vert (séquencement Chantier + SEKTOR-202).
> Ne modifie aucun fichier source. Contrat : [`CONTRAT.md`](CONTRAT.md) AC-8 à AC-15.
> S'appuie sur le read model de complétude de [`01-READMODEL-COMPLETUDE.md`](01-READMODEL-COMPLETUDE.md).

> **État d'avancement (mis à jour à l'implémentation)** : vagues 1 et 2 livrées dans le worktree
> `etudes/raffinement-etude` — contrat 7 états sur les jobs (vague 1) et proposition IA persistée
> (`PropositionIa` : entrées empreintées, confiance serveur, preuves CPS, décisions par élément,
> péremption) en vague 2. Reste : diff de régénération (AC-12), verrou référentiel à
> l'application DPU (AC-13), seau incertain → SEKTOR-204, fallback manuel front.

---

## 1. Inventaire de la chaîne IA actuelle

### 1.1 Backend — jobs d'extraction (fondation solide)

| Emplacement | Ce qui existe déjà | Écart face au contrat |
|---|---|---|
| `domain/dossier/DocumentExtractionJob.java` | statuts `QUEUED/RUNNING/SUCCEEDED/FAILED/CANCELLED`, `progressPercent/step`, `resultJson` (brouillon), `errorCode/message`, `attemptCount/maxAttempts`, `availableAt`, lease (`leaseOwner/leaseExpiresAt`), `contentHash` (SHA-256), `extractorVersion`, `idempotencyKey`, timestamps | **5 états ≠ 7 états** AC-8 : pas de `REVIEW` (brouillon en attente de revue = aujourd'hui `SUCCEEDED` + `outcome=REVIEW_REQUIRED`), pas de `NO_RESULT` (absent → `ARBRE_VIDE` = FAILED : confusion « pas de contenu métier » / « échec technique »), pas de `UNAVAILABLE`, pas de `VALIDATED`/`DISCARDED` |
| `service/extraction/DocumentExtractionJobService.java` | enqueue avec clé d'idempotence `tenant:piece:type:hash:version`, **réutilisation de la ligne** au retry (pas de doublon), claim + lease + TTL 20 min, worker poller hors transaction, backoff exponentiel, `fail(code, message, retryable)`, `succeed(result)` | pas de distinction erreur métier (`ARBRE_VIDE`) vs erreur technique ; pas de `UNAVAILABLE` : `enqueueBordereau` jette `IllegalStateException` quand le port est indisponible → le front ne voit **aucun état** ; `resultJson` = brouillon sans empreinte des **entrées** ni sections CPS utilisées (AC-9) |
| `service/cps/CpsService.indexer` | CPS → `CpsDocument`/`CpsSection`, statuts `TERMINE`/`NON_SUPPORTE`, `qualiteSource`, `messageExtraction` | `NON_SUPPORTE` (scan) → `SUCCEEDED` + `outcome=NON_SUPPORTE` : notion « indisponible » correcte mais noyée dans SUCCEEDED |
| `api/response/ExtractionJobDto.java` | vue API complète du job | porte les 5 statuts ; à étendre vers le contrat 7 états |

### 1.2 Backend — propositions (décomposition / descriptif)

| Emplacement | Ce qui existe déjà | Écart face au contrat |
|---|---|---|
| `service/DecompositionProposeService.java` | besoins LLM (`DecompositionNeedsPort`) → **identité résolue par Catalogue** (`catalogLookupApi.classerIdentite`) → 3 seaux `matched/missing/uncertain` ; prix résolu par Catalogue (`resolvePurchasePrice`) filtré sur `SOURCES_CONSULTABLES` ; `suggereParIa(true)` ; `confiance` = LLM bornée 0..1 | AC-8 : `Optional.empty()` → **204 indifférencié** pour « port indisponible », « aucun besoin extrait » et « seaux vides » — le front ne peut pas distinguer UNAVAILABLE de NO_RESULT ; AC-15 : **rien n'est persisté** → une proposition perdue au reload ; pas de clé d'idempotence par article/geste ; AC-11 : `confiance` brute du LLM affichée telle quelle, sans indicateur serveur (validité schéma, présence source, cohérence unité/type, qualité rapprochement) |
| `service/port/capability/DecompositionNeedsPort` + adaptateurs | port propre (pas de dépendance directe à Gemini) | les preuves (extrait CPS / libellé) ne remontent pas par composant dans `DecompositionProposeDto` (AC-10) |
| `service/port/capability/DescriptifCpsPort` | descriptif technique d'article depuis sections CPS retrouvées ; `sectionSourceId` | seule provenance structurée existante ; à généraliser (page/zone/extrait, AC-10) |
| `service/RattrapageComposantService.java` | agrège composants libres, groupes, demandes de création (`DemandeCreationArticle`) ; mode création `LIBRE|CONTROLEE` | AC-14 : vérifier que « ignorer » exige un motif court quand le composant est nécessaire et que le meilleur score n'est jamais choisi silencieusement ; traçabilité des décisions par élément |

### 1.3 Frontend

| Emplacement | Ce qui existe déjà | Écart face au contrat |
|---|---|---|
| `dossiers/components/pieces-marche` | polling job (`attendreJob`, labels de progression, deadline 20 min), phase `review` avec `draftArbre`, relance (`relancerExtractionJob`) | 204 ambigüe → message « Aucun poste extrait » pour un échec technique comme pour un NO_RESULT (AC-8) |
| `dossiers/services/dossier-etude-api.service.ts` | `ExtractionJobDto` (5 statuts), `DecompositionPropose` (matched/missing/uncertain, `confiance`, `suggereParIa`) | à aligner sur le contrat (7 états, preuves, indicateur confiance) |
| `dossiers/components/decomposition-suggestion-dialog` + `poste-decomposition-panel` | revue des composants proposés, `suggereParIa` sur les lignes | décisions par élément non persistées ; régénération sans diff (AC-12) |
| `dossiers/components/cps-descriptif-dialog` | « Confiance xx % » = brute LLM | AC-11 : remplacer par indicateur serveur `faible/moyenne/élevée` |
| `dossiers/components/rattrapage-panel` | résolution incertain (rapprocher/créer/ignorer) | AC-14 : fiche/source du candidat visible, recherche alternative, motif d'ignorance conditionnel |

---

## 2. Cible : un contrat d'état unique pour tout geste IA

### 2.1 Principe

Un `PropositionIaService` (BC Études) orchestre **tous** les gestes IA
(extraction bordereau, indexation CPS, proposition décomposition, descriptif, marché) et expose
un contrat unique. Les jobs existants (`DocumentExtractionJob`) deviennent le stockage de
reprise ; la proposition persistée porte états, entrées, preuves et décisions.

### 2.2 Contrat JSON

```json
{
  "propositionId": "…",
  "geste": "EXTRACTION_BORDEREAU | INDEXATION_CPS | PROPOSITION_DECOMPOSITION | DESCRIPTIF | MARCHE",
  "etat": "QUEUED | RUNNING | REVIEW | NO_RESULT | FAILED | UNAVAILABLE | VALIDATED | DISCARDED",
  "dossierId": "…",
  "cible": { "type": "PIECE | ARTICLE", "id": "…" },
  "entrees": {
    "documents": [ { "dossierDocumentId": "…", "type": "BORDEREAU", "hash": "sha256…" } ],
    "descriptifVersion": 3,
    "cpsSectionsUtilisees": [ "section-uuid…" ],
    "fournisseurModele": "gemini-2.x",
    "date": "2026-08-26T14:32:00Z"
  },
  "sortie": {
    "schemaVersion": "etudes-proposition-1",
    "contenu": { "…": "brouillon structuré (arbre / composants / texte)" },
    "confiance": { "indicateur": "faible | moyenne | élevée", "diagnostic": { "confianceBruteLlm": 0.82, "schemaValide": true, "sourcePresente": true, "coherenceUniteType": false, "qualiteRapprochement": "DEJA_TENANT" } }
  },
  "preuves": [ { "element": "composant.ciment", "source": "CPS | LIBELLE | CONNAISSANCE_IA", "sectionId": "…", "pageZone": "p.18 §3.2", "extrait": "« béton dosé à 350 kg/m³ »" } ],
  "decisions": [ { "element": "composant.adjuvant", "decision": "ACCEPTE | REFUSE | CORRIGE", "par": "user@…", "date": "…" } ],
  "prochaineAction": { "code": "REVOIR_PROPOSITION | CORRIGER_ENTREE | SAISIE_MANUELLE | RELANCER | VALIDER | GENERER" },
  "peutRelancer": true,
  "regenerations": [ { "date": "…", "modifications": [ "…" ], "par": "…" } ]
}
```

### 2.3 États et messages distincts (AC-8)

| État | Déclencheur | Rendu front |
|---|---|---|
| `QUEUED` / `RUNNING` | job en file / en cours | progression + reprise après navigation (AC-15) |
| `REVIEW` | brouillon produit, aucune validation | revue par élément (AC-12) ; **`À actualiser`** si empreinte des entrées changée (AC-9) |
| `NO_RESULT` | appel réussi, aucune proposition exploitable (seaux vides, arbre vide, CPS sans sections) | « Rien d'exploitable : enrichir le descriptif / déposer une meilleure source » + chemin manuel |
| `FAILED` | erreur technique relançable (`EXECUTION_ERROR`, provider timeout…) | erreur nommée + bouton Relancer (même clé d'idempotence, pas de doublon) |
| `UNAVAILABLE` | port/capability indisponible (No-Op, provider down, clé absente) | « Service indisponible » + chemin manuel — **jamais** « aucun résultat » |
| `VALIDATED` | validation explicite de tous les éléments | verrouillé, sources consultables |
| `DISCARDED` | refus explicite | historique conservé, relance possible |

### 2.4 Provenance et péremption (AC-9, AC-10)

- Chaque proposition persiste **l'empreinte de ses entrées** : ids + hash des documents, version
  du descriptif/article, sections CPS utilisées, date, fournisseur/modèle technique, version du
  schéma de sortie.
- Toute modification d'une entrée → comparaison d'empreinte → état `REVIEW` avec
  drapeau `àActualiser=true` + liste des entrées modifiées ; la proposition ne se présente
  **jamais** comme fraîche.
- Chaque métadonnée extraite cite page/zone ou extrait source ; chaque composant proposé cite
  libellé/descriptif et, si utilisé, la section CPS ; une hypothèse sans source est marquée
  `CONNAISSANCE_IA` (« connaissance métier IA »), jamais « issue du CPS ».

### 2.5 Confiance serveur (AC-11)

- `indicateur = faible | moyenne | élevée` calculé **serveur** à partir de :
  1. validité du schéma de sortie (`sortie.schemaVersion` reconnu et contenu parseable),
  2. présence de source (`preuves` non vide),
  3. cohérence unité/type (unité résolue par le référentiel actif, type DPU cohérent),
  4. qualité du rapprochement (`DEJA_TENANT` > `INCERTAIN` > `A_CREER`).
- `confianceBruteLlm` reste conservée **dans le diagnostic uniquement** ; elle ne valide ni
  champ, ni identité, ni prix.

### 2.6 Frontière référentielle (AC-13)

- Déjà partiellement en place (`DecompositionProposeService` résout identité et prix via
  `CatalogLookupApi`) ; l'étendre systématiquement :
  - aucun prix, devise, `itemId`, `cleStable`, fournisseur ou unité inconnue accepté parce que
    le modèle l'a renvoyé ;
  - unité résolue par le référentiel actif ; l'IA ne propose qu'un **besoin et un rendement**.

### 2.7 Seau incertain (AC-14)

- Pour chaque match `INCERTAIN` : choisir un candidat avec fiche/source visible, rechercher un
  autre article, ajouter au poste seulement, ou lancer la création Catalogue (SEKTOR-204).
- Ignorer exige un motif court si le composant a été sélectionné nécessaire.
- **Aucun meilleur score n'est choisi silencieusement.**

### 2.8 Reprise asynchrone (AC-15)

- La proposition est persistée serveur ; quitter/recharger la page ne perd rien.
- **Un seul job/proposition actif** par (dossier, geste, cible, clé d'idempotence) — extension
  de la clé existante `tenant:piece:type:hash:version` aux gestes décomposition/descriptif.
- Relancer un échec **réutilise la ligne** (déjà le cas pour bordereau/CPS) ; jamais deux
  brouillons.
- Progression + dernière étape connue visibles.

---

## 3. Zones de conflit (séquencement)

- SEKTOR-203 éditera `DecompositionProposeService`, `DocumentExtractionJobService`,
  `DossierEtudeController`/`DossierDocumentController` et le front `pieces-marche`,
  `dossier-etude-api.service.ts` — fichiers partagés avec le lot Chantier (non commités) et avec
  SEKTOR-202. **Exécution après** la revue de la continuité et la livraison de SEKTOR-202
  (dépendance `blocked_by: [SEKTOR-202]`).

## 4. Ordre d'implémentation (une fois feu vert)

1. Étendre `DocumentExtractionJob`/DTO vers les 7 états + `outcome` explicite (`REVIEW_REQUIRED`,
   `NO_RESULT`, `NON_SUPPORTE`, `UNAVAILABLE`) ; reclasser `ARBRE_VIDE` en `NO_RESULT` (pas un FAILED).
2. Persister la proposition (entrées + sortie + preuves + décisions) pour la décomposition et le
   descriptif, avec clé d'idempotence par (dossier, article, geste).
3. Indicateur de confiance serveur + diagnostic ; verrou référentiel (unité/type) au passage des
   propositions.
4. États `REVIEW/VALIDATED/DISCARDED` + décisions par élément + régénération avec diff.
5. Fallback manuel distinct pour `NO_RESULT/FAILED/UNAVAILABLE` dans le front.
6. Preuves : tests adaptateurs/services des 7 états, reprise après reload, concurrence ;
   provenance page/section ; proposition périmée après modification du descriptif ; sortie LLM
   avec prix/id/unité inconnue refusée à la frontière ; tests UI des décisions et du diff.
