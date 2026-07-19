# Lot 9 — Référentiel articles et prix

**Ordre d'exécution : PREMIER.** (Le numéro est un identifiant, pas un rang — voir `00-PRIORITIES.md`.)

**Objectif** : assainir le référentiel article / fournisseur / prix, et poser le service de
résolution de prix dont dépendent tous les autres lots.

**Modules touchés** : `item`, `achats`, `stock`, `currency`.

---

## Ce qui existe déjà

| Module | Entité | État |
|---|---|---|
| `item` | `Item` | ✅ complet — `code`, `articleType`, `unitOfMeasureId`, `pmp`, `prixUnitaire`, stock min/max, `delaiReapproJours` |
| `item` | `ItemPrice` | ⚠️ `priceType`, `unitPrice`, `minQuantity`, `effectiveFrom/To`, `currencyId` — **jamais lu ni écrit** |
| `item` | `ItemCategory`, `ItemType`, `UnitOfMeasure`, `UoMCategory` | ✅ |
| `achats` | `CatalogueFournisseurLigne` | ⚠️ fournisseurId, articleId, refFournisseur, prixUnitaireHt, uom, actif — **sans date ni devise** |
| `achats` | `ContratFournisseur`, `FactureFournisseur` | ✅ sources de prix réels |
| `stock` | `StockBalance`, `CostingMethod` | ✅ |
| `partner` | `Partner` + `PartnerRole` | ✅ |
| `currency` | module dédié | ✅ à utiliser |

**Rien n'est à créer de zéro.** Ce lot corrige et connecte.

---

## Les trois défauts à corriger

### D1 — `ItemPrice.priceType` est une intention non terminée

Le champ et la colonne existent. Aucune constante n'est définie, aucun service ne l'écrit ni ne le
lit. Idem pour `Item.articleType` : chaîne libre sans valeurs normalisées.

### D2 — Trois prix concurrents sur `Item`

`Item.prixUnitaire`, `Item.pmp`, `ItemPrice.unitPrice`. Rien n'indique lequel fait foi.
C'est le même piège que `quantite` / `rendement` (lot 1) : un champ dont le nom ne dit pas le sens.

### D3 — Un prix fournisseur sans date n'est pas exploitable

`CatalogueFournisseurLigne` ne porte ni validité, ni devise, ni remise, ni quantité minimale, ni
délai. Impossible de savoir si un prix date de 2024 ou de la semaine dernière.

---

## Tâches

### T9.1 — Normaliser la nature d'article

```java
public final class ArticleType {
    public static final String MATIERE        = "MATIERE";        // ciment, sable, acier
    public static final String CONSOMMABLE    = "CONSOMMABLE";    // petit outillage
    public static final String MATERIEL       = "MATERIEL";       // engins (→ Materiel)
    public static final String MAIN_DOEUVRE   = "MAIN_DOEUVRE";   // heures de personnel
    public static final String SERVICE        = "SERVICE";        // prestation externe
    public static final String SOUS_TRAITANCE = "SOUS_TRAITANCE";
}
```

Ces valeurs doivent correspondre aux types de `ComposantDpu` — c'est le point de jonction entre le
catalogue et la décomposition. Aligner les deux tables de correspondance dans une seule classe
utilitaire, pas dans un `switch` dupliqué.

### T9.2 — Clarifier les trois prix

| Champ | Sens retenu | Action |
|---|---|---|
| `Item.pmp` | Prix moyen pondéré — **valorisation du stock**, alimenté par `stock` | ✅ garder, documenter |
| `ItemPrice` | Référentiel tarifaire **daté**, par type et par devise | ✅ garder, activer |
| `Item.prixUnitaire` | ??? — doublon dangereux | ⚠️ voir ci-dessous |

**`Item.prixUnitaire`** : à déprécier, pas à supprimer brutalement (des données existent peut-être).
Procédure : marquer `@Deprecated` + commentaire, migrer les valeurs non nulles vers un `ItemPrice` de
type `ACHAT_STANDARD`, puis supprimer la colonne dans un changelog ultérieur.

```java
public final class PriceType {
    public static final String ACHAT_STANDARD = "ACHAT_STANDARD"; // tarif d'achat de référence
    public static final String VENTE          = "VENTE";          // si le tenant fait du négoce
    public static final String TRANSFERT      = "TRANSFERT";      // inter-sociétés
}
```

