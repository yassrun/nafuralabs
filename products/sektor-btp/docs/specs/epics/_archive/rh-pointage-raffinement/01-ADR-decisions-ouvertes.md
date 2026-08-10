# ADR — Décisions ouvertes RH / pointage (§7)

**Statut** : accepté  
**Date** : 2026-08-05  
**Ticket** : ERP-27  
**Plan** : [`00-PLAN.md`](./00-PLAN.md)

Critère de choix : **pratique marché marocain BTP** (analyse de coût chantier, conformité CNSS/AMO/IR, conventions d’entreprise).

---

## 7.1 — Un employé peut-il être pointé sur deux chantiers le même jour ? — TRANCHÉE

**Décision** : oui. Clé d’unicité = `(tenant_id, employe_id, date, chantier_id)`.  
Plafond journalier croisé tous lots (Lot 2). Axe `mode_imputation` pour les transverses (§4.4 bis, Lot 4).

---

## 7.1 bis — Clé de répartition frais généraux — TRANCHÉE

**Décision** : **A** — prorata du déboursé direct MO de chaque chantier, avec **override manuel (C) optionnel** par période.

**Pourquoi A pour le Maroc / BTP** : le coût de revient chantier (déboursé sec + frais de chantier) est l’outil de pilotage courant des entreprises de travaux. Répartir les frais généraux au prorata de la MO directe déjà imputée reste cohérent avec une lecture DPU / marge chantier. Le CA (B) fausse le message quand les chantiers n’ont pas le même mix ou la même avance de facturation.

**Override C** : conservé pour les cas réels (siège, multi-agences, période atypique) sans remplacer A comme défaut.

Conséquence Lot 4 (ERP-31) : clé par défaut A ; table / param période pour override C.

---

## 7.2 — Paramètres de paie communs ou par tenant ? — TRANCHÉE

**Décision** :
- Barème IR + taux **CNSS / AMO** (salarial et patronal) et plafonds légaux → lignes `tenant_id IS NULL` (commun plateforme).
- **CIMR**, mutuelle, avantages / convention collective → surcharge `tenant_id` renseigné.
- Édition : ops plateforme pour le légal ; admin tenant pour les overlays.

**Pourquoi pour le Maroc** : CNSS, AMO et IR sont nationaux (loi de finances / circulaires) — un tenant ne doit pas pouvoir les « personnaliser ». En revanche CIMR et mutuelle varient fortement d’une entreprise à l’autre. Schéma §4.5 déjà compatible.

**Chiffres §4.5** : structure figée ; valeurs seed Lot 3 (ERP-30) à valider par le comptable avant mise en prod (taux, plafonds, barème IR LF en vigueur).

---

## 7.3 — Pointages déjà saisis — TRANCHÉE (processus)

**Décision** : avant migrate Lot 1, inventaire staging. Si doublons / collisions PK déterministes → dédupliquer (garder le plus récent `created_at`, journaliser les IDs perdus) puis appliquer les `UNIQUE`.

**SQL inventaire** :

```sql
SELECT tenant_id, employe_id, date, chantier_id,
       COUNT(*) AS cnt,
       array_agg(id ORDER BY created_at) AS ids
FROM pointages
GROUP BY tenant_id, employe_id, date, chantier_id
HAVING COUNT(*) > 1
ORDER BY cnt DESC;

SELECT tenant_id, employe_id, date,
       COUNT(*) AS cnt,
       COUNT(DISTINCT chantier_id) AS chantiers,
       array_agg(id ORDER BY created_at) AS ids
FROM pointages
GROUP BY tenant_id, employe_id, date
HAVING COUNT(*) > 1
ORDER BY cnt DESC;

SELECT tenant_id, chantier_id, date_pointage,
       COUNT(*) AS cnt,
       array_agg(id ORDER BY created_at) AS ids
FROM pointage_batches
GROUP BY tenant_id, chantier_id, date_pointage
HAVING COUNT(*) > 1
ORDER BY cnt DESC;

SELECT
  (SELECT COUNT(*) FROM pointages) AS pointages_total,
  (SELECT COUNT(*) FROM pointage_batches) AS batches_total;
```

Inventaire à jouer avant `make migrate` ERP-28 (n’empêche pas d’écrire le code).

---

## 7.4 — Mécanisme migrations SQL — TRANCHÉE

**Décision** : même que classification ADR §7.3 — **Liquibase out-of-process** via Job K8s `sektor-btp-lifecycle`. Pas de Flyway / Liquibase Spring. `ddl-auto: validate` reste.

Migrations Lot 1+ sous  
`products/sektor-btp/backend/modules/rh/src/main/resources/db/changelog/schema/v1.1/`  
→ `make migrate APP=sektor-btp`.

---

## Portée vague

| Lots | Vague ops |
|------|-----------|
| 1–2 (+ parties Lot 5 liées pointage) | Oui — « pointage fiable » |
| 3–4 | Epic ERP-26 P2 ; après Lot 2 ; Lot 3 attend comptable |
