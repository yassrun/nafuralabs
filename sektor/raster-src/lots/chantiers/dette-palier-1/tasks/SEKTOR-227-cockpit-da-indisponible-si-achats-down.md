---
id: SEKTOR-227
status: done-me
context: nafura
type: feature
agent_type: exec
priority: P1
assignee: agent
gate: none
tags: [chantiers, cockpit, achats]
---

# Cockpit DA indisponible si Achats down

> Si `GET /demandes-achat?chantierId=` échoue, la tuile DA dit **indisponible**, jamais « 0 ».

Contrat : [`../CONTRAT.md`](../CONTRAT.md) AC-D1. Scénario acte 3 § panne Achats.

## Étapes

- [x] Lire le compteur / module DA cockpit (backend read-model ou front) et distinguer `0` vs `indisponible`.
- [x] En cas d’erreur port Achats : degradation cockpit + i18n, pas de faux zéro.
- [x] Preuve : extension `verify-alqods-scenario-226.mjs` ou script dédié simulant l’échec (mock port, test unitaire service, ou endpoint injoignable documenté).

## Preuves attendues

- Cockpit EN_COURS : tuile DA `NOT_AVAILABLE` / « indisponible » quand la liste DA throw.
- Chantier reste lisible ; autres modules OK.
- `node sektor/e2e/scripts/verify-dette-cockpit-achats-227.mjs` (ou section 226) → PASS.

## Journal

```
28/08 10:20  posée
28/08 10:21  status → doing
28/08 10:31  status → review
28/08 10:31  status → done-agent · gate none → done-me
```

## Rapport de livraison

**Backend.** `CockpitChantierDto.OpsDto` / `CompteurDto` ; `DemandeAchatCockpitPort` + adapter (count repository) + NoOp ; `CockpitChantierService.ops()` via `lireSansPlanter` — panne → `NOT_AVAILABLE` + `degradations[]`, jamais `valeur: 0` menteur.

**Front.** Tuile module DA (`moduleKey: demandeAchat`) affiche le compteur ou « Indisponible » (`afficheCompteur`).

**Preuve.** `node sektor/e2e/scripts/verify-dette-cockpit-achats-227.mjs` → **PASS** (chrome + 3 tests unitaires panne/compte/absent EN_PREPARATION + Mode B alignement GET).

**Tests.** `CockpitChantierServiceTest` — 3 nouveaux cas SEKTOR-227 verts.
