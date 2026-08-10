# Raffinement du module stock

**Statut** : **terminé** Lots 1–6 (ERP-33→39) · ADR §7 accepté  
**ADR** : [`01-ADR-decisions-ouvertes.md`](./01-ADR-decisions-ouvertes.md)
**Périmètre** : `products/sektor-btp/backend/modules/stock/`,
`products/sektor-btp/backend/modules/item/src/main/java/ma/nafura/item/service/ItemService.java`,
`products/sektor-btp/web/app/pages/inventory/{mouvements,suivi}/`,
`products/sektor-btp/web/app/inventory/services/`
**Objectif** : donner au module les trois fondations qui lui manquent — un grand livre de
mouvements, une valorisation réellement calculée, et un disponible qui bloque — puis nettoyer les
défauts de modèle qui en découlent.

---

## 1. Verdict

La surface fonctionnelle est là et elle est juste : six types de mouvement, un cycle
brouillon → soumis → validé, des motifs de mouvement paramétrables, des réservations par chantier,
un magasin de chantier. Le découpage métier ne demande pas à être revu.

Ce qui manque est dessous. **Le module écrit des soldes sans jamais écrire de mouvements**, ne
calcule aucune valorisation malgré trois méthodes de costing paramétrables, et affiche des
indicateurs fabriqués. Un stock tenu avec ça donnera des chiffres faux sans jamais lever d'alerte —
c'est plus dangereux qu'une fonctionnalité manquante, parce que rien ne signale l'erreur.

Six des dix-huit constats ci-dessous produisent de la donnée fausse en silence. Ce sont eux qui
commandent l'ordre des lots.

---

## 2. Constat

### 2.1 Bloquants — production de données fausses

**A — Il n'existe aucun grand livre de stock.**
`InventoryTxService.applyStockImpact()` (ligne 215) écrit directement dans `stock_balances`. Il n'y a
pas de table de mouvements : `inventory_tx_lines` porte l'intention saisie, pas l'impact appliqué.
Conséquences : impossible de reconstruire un solde à une date passée, impossible d'expliquer un écart,
impossible d'implémenter FIFO (pas de couches), impossible d'auditer qui a bougé quoi.
C'est la fondation absente dont dépendent B, C et E.

**B — La valorisation n'existe pas.**
`ItemService.recalcPmp()` (`modules/item/.../service/ItemService.java:26-38`) est un talon : il
recopie `prixUnitaire` dans `pmp` quand `pmp` est nul, sinon il réécrit `pmp` sur lui-même. Aucune
réception ne met à jour le PMP, alors que `inventory_tx_lines.unit_price` est saisi.
En parallèle, `costing_methods` (AVCO / FIFO / STD, avec `allow_negative_stock`) est une table
paramétrable **qu'aucun code backend ne lit** : hors de son propre CRUD et du seeder, `CostingMethod`
n'apparaît nulle part. L'écran de configuration laisse croire à un choix qui n'a aucun effet.

**C — Le stock négatif est écrasé en silence.**
```java
// InventoryTxService.java:263-267
BigDecimal next = qty.subtract(line.getQuantity());
if (next.compareTo(BigDecimal.ZERO) < 0) {
    next = BigDecimal.ZERO;
}
```
Une sortie de 100 sur un stock de 30 est acceptée et laisse 0. Les 70 unités manquantes disparaissent
sans erreur, sans trace, sans écart d'inventaire. Toute erreur de saisie devient invisible et la
consommation chantier est faussée d'autant. `costing_methods.allow_negative_stock` existe justement
pour arbitrer ce cas — et n'est pas lu.

**D — Les réservations ne réservent rien.**
`StockReservationService` ne touche jamais `stock_balances.reserved_quantity`. Cette colonne n'est
écrite qu'à l'initialisation, à zéro (`InventoryTxService.newBalance()`, ligne 278). Donc
`available_quantity = quantity` en permanence. On peut réserver 100 sacs pour le chantier A et les
sortir intégralement pour le chantier B sans le moindre blocage. La création d'une réservation ne
vérifie pas non plus qu'il y a du stock, et `stock_reservations` n'est rattachée à aucun emplacement.

