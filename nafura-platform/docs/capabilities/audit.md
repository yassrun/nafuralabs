# Audit (`cap.audit`)

## Identité

| | |
|---|---|
| Catalogue | `cap.audit` |
| Modules | `audit`, `audit-api` |
| Requires | `cap.access` |
| Note | **~8/10** (post correctifs flushPending, `status_change`, détail UI, HostRecordGate, lien journal) |

## État

**Capture.** `@Auditable(entityType, trackedFields)` sur l’entité : création, modification, suppression et transition → `audit_events`. Si seuls les champs tracked changent et que c’est uniquement `status`, l’action émise est `status_change` (sinon `update`). Les écritures passent par un flush fiable (`flushPending`) pour ne pas perdre d’événements en fin de requête.

**Timeline fiche.** Section `kind: 'audit'` ([UI.md](../UI.md)). Lecture `GET /api/v1/platform/collaboration/audit/timeline` avec `@HostRecordGate` (même contrat que commentaires / pièces jointes) : permission du record (lecture pour voir), clé d’entité = `lifecycle.entity` sinon dernier segment du mapping.

**Journal admin.** Permission `administration.audit.read` : liste tous les événements du tenant. « Voir l’entité » résout l’URL via `HostBusinessContext.records` (comme les notifications). Détail d’événement exposé en UI (champs / valeurs utiles, pas une ligne opaque).

**Export.** Export CSV du journal (parcours admin).

**Tenancy.** Événements scopés à l’organisation courante ; pas de fuite cross-tenant via timeline ou journal.

## Contrat

- BC : annoter les entités métier pertinentes `@Auditable` ; ne pas écrire un second journal.
- Fiche : section `kind: 'audit'` — pas de composant parallèle.
- Admin : une permission `administration.audit.read` pour le journal global ; la timeline fiche reste sur la permission du record.

## Hors scope

- Grade « enterprise » (rétention légale multi-années, export SIEM temps réel, immutabilité WORM) : pas le prochain lot.
- Audit des lectures (access log exhaustif) — hors modèle actuel `audit_events` écriture.

## Roadmap

| Lot | Livrable | Done quand |
|---|---|---|
| 1 | **Couverture demo BC** élargie | entités demo pertinentes annotées ; timeline non vide sur les fiches clés en lab |
| 2 | **Libellés / détails i18n** systématiques | actions et champs affichés via clés / labels cohérents FR (et i18n plateforme), plus de codes bruts côté UI admin + fiche |
| 3 (plus tard) | Rétention / export SIEM | politique de rétention configurable + export machine ; seulement après lots 1–2 |

## Vérifier

1. `node platform-host/ops/run.mjs check`
2. Lab : créer / modifier / transitionner un record `@Auditable` → ligne timeline + journal admin.
3. Transition statut seul → action `status_change`.
4. « Voir l’entité » depuis le journal ouvre la bonne fiche.
5. Chemins UI : section audit sur fiche record ; Administration → journal d’audit (export CSV).
