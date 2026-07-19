# Architecture cible — Étude de prix unifiée

## 1. Invariant fondamental : la chaîne de prix

Tout le module repose sur cette chaîne. **Aucune implémentation ne doit la rompre.**

```
composant.rendement        = quantité PAR UNITÉ d'ouvrage   (ex. 350 kg/m³)
composant.total            = rendement × composant.prixUnitaire

PrixDpu.deboursSec         = Σ(composant.total)              → coût pour UNE unité
        coûtDeRevient      = deboursSec × (1+FG%)            → base de la marge (D15)
PrixDpu.prixVenteHt        = coûtDeRevient × (1+marge%)      → PU de vente
                           = deboursSec × (1+FG%) × (1+marge%)
PrixDpu.prixVenteTtc       = prixVenteHt × (1+TVA%)

DpgfNoeud.prixUnitaire     = PrixDpu.prixVenteHt             (report)
DpgfNoeud.total            = DpgfNoeud.quantite × prixUnitaire → montant de la ligne
```

**Le point critique** : `deboursSec` et `prixVenteHt` sont **unitaires**. La quantité du bordereau
(70 m³) n'intervient **qu'une seule fois**, au niveau `DpgfNoeud.total`.

**Extension récursive** (décision D9) — un composant peut être un autre ouvrage :

```
deboursé(ouvrage) = Σ composants :
    si ITEM     → rendement × prixUnitaire(item)
    si OUVRAGE  → rendement × deboursé(sous-ouvrage)     [récursion, PAS son prix de vente]
```

FG et marge ne s'appliquent **qu'une fois, au sommet**. Prendre le prix de vente d'un sous-ouvrage
produirait de la marge sur marge, invisible et non auditable. Seule exception : la sous-traitance,
via le drapeau `inclureFraisEtMarge`. Détail dans `04-decomposition-bibliotheque.md` §T4.2bis.

Cette sémantique est déjà correcte dans `etudes` :
- `ComposantOuvrage.rendement` porte le ratio
- `DpuService.importFromOuvrageDetail()` le copie dans `ComposantDpu.quantite`
- `DpuCalculator` calcule sans jamais multiplier par la quantité du bordereau

Elle est **cassée dans `consultation`**, qui a renommé `rendement` en `quantiteIndicative`/`quantite`
sans conserver le sens, puis fait `montant = quantité × prixVenteHt` côté front alors que le back
sommait des quantités absolues. Erreur d'un facteur égal à la quantité de l'article.

> **Dette de nommage à corriger** : `ComposantDpu.quantite` devrait s'appeler `rendement`.
> Le champ porte un rendement mais son nom dit « quantité », ce qui est précisément l'ambiguïté
> qui a causé la dérive de `consultation`. Renommage traité en lot 1.

---

## 2. Modèle de données cible

### 2.1 Agrégat orchestrateur (nouveau)

`consultation` cède ses entités de données mais garde son rôle : piloter le parcours.
L'entité `Consultation` devient `DossierEtude`, un agrégat mince qui ne stocke **aucune donnée
de prix** — il pointe vers `Dpgf`.

```java
// module etudes — ma.nafura.etudes.domain.model.DossierEtude
class DossierEtude {
    UUID   id;
    UUID   tenantId;
    String numero;                 // DE-0001
    String objet;

    // Sources
    String cpsDocumentId;
    String bordereauDocumentId;
    UUID   appelOffreClientId;     // origine, optionnel

    // Contenu — délégué
    UUID   dpgfId;                 // le bordereau structuré + chiffré

    // Parcours
    Integer currentStep;           // 1..5
    String  status;                // cf. §3

    // Paramètres d'étude (valeurs par défaut appliquées aux nouveaux PrixDpu)
    BigDecimal fraisGenerauxPercentDefaut;
    BigDecimal margePercentDefaut;
    BigDecimal tvaTauxDefaut;

    // Aval
    UUID   devisGenereId;

    // Audit — obligatoire, absent du modèle actuel
    String  createdBy;
    String  updatedBy;
    @Version Long version;         // verrou optimiste
    OffsetDateTime createdAt, updatedAt;
}
```

### 2.2 Entités réutilisées (existantes, module `etudes`)

