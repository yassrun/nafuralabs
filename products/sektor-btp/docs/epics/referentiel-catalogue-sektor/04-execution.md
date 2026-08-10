# Plan d'exécution — lots parallélisables

> **Règle** : un lot = une session = une PR. Ne jamais enchaîner deux lots dans la même session.
> Les phases de [`02-phases.md`](02-phases.md) sont des **objectifs métier**. Les lots ci-dessous
> sont des **unités de travail** : ils ne se recouvrent pas et se répartissent entre agents.

---

## Le graphe

Ce qui compte n'est pas l'ordre des phases mais celui des **dépendances réelles**. Trois
constats qui débloquent le parallélisme :

- **La phase 1 et la phase 2 ne se croisent pas.** L'une touche `dpgf_noeuds`, l'autre
  `composants_*`. Colonnes différentes, fichiers différents.
- **La phase 4 (unités) ne dépend de rien.** Elle vit dans `item`, pas dans `etudes`.
- **Le chantier V est autonome.** Permissions et validation, aucun lien avec le chiffrage.

```
VAGUE 1  ─ L1 coût de ligne ──┬──────────────► L6 front chiffrage ──┐
         ─ L2 référence typée ┼─► L5 gel prix ─┬─► L9 rattrapage    ├─► L13 aval
         ─ L3 unités ─────────┼─► L7 condition.┤                    │
         ─ L4 validation ─────┼─► L8 avis      │                    │
                              │                └─► L10 ouvrage ─► L12 biblio ─┐
                              └─► L11 comparateur ───────────────────────────┤
                                                                              ▼
                                                            L14 catalogue ─► L15 rapprochement
                                                                              ▼
                                                                          L16 IA
```

---

## Les vagues

### Vague 1 — quatre agents en parallèle, aucune dépendance croisée

| Lot | Titre | Module | Phase |
|---|---|---|---|
| **L1** | Coût de ligne — modèle, calcul, garde-fous, synthèse | `etudes` | 1 |
| **L2** | Référence typée des composants | `etudes` | 2 |
| **L3** | Unités : facteur, unité de base, conversion | `item` | 4 |
| **L4** | Validation à quatre yeux + permissions | `etudes`, seed IAM | V |

> ⚠️ **Point de friction unique** : L1 et L4 touchent tous deux le module `etudes`. L1 travaille
> dans `DpgfService`, `DpuCalculator`, `GatesEtude` ; L4 dans `DossierEtudeService` et le seed
> des rôles. Aucun fichier commun. **Chaque lot crée son propre changelog Liquibase numéroté** —
> ne jamais éditer celui d'un autre lot.

### Vague 2

| Lot | Titre | Dépend de |
|---|---|---|
| **L5** | Gel du prix + branchement `ResolutionPrixService` | L2 |
| **L6** | Front du chiffrage — sélecteur d'origine, 3 lignes, synthèse | L1 |
| **L7** | Conditionnement fournisseur + typage des références | L3 |
| **L8** | Avis d'exécution | L4 |

### Vague 3

| Lot | Titre | Dépend de |
|---|---|---|
| **L9** | Rattrapage, création d'article allégée, `hors_referentiel` | L5 |
| **L10** | Ouvrage composite : récursion + garde anti-cycle | L2, **PR2 codification** |
| **L11** | Comparateur fournisseurs + écran | L7 |

### Vague 4

| Lot | Titre | Dépend de |
|---|---|---|
| **L12** | Bibliothèque : capitalisation + chargement du corpus | L10 |
| **L13** | Chaînage aval : devis, chantier, marché, budget | L1, L5 |

### Vague 5 — après **PR1 (clause CGU)**

| Lot | Titre | Dépend de |
|---|---|---|
| **L14** | Module `catalogue` : entités, éditions, gouvernance, console | L11, L12, PR1 |
| **L15** | Rapprochement déterministe + `item_match` | L14 |

### Vague 6

| Lot | Titre | Dépend de |
|---|---|---|
| **L16** | Intelligence : ports réels, LLM en dernier recours, enrichissement | L15 |

---

## En-tête commun

À placer en tête de **chaque** prompt d'agent.

