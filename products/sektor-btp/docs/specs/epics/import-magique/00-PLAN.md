---
kind: epic-plan
app: sektor-btp
slug: import-magique
module: documents
pm_feature: ERP-53
status: draft
language: fr
---

# Import magique — moteur d'extraction unifié

> Un seul moteur d'import pour tous les documents : la grille remplace le texte aplati,
> l'IA compile un plan de lecture au lieu de lire les données.

**Objectif** : basculer les écrans d'import de Sektor sur le moteur déterministe validé sur le
bordereau, promu en capability plateforme — sans régression, et avec le chemin LLM conservé en
dernier palier.
**Périmètre code** : `platform/backend/features/documents/`, `platform/web/features/documents/`,
`products/sektor-btp/backend/modules/etudes/…/bordereau/`,
`products/sektor-btp/web/app/shared/extraction-schemas/`,
`products/sektor-btp/web/app/shared/smart-import/`.
**Hors scope** : le lecteur d'ancres *implémenté* (vague 2), le rapprochement BL / facture,
la matrice et les blocs multiples (vague 3), la découverte de schéma, la reprise de données
d'onboarding — tous consommateurs ultérieurs de ce moteur, pas de ce lot.

---

## 1. Verdict

Il existe aujourd'hui **deux piles d'import qui s'ignorent**. La pile plateforme aplatit chaque
fichier en texte puis paie un appel de modèle pour reconstruire la structure qu'elle vient de
détruire ; elle sert sept écrans. La pile `etudes` lit une grille de façon déterministe et sort
703 articles sur quatre fichiers réels avec zéro appel.

Le point qui commande tout : **tout ce qu'importe la pile plateforme est tabulaire**. Une liste de
clients est un tableau, un BL est un tableau. Il n'y a donc pas deux problèmes, il y en a un, et
la meilleure des deux réponses est déjà écrite et mesurée. Cet epic la promeut au rang de moteur
unique.

L'ordre des lots est commandé par une contrainte : le bordereau est le seul cas dont on possède
un étalon chiffré. Il doit rester vert du premier au dernier lot, sinon on perd le seul moyen de
savoir si le déménagement a cassé quelque chose.

---

## 2. Constat

### 2.1 Deux piles

**A — Pile plateforme, pilotée par modèle.**
`StatelessExtractionService` aplatit via `PdfTextExtractor` / `SpreadsheetTextExtractor`, puis
appelle `LlmService` avec le `dataSchema` de l'`ExtractionDefinition`. Un appel par fichier,
timeout 120 s par défaut. Elle expose aussi `proposeSchemas()` (`SCHEMA_PROPOSAL_PENDING`) et un
`DocTypeBuilderEngine` de 725 lignes — la découverte de schéma existe déjà, sur le mauvais pivot.

**B — Pile `etudes`, déterministe.**
`ma.nafura.etudes.service.bordereau.grid` (1 606 lignes) : `PdfRuledGridSource`, `XlsxGridSource`,
`ColumnMap`, `GridRowClassifier`, `GridBordereauAssembler`. Branchée en tête de
`PdfBordereauLayoutParser.parse()`. Mesures : 9 lots / 47 sous-lots / 186 articles / 0 ambigu sur
`BDP-2-17.pdf` ; 703 articles sur 4 fichiers, 0 orphelin.

Spécification exécutable et justification des neuf règles : `products/sektor-btp/docs/extraction/`.

### 2.2 Ce qui n'existe pas encore

`ReadingPlan`, `PlanResolver`, `PlanValidator`, `PlanCache` : **aucune occurrence** dans le dépôt.
La cascade est spécifiée dans le prototype, pas écrite en Java.

### 2.3 Les sept écrans câblés

| Écran | Forme | Consommation |
|---|---|---|
| clients, fournisseurs, employés, articles, ouvrages | liste | handler — crée, dédoublonne |
| lots de chantier | arbre | handler — deux passes, `parentLotId` |
| réception BL | tête + lignes | `form.patchValue` — **aucun handler**, aucune création |

Le bordereau d'étude n'est pas câblé sur `smart-import` : il a son propre chemin.

### 2.4 Dettes constatées

- `AdaptiveBordereauExtractionOrchestrator.lastDiagnostics` est un champ mutable sur un singleton :
  deux imports simultanés mélangent leurs diagnostics. **À corriger au lot 0.**
- `docs/extraction/README.md` annonce `XlsxGridSource` comme « reste à porter » alors que le
  fichier existe (160 lignes). Doc périmée, à reprendre au lot 0.
- `arrayPath` est au singulier dans `ExtractionSchemaBundle` — bloquant pour les documents à
  plusieurs collections (vague 3).

---

## 3. Cible

### 3.1 Le principe

```
la plateforme lit  ·  le produit interprète
```

Grille, plan de lecture, doutes → plateforme. Lot, unité, ICE, quantité → Sektor.
Dépendance à sens unique : Sektor déclare, la plateforme rend.