> **`VENTE` est conservé** même si l'usage principal (entreprise de travaux) ne vend pas d'articles
> seuls. L'ERP est un SaaS générique : un tenant négociant en matériaux en aura besoin. Il est
> activé par le paramètre tenant `venteArticlesActivee` (voir `10-genericite-multitenant.md`).
> Quand il est désactivé, l'UI masque simplement la notion — le modèle reste capable.

### T9.3 — Enrichir le catalogue fournisseur

```sql
ALTER TABLE catalogue_fournisseur_lignes
  ADD COLUMN currency_id      UUID REFERENCES currencies(id),
  ADD COLUMN valid_from       DATE NOT NULL DEFAULT CURRENT_DATE,
  ADD COLUMN valid_to         DATE,
  ADD COLUMN remise_percent   NUMERIC(8,4) NOT NULL DEFAULT 0,
  ADD COLUMN quantite_min     NUMERIC(18,4),
  ADD COLUMN delai_jours      INT,
  ADD COLUMN source           VARCHAR(20) NOT NULL DEFAULT 'SAISIE_MANUELLE',
  ADD COLUMN source_ref_id    UUID,      -- offre / facture / contrat d'origine
  ADD COLUMN incoterm         VARCHAR(20);

CREATE INDEX cat_fourn_lookup_idx
  ON catalogue_fournisseur_lignes (tenant_id, article_id, valid_from DESC)
  WHERE actif = true;
```

`source` ∈ `SAISIE_MANUELLE` | `OFFRE_RETENUE` | `FACTURE` | `CONTRAT` | `IMPORT_CATALOGUE`.

**Historisation** : ne jamais écraser un prix. Un nouveau prix ferme le précédent
(`valid_to = nouveau.valid_from - 1 jour`) et crée une ligne. L'historique de prix par fournisseur
est une donnée métier de valeur — et un signal d'apprentissage pour la phase IA.

### T9.4 — Alimentation automatique du référentiel

Le référentiel ne doit pas se remplir à la main. Trois alimenteurs, sous forme d'écouteurs
d'événements :

| Déclencheur | Effet |
|---|---|
| Offre fournisseur **retenue** (`achats`) | crée/ferme une ligne catalogue, `source = OFFRE_RETENUE` |
| Facture fournisseur validée | idem, `source = FACTURE` — le prix réellement payé fait foi |
| Contrat fournisseur signé | **ouvre** les lignes déjà rattachées au contrat — cf. §T9.4bis |

### T9.4bis — Contrats : deux objets métier à ne pas confondre *(décidé 2026-07-19)*

`ContratFournisseur` porte `chantierId`, `montantHt`, `art187Declare`, `retenueGarantieTaux`,
`paiementDirectMoa`. C'est un **contrat de sous-traitance à montant forfaitaire** sur un chantier —
un engagement de dépense, pas une liste de prix.

| | Contrat de sous-traitance | Contrat-cadre de prix |
|---|---|---|
| Nature | montant forfaitaire pour un lot, sur un chantier | « pendant 12 mois, le ciment à 1,15 DH/kg » |
| Modélisé par | `ContratFournisseur` ✅ | — |
| Source de prix pour le chiffrage | non | **oui** |

**Décision : ne pas ajouter de lignes article à `ContratFournisseur`.** Cela fusionnerait deux
objets métier distincts.

Un contrat-cadre de prix se modélise avec l'existant : **un ensemble de
`CatalogueFournisseurLigne`** portant `source = CONTRAT`, `sourceRefId = contratId`, et
`validFrom` / `validTo` alignés sur la période du contrat. L'historisation et la résolution de prix
fonctionnent alors sans code supplémentaire.

Ce qui manque n'est donc pas un modèle mais un **point d'entrée** :

1. Rattacher une liste de prix à un contrat — saisie ou import Excel — créant des
   `CatalogueFournisseurLigne` avec `source = CONTRAT`, `sourceRefId`, `actif = false`.
2. `fromContratSigne(contrat)` **n'est pas un no-op** : à la signature, il ouvre les lignes
   rattachées.

```java
lignes = catalogue.findBySourceAndSourceRefId(CatalogueSource.CONTRAT, contrat.getId());
→ validFrom = contrat.getDateDebut()
→ validTo   = contrat.getDateFin()
→ actif     = true
```

Si aucune ligne n'est rattachée, l'alimenteur ne fait rien — comportement normal, pas une lacune.

Le rattachement d'une liste de prix (point 1) peut être livré séparément ; l'alimenteur (point 2)
appartient à ce lot.

