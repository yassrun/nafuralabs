# Raster — carte app

**Statut :** INIT (baseline `DISCOVERED` → contrat)

Orchestrateur de travail. Surfaces : CLI (`t.mjs`) + UI locale (`web/`). Même app, même Change.

## Intention

Voir et faire avancer le travail (inbox → backlog → sprint) sans base, sans auth, à partir des fichiers Git.

## Owns

- Shell 3 vues, capture inbox, arbre backlog, sprint ISO
- Scan des tickets `raster-src/` (et legacy strangler)
- Regen INDEX / BACKLOG.md / SPRINT.md

## Not owns

- SPEC / canvas / CH Pact (`pact/` n’est **pas** indexé)
- Métier Sektor / platform
- Auth, multi-user, Kanban, estimés

## Carte

| Contexte | Rôle |
|----------|------|
| **socle** | Chrome : nav Inbox · Backlog · Sprint, capture, détail, pas d’auth |
| **work** | Contrat tickets : lot · sous-lot · task, `parent:`, `type`, `status`, `sprint:` |

Pas d’autre BC. Les 3 vues sont des **écrans du BC work** + chrome socle — pas 3 BC.

## PLATFORM_CONSUMED

Aucun (fichiers locaux). Pas d’IAM platform.
