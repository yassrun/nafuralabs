# Listing, create et overlay étude — chrome RFQ

> CTA sans ++, filtres fournisseur / article / statut, create nf-action-bar, overlay N destinataires.

RFQ déjà livré : destinataires-envoi-suivi. `/new` reste panier d'abord. Destinataires = fiche. Humain a demandé l'impl sans canvas.

## Décisions

- Listing CTA = icône plus + libellé « Nouvelle consultation » (pas `+ Consultation`).
- Filtres : statut, fournisseur, article, lien étude. Query API `statut` / `fournisseurId` / `articleId` / `lien` / `search`.
- Create : `nf-action-bar`, Créer inactif tant que panier vide. Pas de fournisseur sur `/new`.
- Overlay étude : N destinataires + k/n. Create overlay = article courant + lien étude, 0 champ fournisseur. Flag CONSULTÉ hors.

## Preuves

```bash
node sektor/e2e/scripts/verify-consultation-ux-listing-create-etude.mjs
node sektor/e2e/scripts/verify-consultation-achat-139.mjs
```

## Tasks

| # | Task | agent_type | blocked_by |
|---|---|---|---|
| 1 | SEKTOR-306 Spec | spec | — · gate: me |
| 2 | SEKTOR-307 Listing | exec | 306 |
| 3 | SEKTOR-308 Create | exec | 307 |
| 4 | SEKTOR-309 Overlay | exec | 308 |
| 5 | SEKTOR-310 Preuves | qa | 307, 308, 309 |
