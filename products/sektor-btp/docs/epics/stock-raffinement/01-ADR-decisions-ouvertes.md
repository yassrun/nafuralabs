# ADR — Décisions ouvertes raffinement stock (§7)

**Statut** : accepté  
**Date** : 2026-08-05  
**Ticket** : ERP-33  
**Plan** : [`00-PLAN.md`](./00-PLAN.md)

---

## 7.1 — Lots et dates de péremption

**Décision** : **non en v1**. Pas de table `stock_lots`, clé de `stock_balances` inchangée `(tenant, warehouse/location, item)`.

`items.is_perissable` / `is_serialise` restent des flags catalogue sans effet stock. Réouvrir quand le ciment / adjuvants / résines exigent un suivi lot — hors vague raffinement.

**Conséquence Lot 1** : grand livre et soldes sans dimension lot.

---

## 7.2 — Stock négatif

**Décision** : garder `allow_negative_stock` **par méthode de costing / tenant**, pas par emplacement.

Le magasin de chantier ne génère pas d’exception modèle : la saisie doit rattraper la réalité terrain ; le défaut `AVCO` refuse le négatif (Lot 2).

**Conséquence Lot 2** : `CostingMethodResolver` lit la méthode active du tenant ; `subtractQuantity` refuse si disponible insuffisant sauf `allow_negative_stock = true`.

---

## 7.3 — Soldes staging sans mouvements

**Décision** : **mouvements d’ouverture** — une ligne `stock_moves` par solde existant (qty = solde courant, `inventory_tx_id` nullable ou tx d’ouverture dédiée), avant d’exiger la cohérence solde ↔ Σ mouvements.

Inventaire SQL staging avant migrate :

```sql
SELECT COUNT(*) FROM stock_balances;
SELECT tenant_id, warehouse_id, item_id, COUNT(*)
FROM stock_balances
GROUP BY 1, 2, 3
HAVING COUNT(*) > 1;
```

Dédoublonner avant `UNIQUE` ; puis seed mouvements d’ouverture.

---

## 7.4 — Mécanisme migrations SQL

**Décision** : reprise ADR classification — **Liquibase out-of-process** via Job K8s `sektor-btp-lifecycle` (`collectMigrations`).  
Déposer sous `products/sektor-btp/backend/modules/stock/src/main/resources/db/changelog/schema/v1.1/`.  
`ddl-auto: validate` reste. Appliquer : `make migrate APP=sektor-btp` ou `stg-up SCOPE=back`.
