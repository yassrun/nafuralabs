# Création Catalogue depuis Extraire — SEKTOR-204 (préparation)

> Préparation **read-only** posée pendant l'attente de la revue de SEKTOR-202 (séquencement).
> Contrat : [`CONTRAT.md`](CONTRAT.md) AC-16 à AC-20. S'appuie sur les états IA de
> [`02-ETATS-IA-PROVENANCE.md`](02-ETATS-IA-PROVENANCE.md) (proposition → décision humaine).

---

## 1. Inventaire de la chaîne actuelle

| Emplacement | Ce qui existe | Écart face au contrat |
|---|---|---|
| `catalogue/service/ExtraireCreationService.creer(designation, nature, uniteCode, cleStableHint)` | **identité 1–1 déjà en place** : résout `cleStable` → `CatalogArticle` (Sektor, statut `PUBLIE`) puis Item tenant ; réutilise l'Item existant ; retourne `created/reused` + `createdSektor` | **aucun tarif** : ni « avec tarif » transactionnel ni « sans tarif » explicite (AC-18) ; pas de clé d'idempotence de geste (AC-17) ; pas de permission dédiée ni d'audit (AC-20) |
| `catalogue/api/controller/ItemController#extraire-creer` | endpoint de confirmation | **aucun `@RequirePermission`** — la publication depuis Études n'est pas contrôlée (AC-20) |
| `catalogue/service/CatalogLookupApiImpl#createAllege` (L9) | création allégée `aCompleter=true`, réutilisation par slug | **c'est ce que le flux Études appelle aujourd'hui** (`RattrapageComposantService.creerOuDemander`) — pas la voie identité 1–1 (AC-17) ; pas de tarif |
| `etudes/service/RattrapageComposantService.creerOuDemander` | mode LIBRE → `createAllege` + `lierVersItem` (referenceType ITEM, snapshot via `gelPrixService`) ; mode CONTROLEE → `DemandeCreationArticle` | pas de clé d'idempotence (double clic → 2 Items si slug différent) ; échec de `lierVersItem` après création → **succès partiel silencieux** sans « Rattacher maintenant » (AC-19) ; `aCompleter` sans jamais tenter de tarif (ni choix explicite) |
| `etudes/service/GelPrixComposantService` | résolution prix + `appliquerGel` (snapshot `sourcePrix`, `prixSourceRefId`, date, devise) | la base du snapshot demandé par AC-19 est là — reste à la brancher sur le tarif réellement persisté |
| `catalogue/.../ItemPriceService.create` + `ItemPriceController` | CRUD `ItemPrice` (prix daté, `PriceType`) | pas de validation « prix > 0 + devise + type + date d'effet obligatoires » garantie à la commande (AC-18) ; pas de retour transactionnel Item+tarif |
| `web/app/etudes/dossiers/components/create-missing-item-dialog` | deux modes déjà distincts : « Créer dans le catalogue » (avec `Prix unitaire (tarif)`) vs « Ajouter au poste » | à vérifier : le bouton final n'ajoute **pas implicitement** les manquants non tranchés (AC-16) ; à aligner sur le résultat honnête de la commande |

---

## 2. Cible : une commande Catalogue explicite, un résultat honnête

### 2.1 Commande

```
POST /api/v1/etudes/dossiers/{dossierId}/composants/catalogue-creer
Authorization: permission dédiée (cf. 2.4)
{
  "idempotencyKey": "dossier:article:besoin-uuid",        // stable par geste (AC-17, AC-19)
  "propositionId": "…",                                    // preuve IA (audit AC-20)
  "designation": "Ciment CPJ 45",
  "nature": "MATIERE",
  "uniteCode": "U",
  "rendement": 350.0,
  "cpsSections": ["section-uuid…"],                        // provenance (AC-10)
  "tarif": {                                               // null = « sans tarif » volontaire
    "prixUnitaire": 1083.75,
    "currencyId": "MAD",
    "priceType": "ACHAT_STANDARD",
    "dateEffet": "2026-08-26"
  },
  "composantIds": ["…"]                                    // composants du poste à rattacher
}
```

