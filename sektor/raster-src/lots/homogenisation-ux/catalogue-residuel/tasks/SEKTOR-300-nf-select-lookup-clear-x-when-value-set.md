---
id: SEKTOR-300
status: review
context: nafura
type: feature
agent_type: exec
priority: P1
assignee: agent
gate: none
tags: [homog, lookup]
---

# nf-select lookup clear X when value set

> Valeur posée : libellé en lecture seule + croix dans le champ. Clic X vide le champ ; la saisie n'est possible que si la valeur est vide.

## Étapes

- [x] Canvas + AC-15 (croix = effacer)
- [x] `nf-select` readonly + × interne ; clic vide le champ et refocus
- [x] Preuve `verify-lookup-combobox-300.mjs`

## Preuves attendues

- `node sektor/e2e/scripts/verify-lookup-combobox-300.mjs`
- Fiche article · Famille déjà posée : `| libellé  × |` ; clic × → champ vide, on peut retaper

## Journal

```
01/09 11:29  posée
01/09 11:29  status → doing
01/09 11:32  AC-15 : readonly + croix interne ; preuve 300 OK
01/09 11:31  status → review
```

## Rapport de livraison

### Ce qui a changé

- Combobox FK : valeur posée = lecture seule + croix **dans** le champ. Clic × → `''`, focus, saisie possible.
- Pas de frappe tant qu’un id est posé (`readonly`, pas `disabled`).
- Canvas « Valeur + oeil » et contrat AC-15.

### Preuves exécutées

- `node sektor/e2e/scripts/verify-lookup-combobox-300.mjs` → OK

### Décidé seul

- Croix aussi sur champ requis (sinon on ne peut plus changer).
- Refocus après clear pour enchaîner la recherche.

### Écarts / dette

- Pas de clic browser MCP dans cette session.
