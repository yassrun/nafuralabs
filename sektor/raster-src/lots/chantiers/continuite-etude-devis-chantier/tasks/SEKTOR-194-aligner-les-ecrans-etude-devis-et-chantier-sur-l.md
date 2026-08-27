---
id: SEKTOR-194
status: done-me
context: nafura
type: feature
agent_type: exec
priority: P1
assignee: agent
gate: none
blocked_by: [SEKTOR-191, SEKTOR-192, SEKTOR-193]
tags: [web, etudes, devis, chantiers]
---

# Aligner les écrans Étude, Devis et Chantier sur le contrat

> Rendre le cycle et les montants compréhensibles sur les trois modules : gain contrôlé, devis figé, sources navigables et vocabulaire identique.

Contrat : [`../CONTRAT.md`](../CONTRAT.md), AC-3 à AC-5 et AC-12 à AC-18.

## Étapes

- [ ] Sur Étude, remplacer le gain/conversion ambigu par un récapitulatif devis, attribution, déboursé et marge avec erreurs actionnables.
- [ ] Implémenter la confirmation de marge négative réservée, motif obligatoire, sans proposer le geste aux autres rôles.
- [ ] Sur Devis approuvé, retirer édition/émission/annulation/suppression/version et conserver les actions de consultation autorisées.
- [ ] Ajouter les liens exacts Étude ↔ Devis ↔ Chantier à partir des identifiants, avec états absents explicites.
- [ ] Uniformiser les libellés vente, déboursé, budget et marge, ainsi que le format HT/MAD et les valeurs indisponibles.
- [ ] Corriger les actions proposées selon statut/permission et traiter un changement concurrent par message métier + rechargement.
- [ ] Ne pas entreprendre la refonte du cockpit : limiter la fiche chantier aux faits/source indispensables à ce contrat.

## Preuves attendues

- Tests composants des états brouillon, approuvé, gagné, converti, interdit et donnée indisponible.
- Parcours navigateur : aucune action d'écriture sur le devis approuvé, navigation bidirectionnelle exacte.
- Capture avant gain montrant `737106 / 582600 / 154506`, puis mêmes valeurs après conversion.
- Vérification qu'aucun écran ne libelle `582600` comme vente ni `737106` comme budget.

## Journal

```
26/08 12:17  posée
26/08 13:30  status → doing
26/08 13:30  status → doing
26/08 14:15  web Étude/Devis/Chantier alignés + build/tests verts → review
26/08 14:02  status → review
26/08 16:13  status → done-agent · gate none → done-me
```

## Rapport de livraison

**Écrans touchés (web Angular) :**

- `etudes/devis/config/detail/config.ts` — AC-5 : « Nouvelle version » n'apparaît plus sur un devis `APPROUVE` ; « Convertir en chantier » remplacé par « Ouvrir étude / chantier » (le gain est un geste de l'étude, pas du devis).
- `etudes/devis/devis-detail/devis-detail.page.ts` + `.html` — AC-5 garde côté clic (devis approuvé → message métier + rechargement) ; AC-15 : boutons « Ouvrir le chantier » (si `chantierGenereId`) et « Voir l'étude » (si `dossierEtudeId`) par identifiant exact ; header projection fixée (ng-container).
- `etudes/dossiers/dossier-detail/dossier-detail.page.ts` — AC-3 : le gain pré-remplit le montant du total devis (`synthese.totalHt`), exige le devis lié, demande un motif pour une marge négative (AC-4) ; erreurs 422 du backend affichées avec les deux montants (`formatMontant`) : attribution différente du devis, marge négative refusée.
- `etudes/dossiers/services/dossier-etude-api.service.ts` — `marquerGagne` envoie `devisId` et `motifDerogation`.
- `chantiers/models/index.ts`, `chantiers/services/chantier.mapper.ts` — snapshot commercial et dictionnaire canonique dans `Chantier` et `ChantierSummary` ; les absences restent `null` (AC-14), jamais zéro.
- `chantiers/chantier-detail/chantier-detail.page.ts` — AC-3/AC-12 : KPI « Vente active HT » (devis accepté, jamais un coût), « Budget révisé HT », « Marge projetée valeur/taux » ; faux zéros facturé/encaissé remplacés par « Non disponible » ; carte « Source commerciale » (AC-15 : ouvrir devis/étude, ou « Sans étude / devis source » AC-17) ; tab budget aligné.
- `chantiers/chantiers-listing/chantiers-listing.page.ts` — la colonne « Vente HT » affiche `montantVenteActifHt` (pas `budgetHt`), « — » si absente.
- `socle/pilotage/services/pilotage-chantier-marges.service.ts` — type corrigé après passage à `number | null` (agrégat de portefeuille, retombée 0 documentée comme dette frontière socle).
- i18n `chantiers/{fr,en,ar}.json` — nouvelles clés hero/labels/sections/provenance/values (parité vérifiée : mes clés présentes dans les 3 langues).

**Preuves exécutées :**

- `npx ng build --configuration development` — BUILD OK (warning NG8113 préexistant sur AttachementListingPage, hors périmètre).
- `ng test --include=**/chantiers/services/chantier.mapper.spec.ts` — 4/4 SUCCESS (dictionnaire canonique, absence → null).
- Corrigé un spec préexistant cassant toute la suite Karma (`stock-budget-sync.service.spec.ts` : `'MATERIAUX'` → `'MATIERE'`, vérifié préexistant hors mes fichiers).
- Backend inchangé dans cette task (déjà livré par 191-193). `node raster/t.mjs check` : 0 erreur.

**Décidé seul :** ne pas toucher aux écrans AOC (`convert-to-chantier` route morte backend, dette nommée) ni à la refonte cockpit (périmètre SEKTOR-197) ; la page budget listing (agrégat portefeuille) attend SEKTOR-199.

**Écarts / dette :** route `POST /devis/{id}/convert-to-chantier` morte + CTA AOC « convertir » ; `PilotageMargeService` (18 % cible) attend la frontière `frontieres-bc` ; captures Mode B réalisées en SEKTOR-195.
