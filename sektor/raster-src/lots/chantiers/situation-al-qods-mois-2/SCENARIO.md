# Scénario — Al Qods mois 2 (octobre)

> Reprend [`../situation-al-qods-mois-1/SCENARIO.md`](../situation-al-qods-mois-1/SCENARIO.md) : septembre **déjà** attaché et situation n°1 générée.

## État initial

- Situation n°1 **BROUILLON** ou validée — cumul courant = travaux septembre.
- Attachement septembre **consommé** par situation n°1.
- BL acier partiel (12/25 t) peut exister (226) — hors preuve mois 2 sauf cockpit trou réel.

## Octobre — terrain

| Nœud | Quantité | Date | Note |
|---|---|---|---|
| 2.1 | 10 m³ | 15/10 | suite béton (ne reprend pas les 40 m³ sept) |
| Installation (interne) | 1 fft | 20/10 | budget oui, attachement **non** |
| 3 étanchéité | 0 m² | — | contrat ST, absent client |

Refus : attachement octobre qui chevauche septembre ou reprend les 40 m³ déjà attachés.

## Fin de mois octobre

1. Attachement période **01/10–31/10** → ligne **2.1 : 10 m³** seulement.
2. MOE signe → `SIGNE_MOE`.
3. Situation **n°2** :
   - `cumulPrecedentHt` = cumul n°1
   - `travauxPeriodeHt` = valorisation octobre (10 m³)
   - `cumulCourantHt` = cumul précédent + période
   - RG / avance sur travaux période octobre
4. Interne et étanchéité **absents** de l’attachement et de la situation n°2.

## Discriminants QA

1. Septembre non reproposé dans attachement octobre.
2. Situation n°2 cumul cohérent (≠ situation n°1 seule relue).
3. Interne absent attachement + situation octobre.
4. Étanchéité 0 m² absent situation n°2.