```
Tu es l'agent d'implémentation du monorepo nafuralabs (ERP Sektor-BTP).

AVANT DE COMMENCER, lis dans cet ordre :
1. docs/AGENTS.md — conventions du monorepo (impératif)
2. products/sektor-btp/docs/epics/referentiel-catalogue-sektor/00-INDEX.md
3. products/sektor-btp/docs/epics/referentiel-catalogue-sektor/01-modele-cible.md
4. products/sektor-btp/docs/epics/referentiel-catalogue-sektor/02-phases.md (ta phase)
5. products/sektor-btp/docs/epics/referentiel-catalogue-sektor/05-ux.md (si ton lot a du front)

RÈGLES ABSOLUES

R0. AVANT de créer une entité, un service ou un module, RECENSE l'existant dans
    item, achats, stock, partner, currency, marches, chantiers, etudes.
    Ce dépôt a déjà produit DEUX doublons majeurs. En cas de doute : demande, ne crée pas.

R1. Invariant de prix — ne jamais le rompre :
      composant.rendement  = quantité PAR UNITÉ d'ouvrage (ex. 350 kg/m³)
      coutUnitaire         = Σ(rendement × prixUnitaire)   → coût pour UNE unité
      coutRevient          = coutUnitaire × (1 + FG%)
      prixUnitaire (vente) = coutRevient  × (1 + marge%)
      DpgfNoeud.total      = quantite × prixUnitaire
    La quantité du bordereau n'intervient QU'AU niveau total.

R2. Ne modifie PAS la formule de DpuCalculator.computePrixVenteHt() — validée par
    l'expert métier et vérifiée sur 84 ouvrages réels (écart max 0,008 DH).
    Le corpus DpuCalculatorCorpusReelTest doit rester vert. C'est ton filet.

R3. FRONT — écris UNIQUEMENT dans web/app/applications/erp/.
    products/sektor-btp/web/app/ est du code mort, non compilé, malgré docs/AGENTS.md:183.

R4. Aucune valeur métier en dur (taux, seuils) : paramètres tenant.
    Aucun message utilisateur en dur en Java : clé i18n.
    Tout montant persisté porte une devise.

R5. Métier uniquement sous products/sektor-btp/ — jamais dans platform/.

R6. Changement SQL → changelog Liquibase versionné, DANS TON PROPRE FICHIER NUMÉROTÉ.
    N'édite jamais le changelog d'un autre lot. Jamais de DDL ad hoc.

R7. NE JAMAIS BLOQUER L'UTILISATEUR sur une donnée manquante ou imparfaite.
    Un garde-fou avertit, liste les lignes fautives et donne un lien direct.
    Il ne grise pas un bouton en silence. (Défaut UX connu de canProceed().)

R8. TOUT PRIX AFFICHÉ PORTE SA SOURCE ET SA DATE.
    « 1,20 DH — catalogue Lafarge, 12/06/2026 », jamais un nombre nu.

R9. Le module catalogue ne référence JAMAIS une table portant tenant_id.
    Aucune FK sortante. Les liens se font par clé stable (chaîne).

MÉTHODE
- Lis le code existant concerné AVANT d'écrire quoi que ce soit.
- Si une spec te paraît fausse ou incomplète, ARRÊTE-TOI et signale-le.
  Ne comble jamais un trou par une invention.
- Gradle ne démarre pas sur cette machine (Selector.open / loopback).
  Compile et lance JUnit à la main — recette dans les notes projet.
- À la fin : coche les critères d'acceptation dans 02-phases.md et alimente le
  journal d'implémentation.
- Ne commit pas, ne push pas sans qu'on te le demande.
```

---

## Les lots, un par un

Format : **périmètre / interdit / fini quand**.

### L1 — Coût de ligne

**Périmètre** — `etudes` backend. `DpgfNoeud` (suppression `mode`, renommage
`prixFourniBase` → `coutUnitaire`, ajout `origineCout`, `coutRevient`, `estimationSaisieEn`,
`coutDeduit`, `forfaitPartnerId`, `forfaitOffreId`) ; constantes `MODE_*` de `PrixDpu` ;
calcul unifié ; `GatesEtude` étapes 3-4-5 ; projection `SyntheseCoutAffaire` + endpoint.

**Interdit** — toucher au front (c'est L6), à `composants_*` (c'est L2), à
`DossierEtudeService` (c'est L4), à la formule de `computePrixVenteHt`.

**Fini quand** — critères de la phase 1 cochés, sauf ceux marqués front.

### L2 — Référence typée des composants

**Périmètre** — `etudes` backend. `ComposantDpu` et `ComposantOuvrage` : suppression des
`VARCHAR(100)`, ajout `referenceType` / `itemId` / `ouvrageId` / `libelle`, contrainte
d'exclusivité **en base**, index partiels. Adaptation de tous les appelants.

**Interdit** — le gel des prix (c'est L5), la récursion ouvrage (c'est L10), `DpgfNoeud`.

**Fini quand** — aucune référence article en `VARCHAR` dans `etudes` ; la contrainte
d'exclusivité est vérifiée par la base, pas seulement par Java.

### L3 — Unités

**Périmètre** — `item`. `unit_of_measure` : `facteurVersBase`, `estBase`. Contrainte : une
seule unité de base par catégorie et par tenant. Service de conversion **strictement
intra-catégorie**, échec explicite sinon.

**Interdit** — toucher à `achats` (c'est L7). Créer un second système d'unités.

**Fini quand** — litres → m³ fonctionne ; litres → heures échoue avec un message clair ;
une catégorie sans unité de base est refusée à la création.

### L4 — Validation à quatre yeux

**Périmètre** — `etudes` + seed IAM. Suppression des jokers `etude.*`, permissions énumérées,
`etude.avis`. Table `dossier_intervenant`. Règle : un `CHARGE_ETUDE` ou `REVISEUR` ne peut pas
approuver. Câblage du seuil de montant sur `approbations`.

**Interdit** — l'avis d'exécution lui-même (c'est L8). Réécrire le circuit existant : il
fonctionne, on le corrige.

**Fini quand** — les critères du chantier V hors avis sont cochés.

### L5 → L16

Périmètre défini par la phase correspondante dans [`02-phases.md`](02-phases.md), avec la même
discipline : un lot ne touche jamais le périmètre d'un autre lot de la même vague.

---

## Ce qui n'est pas parallélisable, et pourquoi

| Ne pas paralléliser | Raison |
|---|---|
| L1 et L6 (back / front du chiffrage) | Le contrat d'API doit être figé avant l'écran |
| L2 et L5 | L5 ajoute des colonnes sur des entités que L2 restructure |
| L10 et L12 | La capitalisation suppose la récursion en place |
| L14 et L15 | Le rapprochement vise des tables que L14 crée |

## Ce qui peut démarrer aujourd'hui, sans rien attendre

**L3 (unités)** — zéro dépendance, module isolé, critères mesurables. C'est le meilleur lot
pour calibrer un agent sur ce dépôt avant de lui confier `etudes`.

**PR2 (codification)** — arbitrage métier, hors code, bloque L10. À lancer en parallèle de la
vague 1 pour qu'il soit prêt à la vague 3.
