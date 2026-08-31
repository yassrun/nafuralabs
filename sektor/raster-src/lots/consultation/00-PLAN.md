# Consultation — objet Achats

> Une consultation = demande de prix fournisseur (Achats). Popup depuis l’étude. Devis = import magique. Flag CONSULTÉ seulement si liée.

RFQ 28/08 (1 panier + N destinataires) : sous-lot [`destinataires-envoi-suivi/`](destinataires-envoi-suivi/). Ce plan = chrome 134–249 (livré).

## Verdict

Objet + menu d’abord (sinon rien à lier). Import devis ensuite. Overlay 23/08 : liste liées, pas formulaire. Flag en dernier. Canvas : `ux/consultation-achats-wireframe.canvas.tsx`.

## Constat

Walk 22/08 : panneau page Coût mange l’arbre ; DA = chantier → BC ; gel 20/08 collait l’objet au dossier.

## Approche technique

Nouveau agrégat **achats/** (pas `consultations_etudes` dossier, pas DA, pas `OffreFournisseur`). Chrome `erp-nav` Achats / expression. Études consomme (overlay + flag). Lab Liquibase clean. Raster autonome. Contrat [`DECISIONS-PRODUIT.md`](../../DECISIONS-PRODUIT.md) § 22/08 + overlay 23/08.

## Tasks

| # | Task | blocked_by | Statut |
|---|------|------------|--------|
| 1 | SEKTOR-134 Objet + menu Achats | — | **done** · `verify-consultation-achat-134.mjs` |
| 2 | SEKTOR-135 Import magique devis | 134 | **done** · `verify-consultation-achat-135.mjs` |
| 3 | SEKTOR-136 Popup décompo (formulaire) | 134 | **annulé** — remplacé par 139 |
| 4 | SEKTOR-137 Flag CONSULTÉ N devis liés | 135 | **done** · `verify-consultation-achat-137.mjs` |
| 5 | SEKTOR-138 Preuves | 134–137 | absorbé par **SEKTOR-249** |
| 6 | SEKTOR-139 Overlay liste liées | — | **done** · `verify-consultation-achat-139.mjs` |
| 7 | SEKTOR-140 Preuves overlay | 139 | absorbé par **SEKTOR-249** |
| 8 | SEKTOR-249 QA agrégat | — | **review** |

## Preuves (28/08)

Agrégat : `node sektor/e2e/scripts/verify-consultation-achat-249.mjs` (134 · 135 · 137 · 139 · skip 136).

## Couverture

Gel 22/08 + overlay 23/08. Hors : DA chantier, AO achats, portail invité chrome-less (inbox), match Extraire incertain, cycle de statuts consultation (ouvert).

## Décisions ouvertes

Aucune — prêt.