### 3.2 Le flux

```
fichier
  └─ sonde            pdf quadrillé | pdf texte | tableur | scan
       └─ GRILLE      ← le pivot ; remplace le texte aplati
            └─ résolution du plan   heuristique → cache → ia → vision
                 └─ validateur unique
                      └─ plan retenu      (volet ancres + volet grille)
                           └─ exécution   code déterministe, aucun appel
                                ├─ json typé        objet racine, collections
                                └─ carte des doutes doute d'extraction | manque de la source
                                     └─ relecture  → crée · remplit · crée l'arbre
```

### 3.3 Les six formes visées, et les trois vagues

| Vague | Formes | Portée |
|---|---|---|
| **1 — cet epic** | liste, arbre | les 6 écrans câblés + le bordereau |
| 2 | fiche, tête + lignes | BL, facture, offre fournisseur — ouvre le lecteur d'ancres |
| 3 | matrice, blocs multiples | pointage, comparatif, CPS — quand un écran les réclame |

Règle : **une forme n'entre que quand un écran la réclame.** Ce dépôt a déjà payé deux fois la
construction en spéculation (un parseur XLSX maison supplanté par `smart-import`, `consultation`
qui redoublait `etudes`).

Contrepartie non négociable : les vagues 2 et 3 ne doivent imposer **aucune migration de données**.
Le contrat réserve donc leur place dès le lot 1 — `arrayPaths` au pluriel, volet `ancres` déclaré
mais vide, `dépivotage` nommé et non résolu. Vide, pas absent. (Même logique que D13 de l'epic
étude de prix : une modification de code future est acceptable, une migration ne l'est pas.)

Détail du modèle : [`00-ARCHITECTURE.md`](./00-ARCHITECTURE.md).

---

## 4. Lots

| # | Lot | Intent (1 ligne) | Dépend |
|---|-----|------------------|--------|
| 0 | **Socle grille en plateforme** | Déménager `grid` d'`etudes` vers une capability plateforme ; purger les dettes 2.4 ; 703 articles restent verts | — |
| 1 | **Plan, cascade, cache** | `ReadingPlan` typé (ancres + grille), `PlanResolver` 4 paliers, `PlanValidator` unique, `PlanCache` par empreinte de trame | 0 |
| 2 | **Plan ↔ Definition** | Le plan cible un `dataSchema` : classes de lignes, hiérarchie, sortie plate ou arborescente | 1 |
| 3 | **Carte des doutes** | Deux natures comme contrat d'écran, jamais fusionnées ; les validations métier contribuent des doutes | 2 |
| 4 | **Bascule vague 1** | Forme par forme — `liste` (5 écrans) puis `arbre` (lots de chantier, bordereau) ; LLM en repli | 3 |

Bascule **par forme, pas par écran** : la mesure de la `liste` se fait sur des lignes créées,
celle de l'`arbre` sur l'étalon des 703 articles. Écran par écran, on perdrait les deux.

Les **status / tickets** → [`00-PROGRESS.md`](./00-PROGRESS.md).

---

## 5. Décisions ouvertes

Décisions actées D1–D13 : [`00-ARCHITECTURE.md`](./00-ARCHITECTURE.md) §8.

Quatre questions restent ouvertes, dont **une bloquante avant le lot 1** :

| # | Question | Bloque |
|---|---|---|
| **O1** | Le cache de plans est-il par tenant ou mutualisé entre tenants ? | 🔴 lot 1 |
| O2 | « Devis » = offre fournisseur reçue (`AppelOffreAchat` / `OffreFournisseur`) ? | vague 2 |
| O3 | L'écran de relecture unique tient-il l'arbre à 490 lignes ? | lot 4 |
| O4 | Une définition issue de la découverte vit-elle dans le tenant ou comme candidat éditeur ? | vague 2 |

O1 est bloquante parce qu'elle n'est pas technique : mutualiser le cache fait sortir une empreinte
de mise en page du périmètre d'un tenant. Même famille que la clause CGU du catalogue — à poser
avant le premier client réel, pas après.

---

## 6. UX

- **SSOT canvas** : [`ux/`](./ux/) — à produire au lot 3 (carte des doutes : deux zones distinctes,
  jamais un compteur unique).
- Les composants de relecture existent déjà : `smart-import-data-table`, `smart-import-tree-table`,
  `smart-import-review-dialog`, `smart-import-edit-dialog`. Recenser avant de dessiner.

---

## 7. Liens PM

| Rôle | Id |
|------|-----|
| Feature | ERP-53 |
| Spec / ADR | ce dossier |
| Tasks | — (découpage après validation du PLAN) |

---

### DoD « PLAN prêt »

- [x] Frontmatter complet (`slug` = nom dossier)
- [x] Objectif = flux mince (moteur + bascule vague 1), pas « module complet »
- [x] Lots ordonnés (0 → 4)
- [x] Décisions actées et questions ouvertes liées
- [x] `00-PROGRESS.md` créé en parallèle