| Entité | Rôle | Modifications requises |
|---|---|---|
| `Dpgf` | Le bordereau | — |
| `DpgfNoeud` | LOT / SOUS_LOT / ARTICLE | + `descriptif` (text), + `mode` (FOURNI/DECOMPOSE), + `prixDpuId` |
| `PrixDpu` | Sous-détail de prix d'un article | + `dpgfNoeudId` (aujourd'hui lié à `ouvrageId` seulement) |
| `ComposantDpu` | Ligne de décomposition | renommer `quantite` → `rendement` ; + `sourcePrix`, + `offreFournisseurId` ; + `natureComposant` / `ouvrageRefId` (D9) |
| `Ouvrage` / `ComposantOuvrage` | Bibliothèque de prix | + `natureComposant`, `ouvrageRefId`, `inclureFraisEtMarge` (D9) |
| `DpuVersion` | Historique de chiffrage | — |
| `Devis` | Sortie commerciale | — (a déjà `dpgfId`, `chantierGenereId`) |

### 2.3 Référentiel et achats : à réutiliser, pas à recréer

**Aucune entité nouvelle.** Tout existe déjà :

| Besoin | Entité existante | Module |
|---|---|---|
| Article élémentaire (ciment, MO, location) | `Item` | `item` |
| Tarif daté par type et devise | `ItemPrice` *(champ `priceType` mort — à activer)* | `item` |
| Article composé (béton B35, cloison) | `Ouvrage` + `ComposantOuvrage` | `etudes` |
| Prix par couple article ↔ fournisseur | `CatalogueFournisseurLigne` *(sans date — à enrichir)* | `achats` |
| Demande de prix aux fournisseurs | `AppelOffreAchat` + `AppelOffreLigne` | `achats` |
| Offre reçue | `OffreFournisseur` + `OffreFournisseurLigne` | `achats` |
| Suite du cycle | `BonCommandeAchat`, `ReceptionAchat`, `FactureFournisseur` | `achats` |
| Valorisation stock (PMP) | `Item.pmp`, `StockBalance`, `CostingMethod` | `item`, `stock` |
| Fournisseurs | `Partner` + `PartnerRole` | `partner` |
| Devises | module dédié | `currency` |

Le **lot 9** corrige et connecte ce référentiel ; le **lot 5** branche le chiffrage sur `achats`.

**Distinction structurante** :

| | `Item` — élémentaire | `Ouvrage` — composé |
|---|---|---|
| On l'achète | ✅ | ❌ (sauf sous-traitance) |
| On le stocke | ✅ | ❌ |
| Composé de | rien | des `Item` et/ou d'autres `Ouvrage` (D9) |
| Son prix vient de | fournisseurs / PMP — **référentiel** | calcul déboursé → FG → marge — **résultat** |

Dans le bordereau, le mode fait le pont : ARTICLE **FOURNI** → pointe un `Item` ;
ARTICLE **DECOMPOSE** → instancie un `Ouvrage`.

> **D10 — le prix de vente d'un ouvrage n'est jamais un tarif stocké.** FG et marge varient par
> affaire : le même béton B35 se vend 670 DH sur un marché public serré et 780 DH sur un privé. Ce
> qui se capitalise en bibliothèque, ce sont les **rendements** (stables dans le temps) et un prix
> indicatif **daté**.

### 2.4 Provenance du prix (nouveau, structurant)

```java
enum SourcePrix {
    CONSULTE,      // offre fournisseur retenue sur l'affaire   ← la cible
    CONTRAT,       // contrat fournisseur en cours
    CATALOGUE,     // catalogue fournisseur en validité
    TARIF,         // ItemPrice ACHAT_STANDARD
    HISTORIQUE,    // dernière facture fournisseur
    PMP,           // prix moyen pondéré du stock
    BIBLIOTHEQUE,  // repris d'un Ouvrage type
    MANUEL         // saisi à la main
}
```

Ces valeurs sont la **hiérarchie de résolution** appliquée par `ResolutionPrixService`
(lot 9 T9.5). L'UI affiche toujours la source et sa date : « 1,20 DH — catalogue Lafarge,
12/06/2026 ».

