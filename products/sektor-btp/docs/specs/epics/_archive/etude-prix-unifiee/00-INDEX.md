# Epic — Étude de prix unifiée

**Statut** : lots 9, 1, 8, 2 (backend) et 3 livrés — voir `00-PROGRESS.md`
**Périmètre** : `products/sektor-btp/backend/modules/{etudes,item,achats}`, `products/sektor-btp/web/app/pages/etudes/`
**Objectif** : unifier les modules `consultation` et `etudes` en un parcours d'étude de prix unique, verrouillé manuellement, prêt à recevoir l'assistance IA.

---

## Le problème

L'ERP contient **deux implémentations concurrentes du même métier** :

| `consultation` (2 235 lignes) | `etudes` (6 522 lignes) |
|---|---|
| `ConsultationNoeud` (LOT/SOUS_LOT/POSTE) | `DpgfNoeud` (LOT/SOUS_LOT/ARTICLE) |
| `ConsultationComposant` | `ComposantDpu` |
| déboursé/FG/marge sur le nœud | `PrixDpu` (+ TVA, + TTC) |
| — | `Ouvrage` / `ComposantOuvrage` (bibliothèque) |
| — | `DpuVersion` (versioning) |
| — | `Metre`, `AppelOffreClient`, `Devis` |
| **wizard 3 étapes + gates** | — |
| **4 ports d'extraction (NoOp)** | — |

Origine : le socle a été généré sans validation métier ; `consultation` est une réécriture appauvrie de `etudes`. Ce n'est pas un choix d'architecture à préserver.

