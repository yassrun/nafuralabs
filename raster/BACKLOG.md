# BACKLOG (généré — ne pas éditer)

> Orchestrateur. Source canon = `<projet>/raster-src/lots/…`.
> Arbre = **le chemin** (lot / sous-lot / tasks) — pas un champ `parent:`.
> Lot et sous-lot sont des **dossiers** : leur état est dérivé, jamais stocké.
> Sprint = champ `sprint:` sur la **task** seulement.
> Regen : `node raster/regen.mjs` / `node raster/t.mjs index`.
> Inbox : `raster/inbox.md`.

## nafura-platform

- `approbation` lot
  - · `CH-00-INIT-approbation` sous-lot
    - · `PLT-121` spec — SPEC + geler AC — approbation
    - · `PLT-122` tech — Baseline e2e approbation
    - · `PLT-123` qa — Preuves — baseline approbation
  - · `CH-01-TECHNICAL-plier` sous-lot
    - · `PLT-124` spec — SPEC + geler AC — plier approbation
    - · `PLT-125` tech — Plier l arbre approbation
- `commentaire` lot
  - · `CH-00-INIT-commentaire` sous-lot
    - · `PLT-103` spec — SPEC + geler AC — commentaire
    - · `PLT-104` tech — Baseline e2e commentaire
    - · `PLT-105` qa — Preuves — baseline commentaire
  - · `CH-01-TECHNICAL-plier` sous-lot
    - · `PLT-106` spec — SPEC + geler AC — plier commentaire
    - · `PLT-107` tech — Plier l arbre commentaire
- `conversation` lot
  - · `CH-00-INIT-conversation` sous-lot
    - · `PLT-127` spec — SPEC + geler AC — conversation
    - · `PLT-128` tech — Baseline e2e conversation
    - · `PLT-129` qa — Preuves — baseline conversation
  - · `CH-01-TECHNICAL-plier` sous-lot
    - · `PLT-130` spec — SPEC + geler AC — plier conversation
    - · `PLT-131` tech — Plier l arbre conversation
- `identite` lot
  - · `CH-00-INIT-identite` sous-lot
    - · `PLT-115` spec — SPEC + geler AC — identite
    - · `PLT-116` tech — Baseline e2e identite
    - · `PLT-117` qa — Preuves — baseline identite
  - · `CH-01-TECHNICAL-plier` sous-lot
    - · `PLT-118` spec — SPEC + geler AC — plier identite
    - · `PLT-119` tech — Plier l arbre identite
- `impression` lot
  - · `CH-02-EVOL-sans-facture` sous-lot
    - ▸ `PLT-95` feature — Sortir la forme facture du jar
    - · `PLT-96` qa — Preuves — impression sans facture
- `notification` lot
  - · `CH-00-INIT-notification` sous-lot
    - · `PLT-109` spec — SPEC + geler AC — notification
    - · `PLT-110` tech — Baseline e2e notification
    - · `PLT-111` qa — Preuves — baseline notification
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

**37 live · 2 projets**