Sans ce champ, aucun moyen de savoir si un chiffrage repose sur des prix réels ou estimés.
C'est aussi le signal d'apprentissage dont l'IA aura besoin en phase 4.

---

## 3. Machine à états

```
BROUILLON ──────────────► EN_ETUDE ──────────► EN_VALIDATION
    │                        │  ▲                    │
    │                        │  └── retour N+1 ──────┤ (refus)
    │                        ▼                       ▼
    └──► ANNULE ◄──────────  ...                 VALIDEE
                                                     │
                                                     ▼
                                               DEVIS_GENERE
                                                     │
                                          ┌──────────┴──────────┐
                                          ▼                     ▼
                                       GAGNE                  PERDU
                                          │
                                          ▼
                                    CONVERTIE (chantier + marché créés)
```

**Règles de transition**

| Transition | Condition | Permission |
|---|---|---|
| `BROUILLON → EN_ETUDE` | ≥ 1 article dans le bordereau | `etude.update` |
| `EN_ETUDE → EN_VALIDATION` | les 5 gates d'étape passent | `etude.submit` |
| `EN_VALIDATION → VALIDEE` | via module `approbations` | `etude.approve` (≠ auteur) |
| `EN_VALIDATION → EN_ETUDE` | refus, avec motif obligatoire | `etude.approve` |
| `VALIDEE → DEVIS_GENERE` | devis créé | `devis.create` |
| `GAGNE → CONVERTIE` | chantier + marché créés | `chantier.create` |

**Statuts verrouillés en écriture** : `EN_VALIDATION`, `VALIDEE`, `DEVIS_GENERE`, `GAGNE`, `PERDU`, `CONVERTIE`, `ANNULE`.

> ⚠️ Le code actuel a `ConsultationService.validate()` **sans aucun garde-fou** : pas de vérification
> du statut de départ, et même permission `consultation.update` que le rédacteur — l'auteur valide
> sa propre étude. À corriger en lot 6.

---

## 4. Les 5 étapes du wizard et leurs gates

| # | Étape | Objet produit | Gate de sortie |
|---|---|---|---|
| 1 | **Bordereau** | `Dpgf` + `DpgfNoeud` | ≥ 1 ARTICLE ; tout ARTICLE a unité + quantité > 0 |
| 2 | **Descriptifs** | `DpgfNoeud.descriptif` | *avertissement* si < 80 % des articles ont un descriptif (non bloquant) |
| 3 | **Décomposition** | `PrixDpu` + `ComposantDpu` | chaque ARTICLE est FOURNI, ou DECOMPOSE avec ≥ 1 composant à rendement > 0 |
| 4 | **Consultation fournisseurs** | `DemandePrix` / `OffreFournisseur` | *avertissement* si des composants restent en `sourcePrix = MANUEL` (non bloquant) |
| 5 | **Chiffrage** | FG, marge, TVA → PU | tout ARTICLE a FG, marge, TVA renseignés et `prixVenteHt > 0` |

**Principe** : les étapes 2 et 4 sont **non bloquantes**. Une étude peut être chiffrée sans descriptif
complet ni consultation fournisseur — c'est courant en avant-vente sous contrainte de délai. Elles
produisent un avertissement visible, pas un blocage.

**Règle d'ergonomie** : quand un gate échoue, l'UI doit afficher **la liste des articles fautifs
avec un lien direct**, pas un bouton grisé sans explication. Le comportement actuel (`canProceed()`
désactive « Suivant » en silence) est un défaut UX identifié.

---

## 5. Décisions actées

