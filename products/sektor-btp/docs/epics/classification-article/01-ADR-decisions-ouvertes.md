# ADR — Décisions ouvertes classification article (§7)

**Statut** : accepté  
**Date** : 2026-08-05  
**Ticket** : ERP-19  
**Plan** : [`00-PLAN.md`](./00-PLAN.md)

---

## 7.1 — `SERVICE` → type DPU

**Décision** : mapper `SERVICE` → `DPU_SOUS_TRAITANCE`.  
Conserver le poste budget `FRAIS_GENERAUX` (axes disjoints, comme `LOCATION` → DPU `MATERIEL` / budget `LOCATION_MATERIEL`).

**Pourquoi pas un 5ᵉ poste DPU** : le calculateur de déboursé ignore le type (somme des totaux). Un 5ᵉ poste ne corrige que le label / le reporting et toucherait tout le module `etudes` (UI, IA, unions front). À revisiter au chainage aval si on doit séparer services et ST dans les colonnes DPU.

**Conséquence Lot 1** : un `case` dans `NatureComposantMapping` + tests article→DPU. Pas de changement schéma `composants_dpu`.

---

## 7.2 — Articles `PRESTATION`

**Inventaire** (staging `nafura_erp`, 2026-08-05) : 2 lignes `item_types` PRESTATION (seed), **0** article lié. Repo : aucun item seedé avec ce type.

**Décision** :
1. Si `article_type` connu → nature = `article_type` (§5.2).
2. Sinon si `item_types.code = PRESTATION` → nature = **`SOUS_TRAITANCE`**.
3. Avant Lot 2 : rejouer le SQL d’inventaire ; si count > 0, checklist manuelle (ST vs SERVICE vs MO).

**SQL inventaire** :

```sql
SELECT i.tenant_id, i.id, i.code, i.name, i.article_type, t.code AS item_type
FROM items i
JOIN item_types t ON t.id = i.item_type_id AND t.tenant_id = i.tenant_id
WHERE t.code = 'PRESTATION';
```

---

## 7.3 — Mécanisme migrations SQL

**Décision** : **Liquibase out-of-process** via Job K8s `sektor-btp-lifecycle` (Gradle `:tools:lifecycle:collectMigrations`). Pas de Flyway / Liquibase Spring sur sektor. `ddl-auto: validate` reste.

**Ajouter une migration Lot 1/2/5** : déposer un `.sql` sous  
`products/sektor-btp/backend/modules/item/src/main/resources/db/changelog/schema/v1.1/`  
(pas d’enregistrement manuel — découverte auto). Appliquer avec `make migrate APP=sektor-btp` ou `stg-up SCOPE=back`.

Réf. : `tools/lifecycle/README.md`, `toolchain/ops/AGENTS.md`.

---

## 7.4 — Un article, plusieurs lots d’usage (pas multi-famille d’appro)

**Contexte** : ex. le sable peut servir en VRD, gros œuvre et finitions. Ce n’est **pas** plusieurs familles d’approvisionnement.

**Décision** (option B) :

| Axe | Cardinalité | Rôle |
|-----|-------------|------|
| Nature | 1 | comportement |
| Famille d’appro (`item_category_id`) | **1** | ce qu’on achète (arbre LIANTS / GRANULATS…) |
| **Lots d’usage** | **0..N** | où on l’emploie sur chantier |

- Table `item_usage_lots (item_id, tenant_id, lot_code)` — enum figé côté app.
- Enum v1 : `GROS_OEUVRE`, `VRD`, `FINITIONS`, `SECOND_OEUVRE`, `TECHNIQUE`.
- Les anciennes catégories `GROS_OEUVRE` / `VRD` / `FINITIONS` restent **hors** arbre familles (inactives) ; elles ne sont **pas** réintégrées comme familles d’appro.
- Les lots d’usage **ne pilotent pas** stock / DPU / chiffrage.

**Ticket** : ERP-25.
