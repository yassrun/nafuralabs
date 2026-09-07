---
id: SEKTOR-317
status: done
context: nafura
type: feature
agent_type: exec
priority: P1
assignee: agent
blocked_by: [SEKTOR-316]
tags: [ui, api]
---

# Toggle contact principal fiche fournisseur

> Un seul `isPrimary` par fournisseur ; toggle fiche ; À par défaut sur la consultation.

## Étapes

- [x] API : exclusive primary create/update + liste principal en tête
- [x] UI fiche : colonne toggle + case à la création
- [x] Consultation : principal proposé en À
- [x] Canvas / contrat AC-5 + e2e

## Preuves attendues

```
node sektor/e2e/scripts/verify-consultation-contact-write-through.mjs
```

Mode B owner.

## Journal

```
04/09 16:23  posée
04/09 16:23  status → doing
04/09 16:35  toggle Principal + exclusive API ; e2e PASS
04/09 16:31  status → done
```

## Rapport de livraison

Onglet Contacts : colonne toggle Principal + case à la création. Un seul `isPrimary` par fournisseur (create/update clear les autres). Liste triée principal en tête → destinataire « À » sur la consultation. Preuve Mode B : `verify-consultation-contact-write-through.mjs` OK.
