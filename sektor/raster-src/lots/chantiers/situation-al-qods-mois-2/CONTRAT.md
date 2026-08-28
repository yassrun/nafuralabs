# Contrat — Al Qods mois 2 : situation cumulative

> Hérite mois 1 [`../situation-al-qods-mois-1/CONTRAT.md`](../situation-al-qods-mois-1/CONTRAT.md) et voisin [`../situation-et-retenues/CONTRAT.md`](../situation-et-retenues/CONTRAT.md) AC-4, AC-6.

> Plan : [`00-PLAN.md`](00-PLAN.md). Scénario : [`SCENARIO.md`](SCENARIO.md). UX : [`ux/situation-al-qods-mois-2-wireframe.canvas.tsx`](ux/situation-al-qods-mois-2-wireframe.canvas.tsx).

## AC-M2-1 — Attachement octobre = quantités neuves

Période 01/10–31/10. Lignes montées depuis déclarations octobre uniquement. Septembre déjà consommé → **absent** (voisin AC-16).

## AC-M2-2 — Chevauchement refusé

Deux attachements non annulés ne chevauchent pas (voisin AC-10).

## AC-M2-3 — Situation n°2 consomme attachement octobre signé

Un seul attachement octobre `SIGNE_MOE` non consommé → situation n°2 (voisin AC-4).

## AC-M2-4 — Cumul

`cumulPrecedentHt` = `cumulCourantHt` situation n°1. `travauxPeriodeHt` = montant octobre seul. `cumulCourantHt` = somme (voisin AC-6).

## AC-M2-5 — Interne / ST 0 m² exclus

Comme mois 1 (AC-M4 mois 1).

## AC-M2-6 — RG / avance 2e période

Calculées sur travaux période octobre, taux chantier inchangés.

## AC-M2-7 — Refus sans attachement octobre signé

Message explicite si génération n°2 sans `SIGNE_MOE` octobre.

## AC-M2-8 — Preuve enchaînée

Script mois-2 **fabrique ou reprend** graphe mois-1 complet puis enchaîne octobre — pas DE-0103.
