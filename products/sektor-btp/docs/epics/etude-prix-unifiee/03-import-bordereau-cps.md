# Lot 3 — Import non destructif du bordereau et enrichissement CPS

**Objectif** : corriger une perte de données grave, et faire de l'enrichissement CPS une étape à
part entière.

**Dépend de** : lot 2.

---

## Le défaut à corriger

`ConsultationService.importTree()` fait :

```java
noeudRepository.deleteByConsultationId(consultationId);   // ← tout l'arbre
noeudRepository.flush();
// puis recrée depuis zéro
consultation.setStatus(STATUS_BROUILLON);
consultation.setCurrentStep(STEP_BORDEREAU);
```

Un ré-import de bordereau corrigé à l'étape 3 ou 5 détruit **sans confirmation ni retour arrière** :
décompositions, prix saisis, FG/marge, descriptifs enrichis, liens catalogue. Et remet l'étude au
départ.

En avant-vente, recevoir un bordereau rectificatif est **normal**, pas exceptionnel. Sur une étude à
800 articles, c'est plusieurs jours de travail perdus.

---

## Tâches

### T3.1 — Import en mode réconciliation

L'import ne remplace plus : il **compare et propose**.

```java
public record DiffImport(
    List<NoeudImporte> ajouts,        // absents de l'arbre actuel
    List<DiffNoeud>    modifications, // code retrouvé, attribut changé
    List<DpgfNoeud>    suppressions,  // présents mais absents du nouveau fichier
    List<DpgfNoeud>    inchanges
) {}

public record DiffNoeud(
    DpgfNoeud actuel,
    NoeudImporte importe,
    List<String> champsModifies,      // "quantite", "libelle", "unite"
    boolean impacteChiffrage          // true si quantité/unité changent et un PrixDpu existe
) {}
```

**Appariement** : par `code` normalisé (`1.1.3`, `1-1-3`, `1 1 3` → `113`) — la logique
`normalizeCode()` de `ConsultationService` est correcte, la reprendre. Repli sur le libellé
normalisé. Un article sans code ni libellé exploitable part en `ajouts`.

**Règle de préservation** : sur une modification, `PrixDpu` et ses `ComposantDpu` sont **conservés**.
Seuls les attributs du nœud (quantité, libellé, unité) sont mis à jour. Si l'unité change alors
qu'un chiffrage existe, marquer `impacteChiffrage = true` — les rendements sont exprimés par unité,
un passage de m³ à m² les invalide.

### T3.2 — API d'import en deux temps

```
POST /api/v1/etudes/dossiers/{id}/bordereau/analyser   (multipart)
     → DiffImport, ne persiste RIEN

POST /api/v1/etudes/dossiers/{id}/bordereau/appliquer
     { ajouts: [...], modifications: [...], suppressions: [...] }
     → applique la sélection de l'utilisateur
```

L'utilisateur voit le diff et coche ce qu'il accepte. Une suppression n'est **jamais** appliquée par
défaut : elle est décochée, avec un avertissement si l'article porte un chiffrage.

**Premier import** (arbre vide) : le diff est un `ajouts` intégral, l'écran peut être passé
automatiquement — mais l'API reste la même.

### T3.3 — Instantané avant application

Avant toute application de diff, écrire un instantané JSON de l'arbre + chiffrage dans
`dpgf_snapshots` (réutiliser le motif de `DpuVersion.snapshotJson` qui existe déjà).

```sql
CREATE TABLE dpgf_snapshots (
    id           UUID PRIMARY KEY,
    tenant_id    UUID NOT NULL,
    dpgf_id      UUID NOT NULL,
    motif        VARCHAR(50) NOT NULL,   -- IMPORT_BORDEREAU | ENRICHISSEMENT_CPS | AVANT_VALIDATION
    snapshot     JSONB NOT NULL,
    created_by   VARCHAR(100),
    created_at   TIMESTAMPTZ NOT NULL
);
```

Plus `POST /dossiers/{id}/restaurer/{snapshotId}`. Sans ça, aucun filet de sécurité.

### T3.4 — Étape 2 : enrichissement CPS

Aujourd'hui l'enrichissement descriptif est un endpoint isolé
(`POST /{id}/extract-descriptifs`) sans place dans le parcours. Il devient l'étape 2.

L'écran affiche le tableau des articles avec :
- colonne descriptif (éditable en ligne)
- indicateur de provenance : CPS extrait / saisi manuellement / vide
- taux de couverture en en-tête (« 47 / 62 articles décrits »)
- action « Extraire depuis le CPS » (utilise `CpsDescriptifExtractionPort`)

La logique d'appariement de `applyDescriptifsFromCps()` est bonne (code normalisé, repli libellé,
descriptifs vides ignorés pour ne pas écraser). La reprendre telle quelle, avec deux ajouts :
- ne pas écraser un descriptif **saisi manuellement** sans confirmation
- tracer la provenance : `descriptif_source VARCHAR(20)` — `CPS` | `MANUEL` | `BIBLIOTHEQUE`

### T3.5 — Import Excel natif

L'extraction IA viendra plus tard, mais un import Excel déterministe est indispensable dès
maintenant — c'est le format réel des bordereaux reçus.

- Upload `.xlsx` / `.xls`
- Écran de mapping de colonnes (code / désignation / unité / quantité), avec détection des en-têtes
  et mémorisation du mapping par tenant
- Déduction de la hiérarchie : par indentation, par numérotation (`1` → `1.1` → `1.1.3`), ou par
  colonne de niveau explicite
- Prévisualisation avant application, puis passage par le même diff que T3.1

C'est un chemin **non-IA** qui doit fonctionner seul. L'implémentation `BordereauExtractionPort` par
IA viendra en complément pour les PDF, pas en remplacement.

---

## Critères d'acceptation

- [ ] Ré-importer un bordereau modifié à l'étape 5 conserve tous les chiffrages existants
- [ ] Le diff distingue correctement ajout / modification / suppression sur un cas réel
- [ ] Les suppressions ne sont jamais appliquées sans action explicite
- [ ] Un changement d'unité sur un article chiffré est signalé `impacteChiffrage`
- [ ] Un instantané est créé avant chaque application, et restaurable
- [ ] Un `.xlsx` réel fourni par l'expert métier s'importe correctement
- [ ] L'extraction CPS n'écrase pas un descriptif saisi à la main sans confirmation