C'est ce qui boucle le cycle : **acheter enrichit le référentiel, qui sert au chiffrage suivant.**
Sans ces alimenteurs, le catalogue reste vide et le lot 4 n'a rien à proposer.

### T9.5 — Service de résolution de prix *(le cœur du lot)*

```java
public interface ResolutionPrixService {
    PrixResolu resoudrePrixAchat(UUID itemId, ContexteResolution ctx);
    List<PrixResolu> toutesLesSources(UUID itemId, ContexteResolution ctx);
}

public record ContexteResolution(
    UUID tenantId,
    LocalDate dateReference,      // date de l'étude, pas today()
    UUID fournisseurPrefereId,    // optionnel
    UUID chantierId,              // optionnel — prix négociés par chantier
    UUID devisePivotId
) {}

public record PrixResolu(
    BigDecimal prixUnitaire,
    String     sourcePrix,        // cf. hiérarchie
    UUID       sourceRefId,
    LocalDate  dateSource,
    UUID       currencyId,
    String     libelleSource,     // "Catalogue Lafarge — 12/06/2026"
    boolean    perime               // date de validité dépassée
) {}
```

**Hiérarchie de résolution** (ordre par défaut, paramétrable par tenant) :

| # | Source | `sourcePrix` |
|---|---|---|
| 1 | Offre retenue sur l'affaire en cours | `CONSULTE` |
| 2 | Contrat fournisseur en cours de validité | `CONTRAT` |
| 3 | Catalogue fournisseur en cours de validité | `CATALOGUE` |
| 4 | `ItemPrice` type `ACHAT_STANDARD` en vigueur | `TARIF` |
| 5 | Dernière facture fournisseur | `HISTORIQUE` |
| 6 | PMP du stock (`Item.pmp`) | `PMP` |
| 7 | Aucune source | `MANUEL` (saisie requise) |

**Décision — base de chiffrage** : `MARCHE` par défaut, c'est-à-dire la hiérarchie ci-dessus, où le
PMP arrive en avant-dernier recours.

> **Justification** : une étude est prospective. On achètera aux prix à venir, pas à ceux payés il y
> a huit mois. Le PMP est rétrospectif — sa place est la valorisation du stock et le contrôle de
> gestion, pas le chiffrage.
>
> **Mais** le paramètre tenant `basePrixChiffrage` ∈ `MARCHE` | `PMP` | `MAX` permet d'inverser la
> priorité : certaines entreprises chiffrent au PMP par prudence. Généricité SaaS oblige.
>
> Dans tous les cas, l'UI affiche **les deux** valeurs quand elles diffèrent de plus d'un seuil
> paramétrable (défaut 10 %), pour que le chiffreur voie l'écart au lieu de le subir.

`toutesLesSources()` alimente une infobulle : le chiffreur voit toutes les options et peut en choisir
une autre que celle proposée. Son choix est alors tracé en `MANUEL` avec la référence retenue.

### T9.6 — Devises

Le module `currency` existe. À utiliser dès maintenant plutôt que de supposer le dirham :

- toute ligne de prix porte une `currencyId`
- conversion vers la devise pivot du tenant au taux de la `dateReference` (pas au taux du jour)
- la devise pivot est un paramètre tenant

Ne pas coder de logique de change ad hoc : passer par `currency`.

---

## Critères d'acceptation

- [ ] `ArticleType` et `PriceType` définis, utilisés, alignés avec les types de `ComposantDpu`
- [ ] `Item.prixUnitaire` déprécié et ses valeurs migrées vers `ItemPrice`
- [ ] Le catalogue fournisseur porte date, devise, remise, quantité min, délai, source
- [ ] Un nouveau prix ferme le précédent au lieu de l'écraser
- [ ] Retenir une offre dans `achats` crée automatiquement une ligne catalogue
- [ ] Valider une facture fournisseur met à jour le catalogue
- [ ] Signer un contrat ouvre les lignes catalogue rattachées (T9.4bis) ; sans lignes rattachées,
      aucun effet et aucune erreur
- [ ] Aucune ligne article n'a été ajoutée à `ContratFournisseur`
- [ ] `ResolutionPrixService` retourne la bonne source selon la hiérarchie, sur cas de test couvrant
      les 7 niveaux
- [ ] Le paramètre `basePrixChiffrage` inverse effectivement la priorité PMP
- [ ] Un prix en devise étrangère est converti au taux de la date de référence
- [ ] Un prix périmé est signalé, pas masqué
