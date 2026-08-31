# Contrat actions et filtres

> Geler le CONTRAT d’homogénéisation + canvas des gestes. Gate humaine avant exec chrome.

Contrat lot : [`../CONTRAT.md`](../CONTRAT.md) (AC-1…AC-14).
Canvas : [`ux/actions-et-filtres-wireframe.canvas.tsx`](ux/actions-et-filtres-wireframe.canvas.tsx).

## Intention

Quand ce sous-lot est livré, le CONTRAT est approuvé (`gate: me`) et le canvas décrit listing / form court / form long sticky / detail retour / dialog footer.

## Périmètre

Inclus : CONTRAT.md lot, canvas, baseline chiffrée, Tasks suivantes débloquées.
Exclus : code produit feature (sauf tech sticky `nf-action-bar` si gap bloquant).

## Approche

1. Spec écrit CONTRAT + canvas.
2. Si `nf-action-bar` n’a pas sticky : tech minimal anatomy (`sticky` input).
3. Gate humaine.

## Tasks

| # | Task | agent_type | blocked_by |
|---|------|------------|------------|
| 1 | CONTRAT + canvas actions/filtres | spec | — · `gate: me` |
| 2 | Sticky `nf-action-bar` si manquant | tech | 1 |

## Preuves attendues

- CONTRAT AC-1…AC-14 présents
- Canvas ouvre les 5 vues : listing, form-court, form-long, detail-retour, dialog
- Approve gate me sur la task spec

## Décisions ouvertes

Aucune — arbitrages du plan Cursor 31/08 repris.
