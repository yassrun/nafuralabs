---
id: SEKTOR-215
status: todo
context: nafura
type: feature
agent_type: exec
priority: P1
assignee: agent
gate: none
blocked_by: [SEKTOR-214]
tags: [etudes, catalogue]
---

# Tracer la decision Catalogue des composants LIBRE

> Après gain ou conversion, chaque composant autrefois LIBRE montre la décision prise, l'item créé ou lié, et un lien Catalogue.

Contrat : [`../CONTRAT.md`](../CONTRAT.md) AC-10.

## Étapes

- [ ] Persister décision `POSTE_SEULEMENT | CREE_ET_LIE | RATTACHE_EXISTANT | IGNORE_MOTIF` + acteur + date + itemId.
- [ ] Exposer la trace sur la synthèse et sur un dossier `CONVERTIE` en lecture seule.
- [ ] Lien Catalogue si `itemId` ; ignorer exige un motif.
- [ ] Un LIBRE sans décision reste un WARNING (consommé par SEKTOR-211).

## Preuves attendues

- Un LIBRE créé et lié : item visible + navigation Catalogue.
- Un LIBRE ignoré : motif visible après conversion.
- Retry / double clic : pas de second item (idempotence existante Catalogue).

## Journal

```
27/08 21:58  posée
```

## Rapport de livraison

