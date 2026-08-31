# Preuves homog

> Scripts Mode B + gates rg vs baseline CONTRAT.

## Intention

QA indépendant prouve les 4 modules chrome sans inventer du vert.

## Périmètre

Inclus : `verify-homog-etudes|chantiers|catalogue|achats.mjs` + agrégat counts.
Exclus : Playwright flaky C:/ ; preuves métier hors chrome.

## Tasks

| # | Task | agent_type | blocked_by |
|---|------|------------|------------|
| 1 | Scripts + exécution Mode B | qa | etudes + chantiers + catalogue + achats chrome |

## Preuves attendues

Quatre scripts verts Mode B owner ; `rg` button/select en baisse vs LOT baseline sur périmètres ciblés.
