# Compléter le parcours étude

> Un chargé d’étude avance **uniquement avec les CTA** (Continuer / Voir la synthèse) et voit le PU **sans recharger**. Walk 2 DE-0036.

## Verdict

CTA d’abord (sinon le parcours n’est pas un parcours). Refresh arbre ensuite (même page Coût). QA walk en dernier.

## Constat

Walk QA 20/08 DE-0036 : footer Continuer focus sans changer d’étape ; header « Voir la synthèse » → `allerAEtapeUi(3)` bloqué par maxUi ; Extraire écrit le DPGF mais l’arbre garde « — » jusqu’au reload.

## Approche technique

Front `dossier-detail` (`suivant`, `onHeaderAction`), wizard-shell / `nf-button-list`, `decomposition-workspace` (close drawer / reload DPGF). Pas de Pact.

## Tasks

| # | Task | blocked_by | // OK |
|---|------|------------|-------|
| 1 | SEKTOR-129 CTA Continuer / Voir la synthèse | — | — |
| 2 | SEKTOR-130 Arbre Coût PU après Extraire | — | **oui** avec 1 |
| 3 | SEKTOR-131 Preuves | 129, 130 | non |

## Couverture

Walk DE-0036 restes. Hors : Extraire incertain, Playwright dual-require, Mockito 21.

## Décisions ouvertes

Aucune — les deux bugs sont observés.