**Conséquence directe** : `consultation` a perdu la notion de **rendement** (quantité de composant *par unité d'ouvrage*), ce qui rend son calcul de prix faux — voir `01-fusion-modele.md`.

## La cible

`etudes` garde le modèle de données. `consultation` cède ses entités et apporte ce qu'il a de bon : le **parcours en étapes**. Le résultat est un **dossier d'étude** qui orchestre les briques `etudes` existantes selon un wizard en 5 étapes.

```
Marché entrant (CPS + bordereau)
   → 1. Documents du marché      (DossierDocument + CpsDocument + CpsSection indexées)
   → 2. Bordereau structuré      (Dpgf + DpgfNoeud)
   → 3. Décomposition            (PrixDpu + ComposantDpu ; le CPS est interrogé ICI)
   → 4. Consultation fournisseurs (branchée sur achats — remplit les prix unitaires)
   → 5. Chiffrage                (FG + marge + TVA → PU)
   → Validation N+1              (module approbations)
   → Devis                       (etudes/Devis)
   → si gagné : Chantier + Marché + budget prévisionnel
```

---

## Ordre de lecture

| # | Document | Contenu |
|---|---|---|
| 00 | [ARCHITECTURE](00-ARCHITECTURE.md) | Modèle cible, décisions actées, invariants |
| 00 | [PRIORITIES](00-PRIORITIES.md) | Ordre des lots et dépendances |
| 00 | [PROGRESS](00-PROGRESS.md) | Suivi d'avancement |
| 09 | [Référentiel articles & prix](09-referentiel-articles-prix.md) | **À exécuter en premier** — `item`, `achats`, résolution de prix |
| 01 | [Fusion du modèle](01-fusion-modele.md) | Supprimer le doublon, migrer vers `etudes` |
| 02 | [Dossier d'étude & wizard](02-dossier-etude-wizard.md) | L'agrégat orchestrateur, machine à états |
| 03 | [Documents & CPS indexé](03-import-bordereau-cps.md) | Dépôt des pièces, découpage du CPS, recherche par article |
| 04 | [Décomposition & bibliothèque](04-decomposition-bibliotheque.md) | Rendements, ouvrages composites, capitalisation |
| 05 | [Branchement sur `achats`](05-consultation-fournisseurs.md) | Appel d'offres, comparatif, report des prix |
| 06 | [Chiffrage & validation](06-chiffrage-validation.md) | FG/marge/TVA, approbations |
| 07 | [Chaînage aval](07-chainage-aval.md) | Devis → Chantier + Marché + budget |
| 08 | [Migration des données](08-migration-donnees.md) | Liquibase, reprise de l'existant |
| 10 | [Ne pas se fermer de portes](10-genericite-multitenant.md) | 6 règles **transverses** — périmètre Maroc, sans verrou de schéma |
| 11 | [Sources métier](11-SOURCES-METIER.md) | **S'en inspirer sans les copier** — retenu / non retenu par source |
| 99 | [Questions ouvertes](99-questions-ouvertes.md) | À trancher avec l'expert métier |

> Le numéro d'un lot est un **identifiant**, pas un rang. L'ordre d'exécution est dans
> `00-PRIORITIES.md`.

---

## Glossaire métier

| Terme | Définition |
|---|---|
| **CPS** | Cahier des Prescriptions Spéciales — décrit techniquement chaque article (ex. la composition du « béton B35 ») |
| **Bordereau de prix / DPGF** | Liste hiérarchisée lots → articles, avec quantités et unités, à chiffrer |
| **Article / Poste** | Une ligne d'ouvrage du bordereau (ex. « Béton armé en infrastructure », 70 m³) |
| **Décomposition / DPU** | Sous-détail de prix unitaire : les composants d'un article |
| **Rendement** | Quantité de composant **par unité d'ouvrage** (ex. 350 kg de ciment **par m³**) — ⚠️ pas une quantité absolue |
| **Article élémentaire** (`Item`) | Ce qui s'achète et se stocke : ciment, sable, heure de maçon, location d'engin |
| **Ouvrage** | Article **composé** : béton B35 mis en œuvre, m² de cloison. Composé d'`Item` et/ou d'autres `Ouvrage` |
| **PMP** | Prix moyen pondéré — valorisation du stock. Rétrospectif : sert au contrôle de gestion, pas au chiffrage |
| **Coût de revient** | Déboursé sec **après** application des frais généraux : `déboursé × (1 + FG%)`. C'est la base sur laquelle s'applique la marge |
| **Déboursé sec** | Coût direct = Σ(rendement × prix unitaire du composant) |
| **FG** | Frais généraux, en % du déboursé sec |
| **Marge** | Bénéfice, en % |
| **PU HT** | Prix unitaire de vente hors taxes de l'article |
| **DDP** | Demande de prix envoyée à un fournisseur |

---

## Règles pour l'agent d'implémentation

0. **Avant de créer quoi que ce soit, recenser l'existant.**
   Backend : `item`, `achats`, `stock`, `partner`, `currency`, `marches`, `chantiers`, `etudes`.
   Front : `platform/features/documents/smart-import` (import piloté par schéma, déjà branché
   IA), `shared/extraction-schemas`, `shared/smart-import/handlers`, `platform/lib/anatomy`.

   Ce dépôt a déjà produit **trois** faux départs de ce type : `consultation` réécrivant
   `etudes` ; une première version du lot 5 recréant `AppelOffreAchat` ; et un parseur XLSX
   maison (`bpde-lot-import.util.ts`) supplanté par `smart-import`.
   En cas de doute, demander plutôt que créer.
1. **Ne jamais réintroduire d'entité `Consultation*` de données.** Le modèle de données vit dans `etudes`.
2. **`rendement` = par unité d'ouvrage.** Toute quantité de composant est un rendement. Voir `01-fusion-modele.md` §Invariant de prix.
3. Respecter `docs/AGENTS.md` : métier sous `products/sektor-btp/`, jamais dans `platform/`.
4. **Front — le chantier `front-ownership` est terminé.** Le code Sektor vit désormais dans
   `products/sektor-btp/web/app/` (alias `@app/*`), la plateforme dans `platform/web/`
   (`@core`, `@lib`, `@platform`). `web/` n'existe plus. **La plateforme n'importe jamais une
   application** — règle ESLint dans `products/sektor-btp/web/.eslintrc.json`.
5. Toute modification SQL passe par un changelog Liquibase versionné + `release-backend`.
5bis. **Sektor est multi-tenant.** Une pratique observée chez un tenant s'ajoute comme
   **capacité optionnelle** (champ nullable, défaut neutre), jamais comme contrainte. Ses
   **valeurs** restent dans les tests, jamais dans un défaut ni un seed.
   Voir [`11-SOURCES-METIER.md`](11-SOURCES-METIER.md).
6. Un lot = une PR. Ne pas mélanger les lots.
