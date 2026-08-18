---
id: PLT-109
status: done-me
context: nafura
type: spec
agent_type: spec
priority: P1
assignee: agent
gate: none
tags: [platform, notification]
sprint: 2026-W34
---

# SPEC + geler AC — notification

> Premier contrat du BC notification. Coupe notifier / transporter. AC gelés dans le CH.

## Étapes

- [x] Lire CADRE, socle, CH, jar `collaboration/notification` (lecture)
- [x] Écrire `pact/notification/SPEC.md` (une page, vérité observée + coupe)
- [x] Confirmer les AC gelés ; nommer scénarios e2e `notification-*` + état initial dans le CH
- [x] Journal + rapport de livraison
- [x] `index` + `check`

## Journal

```
16/08 14:15  posée
17/08 21:08  sprint → 2026-W34
17/08 21:09  status → doing
17/08 21:20  SPEC.md créée · coupe AC-2 tranchée (canal → ops) · scénarios e2e nommés
17/08 21:12  status → done-agent · gate none → done-me
```

## Rapport de livraison

**ce qui a changé**
`nafura-platform/pact/notification/SPEC.md` créée. `CH.md` : coupe écrite + 4 scénarios e2e nommés. AC non dégélés.

**critères couverts par le contrat**
AC-1 SPEC + `not_owns` (chaque exclusion nomme qui) · AC-2 coupe écrite (notifier ≠ transporter ; canal → ops) · AC-3 scénarios nommés pour l'exec (preuve = PLT-110/111) · AC-4 un lecteur de la SPEC sait si le besoin est « prévenir une personne » · AC-5 zéro règle devis/chantier/paie/ERP dans la SPEC.

**décidé seul**
Canal (e-mail, push) → **ops**, pas le BC. Le BC notifie (message, boîte, préférence). Pattern impression / Gotenberg. Le jar envoie encore via Brevo ; plier = `CH-01-TECHNICAL-plier`. Courrier documentaire (modèle + pièce) hors contrat. Pas de canvas (écran hors INIT). `P-NOTIFICATION-LIRE` / `MARQUER` / `DEPOSER` déclarés dans la SPEC ; matrice socle = CH consommateur.

**écarts / dette**
AC-3 non prouvé ici (exec+qa). Jar encore mêlé (ERP, Brevo, templates) — hors périmètre. Socle non patché (consommateur = autre CH). SPEC extraction dit encore « Notification (non spécifié) » — pas ce Change.