| # | Décision | Justification |
|---|---|---|
| D1 | Le modèle de données vit dans `etudes` ; `consultation` est supprimé | `etudes` est plus complet et métier-correct (rendements, TVA, bibliothèque, versioning) |
| D2 | Les quantités de composants sont des **rendements par unité d'ouvrage** | Déjà la sémantique de `ComposantOuvrage.rendement` ; seule lecture cohérente avec `DpgfNoeud.total` |
| D3 | Le wizard passe de 3 à 5 étapes | Colle au process réel décrit par l'expert métier ; donne une cible nette par étape pour l'IA |
| D4 | La bibliothèque d'ouvrages est alimentée dès le lot 4 | Prérequis à l'assistance IA : sans corpus de rendements validés, un agent hallucine |
| D5 | Tout prix porte une `sourcePrix` | Traçabilité métier + signal d'apprentissage |
| D6 | La validation passe par le module `approbations` | Il existe déjà (matrice de pouvoir) et n'est pas branché |
| D7 | Audit (`createdBy`/`updatedBy`) + `@Version` sur tous les agrégats | Aucune traçabilité aujourd'hui ; écrasements silencieux à deux utilisateurs |
| D8 | Les ports d'extraction sont conservés et étendus | Points d'ancrage IA déjà en place, en NoOp |
| D9 | Un ouvrage peut contenir un autre ouvrage ; on remonte son **déboursé**, pas son prix de vente | Cas réel (cloison → mortier) ; éviter la marge sur marge |
| D10 | Le référentiel de prix d'achat vit dans `item` + `achats` ; le prix de vente d'un ouvrage est **calculé, jamais stocké comme tarif** | FG/marge varient par affaire — un tarif de vente serait faux dès la 2ᵉ étude |
| D11 | La consultation fournisseurs réutilise `AppelOffreAchat` / `OffreFournisseur` de `achats` | Le cycle achat existe déjà et est complet — ne pas refaire le doublon |
| D12 | Chiffrage au **prix du marché** par défaut, PMP en avant-dernier recours, `basePrixChiffrage` paramétrable | Une étude est prospective ; le PMP est rétrospectif |
| D13 | **Périmètre Maroc uniquement.** L'architecture évite seulement les choix qui imposeraient une *migration de données* future ; une modification de code future est acceptable | Ne pas sur-construire, ne pas se verrouiller — cf. lot 10 |
| D14 | FG et marge sont portés **par article** ; l'héritage tenant → étude n'est qu'une commodité de saisie | Q1 — l'article du bordereau est l'unité de chiffrage |
| D15 | `prix de vente = déboursé × (1+FG%) × (1+marge%)` — marge sur le **coût de revient**. Formule inchangée | Q2 — confirmé par l'expert métier ; c'est déjà ce qu'implémente `DpuCalculator` |
| D16 | Marché et chantier créés **atomiquement**, présentés « le marché puis son chantier ». `ContratMarche.chantierId` reste `NOT NULL` | Q3 — pas de migration pour un besoin couvrable par du code |
| D17 | Aucune reprise des données `consultation` — suppression des tables | Q6 — pas de production, données sans valeur ; supprime le risque des rendements ambigus |

## 6. Décisions en attente

Voir `99-questions-ouvertes.md`. **Aucune question ne bloque plus un lot fonctionnel.**

Reste un **chantier préalable** hors epic :
- **Q5** — réconcilier les deux arbres front. Le build ne compile que `web/app/applications/erp/`,
  alors que `docs/AGENTS.md:183` désigne `products/sektor-btp/web/app/` comme source. Les deux ont
  divergé, chacun avec du contenu unique. À traiter avant le lot 2, comme opération de
  réorganisation séparée du développement fonctionnel.

Questions restantes non bloquantes : Q4 (FG dans le budget chantier, lot 7), Q7 (correspondance du
type `SERVICE` — devenue sans objet suite à Q6), Q8 et Q9 (aléas, coefficient K, FG chantier vs
siège — hors périmètre).

---

## 7. Ports d'extraction (ancrage IA — phase ultérieure)

Conservés depuis `consultation`, déplacés dans `etudes`, tous en `NoOp` jusqu'à la phase IA :

| Port | Étape | Entrée → Sortie |
|---|---|---|
| `BordereauExtractionPort` | 1 | fichier → arbre `Dpgf` |
| `CpsDescriptifExtractionPort` | 2 | fichier + refs articles → descriptifs |
| `DecompositionSuggestionPort` | 3 | article + descriptif → composants avec rendements |
| `CatalogResolverPort` | 3 | désignation → article catalogue `item` |
| `FournisseurSuggestionPort` | 4 | composant → fournisseurs pertinents *(nouveau)* |

**Contrat impératif** : une suggestion IA n'est jamais persistée directement. Elle est proposée,
l'utilisateur valide, et la validation est tracée (`sourcePrix`, `suggereParIa: boolean`).