**E — Des indicateurs sont fabriqués.**
`StockKpiService.java:60` : `double rotation = valorisationStock.signum() > 0 ? 4.2 : 0.0;` — la
rotation de stock est la constante 4,2 dès qu'il y a du stock.
`suivi/valorisation/services/valorisation.facade.ts` : `monthlyVariationPercent: 0` et
`costingMethod: 'AVCO'` sont en dur, et le sélecteur de date (`selectedDate`) n'est jamais utilisé
dans le calcul — il est seulement recopié dans `asOfDate`. L'écran « valorisation à une date »
affiche donc toujours la valorisation d'aujourd'hui, quelle que soit la date choisie. Sans A, il ne
peut pas faire autrement.

**F — Aucune contre-passation.**
`cancel()` (ligne 193) refuse d'annuler une transaction validée, et rien ne permet de l'extourner.
Une erreur validée ne peut être corrigée que par une saisie inverse manuelle, sans lien avec
l'originale. En comptabilité matière comme ailleurs, on n'efface pas : on contre-passe.

### 2.2 Défauts de modèle

**G — `warehouse_id` désigne en réalité un `location_id`.**
`stock_balances.warehouse_id` et `inventory_txs.warehouse_id` référencent `locations.id` — voir
`warehouseForDest()` (ligne 299) qui y renvoie `destLocationId`. Il n'existe aucune table
`warehouses`. Nommage trompeur sur les deux tables les plus lues du module.

**H — `stock_balances` n'a pas de contrainte d'unicité.**
`003_create_stock_balances.sql` ne crée que des index simples. Rien n'empêche deux lignes pour le
même `(tenant, warehouse, item)`, alors que tout le code suppose l'unicité via
`findByTenantIdAndWarehouseIdAndItemId(...) → Optional`. Deux validations concurrentes créent le
doublon, et les soldes divergent définitivement.

**I — `available_quantity` est stockée au lieu d'être dérivée.**
Recalculée à la main par `recalcAvailable()` à chaque écriture. Toute écriture qui oublie l'appel
laisse la colonne fausse. C'est une valeur dérivable (`quantity - reserved`) : elle n'a pas à être
persistée.

**J — Le chantier est référencé par quatre chemins différents.**

| Table | Colonne | Type |
|---|---|---|
| `inventory_txs` | `chantier_location_id` | `UUID` → `locations` |
| `inventory_txs` | `chantier_budget_id` | `VARCHAR(50)` |
| `stock_reservations` | `chantier_id` | `VARCHAR(50)` |
| `materiel_affectations` | `chantier_ref` | `VARCHAR(100)` |

Et `consumeReservationsIfSortie()` (ligne 181) fait le pont en passant `chantierBudgetId` là où
`chantier_id` est attendu : un identifiant de budget utilisé comme identifiant de chantier. Si les
deux ne coïncident pas, les réservations ne sont jamais consommées, sans erreur.

**K — Le statut par défaut du SQL ne correspond pas au code.**
`004_create_inventory_txs.sql` : `status VARCHAR(50) DEFAULT 'DRAFT'`. Le code n'emploie que
`BROUILLON`, `SOUMIS`, `VALIDE`, `ANNULE` (`InventoryTxService.java:33-36`). Toute ligne créée hors
service porte un statut qu'aucun test de transition ne reconnaît.

**L — La numérotation des mouvements est un horodatage.**
`resolveTxNumber()` (ligne 376) produit `REC-1754387234123`. Pas de séquence par tenant, par type ni
par exercice. Non conforme à l'usage d'un bon de livraison ou d'un bon de sortie, et non triable.

**M — Ni lot, ni série, ni péremption.**
`items.is_perissable` et `is_serialise` existent au catalogue, mais aucune table ne porte de lot ni
de numéro de série côté stock. Un article marqué périssable n'a nulle part où stocker sa date de
péremption. La fonctionnalité est annoncée au catalogue et absente du stock.

**N — L'inventaire ne produit pas d'écart.**
`adjustToCountedQuantity()` (ligne 243) aligne le solde sur la quantité comptée. Aucun écart n'est
conservé, aucune régularisation valorisée n'est produite. `theoretical_qty` est saisi mais n'est
jamais comparé.

### 2.3 Défauts de plomberie

**O — Les motifs de mouvement sont seedés deux fois, différemment.**
`backend/app/src/main/resources/onboarding/reference-data.json` en déclare 15 (dont
`RECEPTION_ACHAT`), et `modules/stock/src/main/resources/seed/movement-motifs-seed.json` en déclare
14 (sans `RECEPTION_ACHAT`), appliqués par `MovementMotifSeedService`. Deux sources pour une table.

