---
id: ERP-26
status: todo
context: nafura
assignee: me
kind: feature
feature: rh-pointage-raffinement
priority: P1
tags: [sektor, rh, pointage]
---

# Feature — Raffinement RH / pointage

> Spec : `products/sektor-btp/docs/specs/epics/_archive/rh-pointage-raffinement/00-PLAN.md`
> Remplace / absorbe l’ancien ERP-04 (raffiner RH lot 4).

## Modèle cible
- Pointage = pièce UUID, unicité métier, pas d’écrasement silencieux
- `valider()` contrôle + produit les HS (matrice §4.3)
- Paie lit HS validées + `parametres_paie` datés (Lot 3)
- Coût MO remonte au chantier via `mode_imputation` (Lot 4)

## Enfants
- ERP-27 — Décisions ouvertes §7 (bloque Lot 1)
- ERP-28 — Lot 1 Pointage infalsifiable
- ERP-29 — Lot 2 Validation contrôle et produit
- ERP-30 — Lot 3 Paie juste et paramétrée
- ERP-31 — Lot 4 Coût remonte au chantier
- ERP-32 — Lot 5 Intégrité et nettoyage

## Portée vague ops
Lots **1–2** (+ nettoyage pointage du Lot 5) = flux mince « pointage fiable ».
Lots **3–4** = chaîne paie / coût chantier — dans l’epic, après Lot 2 ; Lot 3 attend validation comptable (§4.5).

## Journal
```
05/08 16:05  balayage · promu depuis 00-PLAN.md · ERP-04 mergé ici
05/08 19:40  ERP-27 done · ADR §7 marché MA · Lot 1 (ERP-28) débloqué
05/08 20:15  ERP-28 done · pointage UUID + UNIQUE
```
