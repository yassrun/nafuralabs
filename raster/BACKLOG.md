# BACKLOG (généré — ne pas éditer)

> Orchestrateur. Source canon = `<projet>/raster-src/lots/…`.
> Arbre = **le chemin** (lot / sous-lot / tasks) — pas un champ `parent:`.
> Lot et sous-lot sont des **dossiers** : leur état est dérivé, jamais stocké.
> Sprint = champ `sprint:` sur la **task** seulement.
> Regen : `node raster/regen.mjs` / `node raster/t.mjs index`.
> Inbox : `raster/inbox.md`.

## nafura-platform

- `approbation` lot
  - · `CH-01-TECHNICAL-plier` sous-lot
    - ▸ `PLT-125` tech — Plier l arbre approbation
- `conversation` lot
  - · `CH-01-TECHNICAL-plier` sous-lot
    - · `PLT-130` spec — SPEC + geler AC — plier conversation
    - · `PLT-131` tech — Plier l arbre conversation
- `identite` lot
  - · `CH-01-TECHNICAL-plier` sous-lot
    - · `PLT-118` spec — SPEC + geler AC — plier identite
    - · `PLT-119` tech — Plier l arbre identite
- `notification` lot
  - · `CH-01-TECHNICAL-plier` sous-lot
    - · `PLT-112` spec — SPEC + geler AC — plier notification
    - · `PLT-113` tech — Plier l arbre notification
- `socle` lot
  - · `CH-05-EVOL-consommateur-commentaire` sous-lot
    - · `PLT-108` spec — SPEC — consommateur commentaire
  - · `CH-06-EVOL-consommateur-notification` sous-lot
    - · `PLT-114` spec — SPEC — consommateur notification
  - · `CH-07-EVOL-consommateur-identite` sous-lot
    - · `PLT-120` spec — SPEC — consommateur identite
  - · `CH-08-EVOL-consommateur-approbation` sous-lot
    - · `PLT-126` spec — SPEC — consommateur approbation
  - · `CH-09-EVOL-consommateur-conversation` sous-lot
    - · `PLT-132` spec — SPEC — consommateur conversation

## raster

- `socle` lot
  - · `CH-03-CORRECTION-sans-vue-sprint` sous-lot
    - · `RAS-105` spec — SPEC + geler AC — retirer la vue Sprint
    - · `RAS-106` tech — Retirer la vue, le bouton et la route
- `work` lot
  - · `CH-04-CORRECTION-sans-sprint` sous-lot
    - · `RAS-102` spec — SPEC + geler AC — retirer le sprint du contrat
    - · `RAS-103` tech — Retirer le champ, la commande et SPRINT.md
    - · `RAS-104` qa — Preuves — plus de sprint dans le moteur

---

**17 live · 2 projets**
