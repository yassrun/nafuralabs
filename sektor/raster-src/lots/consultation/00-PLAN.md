# Consultation — objet Achats

> Une consultation = demande de prix fournisseur (Achats). Popup depuis l’étude. Devis = import magique. Flag CONSULTÉ seulement si liée.

## Verdict

Objet + menu d’abord (sinon rien à lier). Import devis ensuite. Overlay 23/08 : liste liées, pas formulaire. Flag en dernier. Canvas : `ux/consultation-achats-wireframe.canvas.tsx`.

## Constat

Walk 22/08 : panneau page Coût mange l’arbre ; DA = chantier → BC ; gel 20/08 collait l’objet au dossier.

## Approche technique

Nouveau agrégat **achats/** (pas `consultations_etudes` dossier, pas DA, pas `OffreFournisseur`). Chrome `erp-nav` Achats / expression. Études consomme (overlay + flag). Lab Liquibase clean. Raster autonome. Contrat [`DECISIONS-PRODUIT.md`](../../DECISIONS-PRODUIT.md) § 22/08 + overlay 23/08.

## Tasks

| # | Task | blocked_by | // OK |
|---|------|------------|-------|
| 1 | SEKTOR-134 Objet + menu Achats | — | — |
| 2 | SEKTOR-135 Import magique devis | 134 | — |
| 3 | SEKTOR-136 Popup décompo (retire panneau) | 134 | **oui** avec 2 |
| 4 | SEKTOR-137 Flag CONSULTÉ N devis liés | 135, 136 | non |
| 5 | SEKTOR-138 Preuves | 134–137 | non |
| 6 | SEKTOR-139 Overlay liste liées (casse le formulaire 136) | — | — |
| 7 | SEKTOR-140 Preuves overlay | 139 | non |

## Couverture

Gel 22/08 + overlay 23/08. Hors : DA chantier, AO achats, portail invité chrome-less (inbox), match Extraire incertain, cycle de statuts consultation (ouvert).

## Décisions ouvertes

Aucune — prêt.