### 2.2 Résolution identité 1–1 (AC-17) — réutiliser `ExtraireCreationService`

1. `cleStable` résolue (hint de la proposition ou `CatalogSlug.from(designation)`) ;
2. identité Sektor existante → **créer/réutiliser seulement l'Item tenant** ; absente → publier
   Sektor (`CatalogArticle PUBLIE`) puis créer l'Item tenant ;
3. **idempotence** : même `idempotencyKey` (dossier + poste + besoin) → même résultat, aucune
   seconde identité/Item (double clic, retry, concurrence — la clé est l'arme de AC-17/AC-19) ;
4. tiny spec, couleur, RAL ou marque équivalente restent **sur l'emploi DPU** (jamais dans une
   nouvelle identité) — gelé.

### 2.3 Tarif transactionnel ou absence assumée (AC-18)

- **créer avec tarif** : `prixUnitaire > 0`, `currencyId`, `priceType`, `dateEffet` obligatoires ;
  Item **et** `ItemPrice` réussissent **ensemble ou aucun des deux n'est annoncé créé**
  (rollback de la commande ; `sourcePrix` jamais posé si le tarif a échoué) ;
- **créer sans tarif** : `tarif: null` volontaire → Item `aCompleter=true`, `sourcePrix` non-TARIF,
  aucun faux succès ;
- résultat retourné : `created/reused`, `itemId`, `cleStable`, `createdSektor`, **tarif réellement
  persisté** (ou `null` + `aCompleter`) et sa `source`.

### 2.4 Permission et audit (AC-20)

- permission backend dédiée (ex. `etudes.catalogue.creer`, calquée sur `catalogue.publish`) sur
  la commande ; **absence de permission → « Ajouter au poste seulement » reste disponible** ;
- audit : acteur, étude/poste, `propositionId`, identité créée/réutilisée, Item, tarif
  (persisté ou non) — tracé à chaque étape de la chaîne.

### 2.5 Rattachement DPU récupérable (AC-19)

1. après succès Catalogue : rattacher les composants (`referenceType = ITEM`, `itemId`,
   `rendement`, snapshot du tarif réel via `gelPrixService.appliquerGel`) ;
2. si cette **seconde écriture** échoue : état « article créé, non rattaché » + CTA
   **Rattacher maintenant** qui rejoue le rattachement avec la **même `idempotencyKey`** — il ne
   recrée ni identité, ni Item, ni tarif.

### 2.6 Bouton final (AC-16)

- deux actions distinctes par composant absent : **Ajouter au poste seulement** /
  **Créer dans le catalogue et lier** ;
- le bouton final **n'ajoute jamais implicitement** au poste les manquants non tranchés.

---

## 3. Zones de conflit (séquencement)

- SEKTOR-204 touche `RattrapageComposantService` (Études), `ExtraireCreationService` +
  `ItemController` + `ItemPriceService` (Catalogue), le dialog `create-missing-item-dialog` et
  l'i18n — fichiers partagés avec le lot Chantier (non commités) et avec SEKTOR-202/203.
- **Exécution après** la revue de la continuité et les livraisons SEKTOR-202 → SEKTOR-203
  (`blocked_by: [SEKTOR-203]`).

## 4. Ordre d'implémentation (une fois feu vert)

1. Étendre `ExtraireCreationService` en commande avec `idempotencyKey`, validation tarif et
   rollback transactionnel ; brancher `ItemPriceService` dans la même transaction.
2. Poser la permission dédiée + audit (acteur, proposition, identité, Item, tarif).
3. Exposer la commande via un port BC consommé par Études ; brancher
   `RattrapageComposantService` sur la commande (remplacer `createAllege`).
4. Rattachement DPU + reprise « Rattacher maintenant » (même clé).
5. Aligner le dialog (deux actions distinctes, résultat honnête, pas d'ajout implicite).
6. Preuves : identité absente/existante, Item absent/existant, double clic, retry, collision
   concurrente ; échec ItemPrice injecté → aucun faux tarif/succès ; échec DPU → reprise sans
   duplication ; rôles (création refusée, ajout poste autorisé) ; audit complet.