**P — Aucun emplacement n'est seedé.**
`reference-data.json` ne contient pas de bloc `locations`. Un tenant fraîchement onboardé n'a aucun
dépôt, donc aucun mouvement de stock n'est possible tant qu'il n'en crée pas un à la main. Le
parcours d'onboarding s'arrête là sans le dire.

**Q — Les écrans de suivi calculent tout dans le navigateur.**
`StockBalanceEnrichmentService.loadEnrichedBalances()` charge **tous** les soldes, **tous** les
articles et **tous** les emplacements, puis fait la jointure côté client. `etat-stock`,
`valorisation` et `alertes` s'appuient dessus. La pagination des alertes est faite en mémoire après
avoir tout chargé (`alertes-reappro.facade.ts`, `loadItems`). Ça tient sur un jeu de démonstration,
pas sur un catalogue réel.

**R — L'alerte de réapprovisionnement compare un minimum global à un solde par dépôt.**
`computeAlerts()` teste `b.stockMin` (porté par l'article) contre la quantité de chaque ligne de
solde, c'est-à-dire par emplacement. Un article dont le stock minimum est 100, réparti en 60 + 60 sur
deux dépôts, déclenche deux alertes alors que le total est suffisant.

**S — Écrans morts et dépendances croisées.**
Non routés dans `inventory.routes.ts` : `mouvements/inventory-txes`, `mouvements/inventory-tx-lines`,
`suivi/stock-balances`, `configuration/item-categories`, `configuration/item-types`,
`configuration/unit-of-measures`, `configuration/uo-mcategories`, `catalogue/items`.
Attention : `catalogue/items/services/item-api.service.ts` **est** utilisé — par
`alertes-reappro.facade.ts`. Supprimer l'arbre sans déplacer le service casse les alertes. Même
piège que `item-types` dans le plan classification.

---

## 3. Modèle cible

Trois ajouts, aucun bouleversement du découpage existant.

**3.1 — `stock_moves`, le grand livre.**
Une ligne par impact appliqué, écrite uniquement à la validation d'une `inventory_tx`, jamais
modifiée ensuite. Colonnes : `tenant_id`, `inventory_tx_id`, `inventory_tx_line_id`, `location_id`,
`item_id`, `quantity` signée, `unit_cost`, `total_cost`, `moved_at`, `created_by`, plus
`reversal_of_move_id` pour la contre-passation.
`stock_balances` devient un cache reconstructible : `SUM(quantity) GROUP BY location_id, item_id`.
Un test de cohérence solde ↔ somme des mouvements devient possible, et c'est lui qui protège le
module sur la durée.

**3.2 — La valorisation devient un service.**
Un `ValorisationService` dans le module stock, appelé à la validation, qui met à jour le PMP à
chaque entrée valorisée et écrit `unit_cost` sur le mouvement. `recalcPmp` quitte `ItemService` :
c'est le stock qui valorise, pas le catalogue.
`costing_methods` est réduite à `AVCO` tant que FIFO n'a pas de couches — mieux vaut une seule
option qui marche que trois dont deux mentent.

**3.3 — Le disponible bloque.**
`reserved_quantity` est mis à jour par `StockReservationService` à la création, à la libération, à
l'expiration et à la consommation. `available_quantity` disparaît de la table et devient une valeur
calculée. Une sortie qui dépasse le disponible est refusée, sauf si la méthode de costing autorise
explicitement le négatif — c'est enfin `allow_negative_stock` qui décide.

---

## 4. Valeurs de référence

### 4.1 Enums verrouillés — code, pas de table

Même principe que les natures d'article : ces valeurs pilotent du comportement, donc elles ne sont
pas éditables par le tenant.

| Enum | Valeurs |
|---|---|
| Type de mouvement | `RECEPTION`, `SORTIE`, `TRANSFERT`, `RETOUR`, `PERTE`, `INVENTAIRE` |
| Statut de transaction | `BROUILLON`, `SOUMIS`, `VALIDE`, `ANNULE` |
| Type d'emplacement | `DEPOT`, `ENTREPOT`, `CHANTIER`, `TRANSIT`, `VIRTUEL` |
| Statut de réservation | `ACTIVE`, `CONSOMMEE`, `EXPIREE`, `ANNULEE` |

### 4.2 Motifs de mouvement — seeder unique, 15 valeurs

Source unique retenue : `reference-data.json`. Le fichier `movement-motifs-seed.json` et
`MovementMotifSeedService` sont supprimés.

| Code | Libellé | Type |
|---|---|---|
| `RECEPTION_ACHAT` | Réception achat | `RECEPTION` |
| `CHANTIER` | Besoin chantier | `TRANSFERT` |
| `TRANSFERT_INT` | Transfert interne | `TRANSFERT` |
| `PERIODIQUE` | Inventaire périodique | `INVENTAIRE` |
| `CONTROLE` | Contrôle ponctuel | `INVENTAIRE` |
| `RETOUR_CHANTIER` | Retour chantier | `RETOUR` |
| `RETOUR_FOURNISSEUR` | Retour fournisseur | `RETOUR` |
| `CHUTE_DECOUPE` | Chute découpe | `PERTE` |
| `CASSE` | Casse | `PERTE` |
| `VOL` | Vol | `PERTE` |
| `INTEMPERIES` | Intempéries | `PERTE` |
| `MALFACON` | Malfaçon | `PERTE` |
| `CONSO_CHANTIER` | Consommation chantier | `SORTIE` |
| `LIV_SOUS_TRAITANT` | Livraison sous-traitant | `SORTIE` |
| `REAPPRO_CH` | Réappro magasin chantier | `SORTIE` |

### 4.3 Emplacements initiaux — nouveau bloc `locations`

Un tenant doit pouvoir enregistrer un mouvement dès la fin de l'onboarding.

| Code | Libellé | Type | Physique | Impacte le stock |
|---|---|---|---|---|
| `DEPOT_PRINCIPAL` | Dépôt principal | `DEPOT` | oui | oui |
| `TRANSIT` | En transit | `TRANSIT` | non | oui |
| `AJUSTEMENT` | Écarts d'inventaire | `VIRTUEL` | non | non |

`AJUSTEMENT` est la contrepartie des régularisations d'inventaire : sans emplacement de
contrepartie, un écart n'a nulle part où aller.

### 4.4 Méthodes de costing — une seule

| Code | Libellé | Méthode | Négatif autorisé | Statut |
|---|---|---|---|---|
| `AVCO` | Coût moyen pondéré | `AVCO` | non | `Active` |

`FIFO` et `STD` sont retirés du seed jusqu'à implémentation réelle.

---

## 5. Lots d'exécution

Ordre imposé : chaque lot ferme un trou dont le suivant dépend.

### Lot 1 — Le grand livre

- Nouveau changelog `011_create_stock_moves.sql` selon §3.1, avec index
  `(tenant_id, item_id, location_id, moved_at)` et `(tenant_id, inventory_tx_id)`.
- Nouveau `domain/model/StockMove.java`, `repository/StockMoveRepository.java`.
- `InventoryTxService.applyStockImpact()` écrit un `StockMove` par ligne **avant** de mettre à jour
  le solde. Le solde reste écrit en même temps (cache), mais il devient reconstructible.
- Ajouter `UNIQUE (tenant_id, warehouse_id, item_id)` sur `stock_balances` (constat H) — dédoublonner
  d'abord si des doublons existent en base.
- Nouveau service `reconcile(itemId, locationId)` qui compare le solde à la somme des mouvements.

**Fin de lot** : un test rejoue trois mouvements et vérifie que solde = somme des mouvements.

### Lot 2 — Sortie bloquante et contre-passation

- `subtractQuantity()` : supprimer le clamp à zéro (lignes 263-267), lever une exception métier
  dédiée quand le disponible est insuffisant, sauf si la méthode de costing du tenant autorise le
  négatif.
- Lire réellement `costing_methods` : un `CostingMethodResolver` qui renvoie la méthode active du
  tenant, appelé par `InventoryTxService`.
- Nouvelle opération `reverse(txId)` : crée une transaction inverse en statut `VALIDE`, avec
  `reversal_of_move_id` renseigné sur chaque mouvement. `cancel()` reste réservé aux brouillons.
- Aligner le défaut SQL sur `BROUILLON` (constat K).

**Fin de lot** : une sortie supérieure au stock est refusée avec un message exploitable ; une
transaction validée peut être contre-passée et les soldes reviennent à l'identique.

### Lot 3 — Valorisation

- Nouveau `service/ValorisationService.java` dans le module stock : PMP recalculé à chaque
  `RECEPTION` valorisée, `unit_cost` et `total_cost` écrits sur le `StockMove`.
- Retirer `recalcPmp()` de `ItemService` et l'endpoint `POST /items/{id}/recalc-pmp` ; le PMP n'est
  plus modifiable à la main.
- Réduire le seed `costingMethods` à `AVCO` (§4.4).
- `StockKpiService` : calculer la rotation réelle à partir des sorties de la période
  (`sorties valorisées / stock moyen`), ou ne pas afficher l'indicateur. **Ne pas laisser 4,2.**

**Fin de lot** : deux réceptions à des prix différents donnent le PMP attendu, vérifié par test.

### Lot 4 — Réservations qui bloquent

- `StockReservationService` met à jour `stock_balances.reserved_quantity` sur les quatre
  transitions : création, libération, expiration, consommation.
- Ajouter `location_id` à `stock_reservations` — une réservation sans emplacement n'a pas de sens.
- Refuser une réservation dont la quantité dépasse le disponible.
- Supprimer la colonne `available_quantity` ; l'exposer en calcul dans le DTO.
- Unifier la référence chantier (constat J) : `stock_reservations.chantier_id` devient un `UUID`
  aligné sur `inventory_txs.chantier_location_id`, et `consumeReservationsIfSortie()` cesse de passer
  `chantierBudgetId`.

**Fin de lot** : réserver 100 puis tenter de sortir 100 pour un autre chantier est refusé.

### Lot 5 — Inventaire et écarts

- `adjustToCountedQuantity()` produit un `StockMove` d'écart valorisé, en contrepartie de
  l'emplacement `AJUSTEMENT`, au lieu d'écraser le solde.
- Exposer l'écart (`counted_qty - theoretical_qty`) et sa valeur sur l'écran inventaire.
- Numérotation : remplacer `resolveTxNumber()` par une séquence par tenant, type et exercice
  (`REC-2026-0001`).

**Fin de lot** : un inventaire avec écart laisse une trace valorisée consultable.

### Lot 6 — Nettoyage

- Renommer `warehouse_id` en `location_id` sur `stock_balances` et `inventory_txs` (constat G),
  avec les index correspondants.
- Seeder unique pour les motifs : supprimer `movement-motifs-seed.json` et
  `MovementMotifSeedService`, ajouter `RECEPTION_ACHAT` côté `reference-data.json` (§4.2).
- Ajouter le bloc `locations` au seed d'onboarding (§4.3).
- Déplacer `catalogue/items/services/item-api.service.ts` vers `web/app/inventory/services/` **avant**
  de supprimer les arbres morts listés au constat S.
- `alertes-reappro` : agréger par article avant de comparer au stock minimum (constat R), et déporter
  le filtrage et la pagination côté serveur.
- `etat-stock` et `valorisation` : endpoints dédiés renvoyant des lignes déjà jointes et paginées, au
  lieu de la jointure navigateur (constat Q).
- `valorisation` : brancher le sélecteur de date sur le grand livre — possible seulement après le
  Lot 1.

**Fin de lot** : plus aucun écran de suivi ne charge l'intégralité d'une table.

---

## 6. Hors périmètre

- Lot / série / péremption (constat M) — dépend d'une décision produit, voir §7.
- Le module matériel (`inventory/materiel/*`) : les écrans carburant, maintenance, plans, ordres de
  travail, pointage et contrôles n'ont pour tout backend que `materiels` et `materiel_affectations`.
  C'est un audit distinct, pas une annexe de celui-ci.
- Le rattachement `materiels` → `items`, traité dans le plan classification article (Lot 5).
- Le lien réception ↔ bon de commande (`inventory_txs.bc_id`), qui relève du module achats.

---

## 7. Questions ouvertes

**7.1 — Gère-t-on les lots et les dates de péremption ? — TRANCHÉE**
Non en v1. Pas de `stock_lots` ; clé soldes inchangée. Voir ADR.

**7.2 — Le négatif est-il autorisé, et pour qui ? — TRANCHÉE**
Par méthode/tenant uniquement (`allow_negative_stock`), pas par emplacement. Voir ADR.

**7.3 — Que fait-on des soldes existants sur staging ? — TRANCHÉE**
Mouvements d'ouverture par ligne de solde + dédoublonnage avant UNIQUE. Voir ADR.

**7.4 — Comment les fichiers SQL sont-ils appliqués ? — TRANCHÉE**
Liquibase out-of-process `sektor-btp-lifecycle` → `stock/.../schema/v1.1/`. Même ADR classification.
