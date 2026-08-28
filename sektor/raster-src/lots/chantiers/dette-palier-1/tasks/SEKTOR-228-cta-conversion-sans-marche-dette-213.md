---
id: SEKTOR-228
status: done-me
context: nafura
type: bug
agent_type: exec
priority: P1
assignee: agent
gate: none
tags: [etudes, conversion]
---

# CTA conversion sans marché (dette 213)

> Remplacer « Créer chantier et marché » par « Créer le chantier ». Dialog sans marché. Convertir inactif sans libellé.

Contrat : [`../CONTRAT.md`](../CONTRAT.md) AC-D2. Doublon périmètre [`../../../etudes/finition-parcours/tasks/SEKTOR-213-corriger-le-vocabulaire-et-securiser-le-formulai.md`](../../../etudes/finition-parcours/tasks/SEKTOR-213-corriger-le-vocabulaire-et-securiser-le-formulai.md).

## Étapes

- [x] i18n + header dossier : « Créer le chantier » (plus « et marché »).
- [x] Dialog conversion : vente = devis, pas de marché ; hints code/date/durée facultatifs.
- [x] Convertir disabled sans libellé ; API cohérente.
- [x] Preuve : grep + script API convertir → `marcheGenereId` nul.

## Preuves attendues

- Aucune occurrence visible « Créer chantier et marché » sur le geste conversion.
- `node sektor/e2e/scripts/verify-dette-conversion-228.mjs` → PASS.
- Capture dialog si Browser MCP dispo ; sinon API suffit.

## Journal

```
28/08 10:20  posée
28/08 10:20  status → doing
28/08 10:29  status → review
28/08 10:52  preuve verify-dette-conversion-228.mjs PASS
28/08 10:31  status → done-agent · gate none → done-me
```

## Rapport de livraison

**Changé.** CTA header `CONVERTIR` → « Créer le chantier ». Dialog : libellé obligatoire (`required` + `[disabled]="!canConvert()"`), hints facultatifs code/date/durée « avant l'OS » / « généré si vide », ordre libellé avant code. i18n `etudes.conversion.*` (fr/en). Backend `resolveChantierLabel` : refus `libelle_chantier_requis` si libellé envoyé vide ; fallback objet si absent du body (scripts API).

**Preuve.** `node sektor/e2e/scripts/verify-dette-conversion-228.mjs` → PASS (chrome + API libellé vide refusé + `marcheGenereId` nul + chantier `EN_PREPARATION` / `sourceVente=DEVIS`). Test unitaire `convertir_libelleVide_refuse`.

**Écarts.** Pas de capture UI desktop/390 (Browser MCP absent — couvert par SEKTOR-229).
