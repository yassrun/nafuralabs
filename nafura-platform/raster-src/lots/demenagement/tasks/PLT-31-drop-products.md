---

id: PLT-31
status: done-me
context: nafura
type: tech
priority: P1
assignee: agent
gate: none
sprint: 2026-W33
blocked_by: [PLT-30]
---

# Supprimer products/ et rejouer l'état des lieux

> Fin du déménagement. C'est ici que « make sure everything works » se conclut.

## Étapes

- [x] `products/personal` → `perso/` · trancher le sort de `products/ops` (tickets d'exploitation, **pas** de l'infra — ne pas confondre avec `nafura-platform/ops/`)
- [x] Supprimer `products/`
- [x] Aucune référence à `products/` dans le dépôt
- [x] **Rejouer intégralement `ETAT-DES-LIEUX.md`**

## Preuve de fin

Comparaison ligne à ligne avec le lot 0 : aucune régression.

## Journal

```
13/08 23:37  tsk1  products/personal → perso/. products/ops → peer ops/ (tickets exploitation, déjà un squelette rasté — distinct de nafura-platform/ops/).
13/08 23:37  tsk2  products/ supprimé (restes raster/sektor-btp/mbs-website inclus).
13/08 23:40  tsk3  walker/nlops/settings.lifecycle/dev-staging-local/cursor-qa/AGENTS/README : plus de chemin live products/. Commentaires Java/SQL, PLATFORM_IMPORTS, tickets de déménagement, relevé lot 0 → inbox.
13/08 23:45  tsk4  Rejeu ETAT-DES-LIEUX.md § Rejeu PLT-31. npm sektor/corporate/mbs/venue VERT. overlays identiques (corporate staging toujours absent). gradle projects VERT. docker sektor-web VERT. raster 0 err / 14/14. Pas de ./gradlew build (OOM lot 0).

Livré : plus de products/ · relevé rejoué sans régression
```
