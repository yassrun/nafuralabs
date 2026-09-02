---
id: SEKTOR-303
status: review
context: nafura
type: feature
agent_type: exec
priority: P2
assignee: agent
gate: none
tags: [ui, etudes, chrome]
---

# chrome etude: stepper etats + action bar

> Forme stepper (check/bleu/fantome/badge) + split header infos vs nf-action-bar. QA humain, pas d agent qa.

## Étapes

- [x] Stepper anatomy : check / bleu / fantôme / badge incomplet (plus de vert = « passé »)
- [x] Header dossier : bande infos (KPI) séparée de `nf-action-bar`
- [x] Masquer Soumettre / Continuer structure dans le header (déjà dans le footer wizard)
- [x] Garder « Voir la synthèse » en secondaire header (preuve SEKTOR-129)
- [x] Brancher `incompleteStepIndexes` depuis les gates visitées
- [x] Preuves unitaires (12) — QA écran laissé à l’humain

## Journal

```
01/09 12:23  posée
01/09 12:23  status → doing
01/09 12:29  livré chrome + stepper ; tests unitaires 12/12
01/09 12:29  status → review
```

## Rapport de livraison

Chrome étude en trois bandes : infos (titre, badges, KPI) → `nf-action-bar` (Partager / Imprimer / Réouvrir + jump ou primary dossier) → stepper `nf-wizard-shell` → footer wizard.

Stepper : une seule teinte (accent courant). Complet = check neutre. À venir = numéro fantôme. Incomplet = check + `!` sur une étape déjà quittée qui a encore des problèmes de gate. Le vert ne veut plus dire « j’ai cliqué Continuer ».

Soumettre le chiffrage n’est plus dans le header à l’étape 4 (footer seulement). `Voir la synthèse` reste un bouton secondaire du header (SEKTOR-129).

### Preuves

- `npx ng test --include='**/dossier-etape.util.spec.ts' --include='**/dossier-header-cta.util.spec.ts' --include='**/wizard-step-state.util.spec.ts'` → 12 SUCCESS
- `node sektor/e2e/scripts/verify-homog-etudes.mjs` → PASS

QA écran / Mode B : volontairement pas joué (demande humaine).

### Décidé seul

- Incomplet jamais sur l’étape courante ni à venir.
- Alerte `part_couts_estimes` exclue du badge Coût (reste dans le corps Synthèse).
- Canvas : `raffinement-etude/ux/dossier-chrome-stepper-wireframe.canvas.tsx`

### Écarts

- Pas de preuve Playwright (humain).
- `libelleUiEtape(4)` attendait encore « Décomposition » ; assertion alignée sur « Coût ».
