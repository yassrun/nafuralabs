---
id: SEKTOR-325
status: done
context: nafura
type: feature
agent_type: exec
priority: P1
assignee: agent
blocked_by: [SEKTOR-324]
tags: [chantiers]
---

# Formes, natures, duree ouvrée et migration conservatrice

> Étendre ActiviteChantier : forme PHASE/ACTIVITE/JALON, nature, code, dureeMinutesOuvrees nullable. Migration : IDs/dates visibles/rattachements inchangés, forme=ACTIVITE, durée à qualifier. Pas de conversion auto des parents. Palier 1 intact.

Plan : `00-PLAN.md`. Gel 08/09 L1. Ne pas relivrer AC-1..AC-19.

## Étapes

- [x] Liquibase : colonnes `forme`, `nature_code`, `code`, `duree_minutes_ouvrees` (nullable) sur `chantier_activites`. Referentiel natures désactivable. Pas de drop.
- [x] Défauts migration : forme=`ACTIVITE` ; nature et durée null = à qualifier. Parents existants **non** convertis en PHASE.
- [x] Validations : jalon durée 0 et début=fin ; refus jalon d’un jour fictif ; phase sans quantité autonome ; dates de phase dérivées min/max enfants à la lecture.
- [x] DTO/API create-update : forme + nature + début+durée **ou** dates explicites. Fin incluse historique : date **visible** inchangée.
- [x] Tests : GET lignes préexistantes (IDs, rattachements, dates visibles) ; palier 1 POST avancement nœud sans activité → 2xx ; `:chantiers:test`.

## Journal

```
08/09 15:46  posée
08/09 16:18  status → doing
08/09 16:28  domaine + liquibase + tests ; :chantiers:test OK ; palier 1 live 201
08/09 16:30  status → done
```

## Rapport de livraison

`ActiviteChantier` porte désormais `PHASE` / `ACTIVITE` / `JALON`, un code lisible, une nature (référentiel désactivable) et `dureeMinutesOuvrees` nullable. Changelog `v1.10` : ADD only, défaut `forme=ACTIVITE`, nature/durée NULL (à qualifier), aucun parent converti en phase.

Jalon : durée 0, début=fin ; refus d’un jalon à durée positive ou dates distinctes. Phase : pas de rattachement ni durée manuelle ; dates min/max enfants à la lecture. Create/update : dates explicites (visibles inchangées) **ou** début+durée (fin inclusive provisoire 8 h/j, calendrier réel = 326).

**Validation :** `./gradlew :sektor:chantiers:test` — BUILD SUCCESSFUL. Live 8082 (binaire non redéployé) : GET `CH-2026-003` 3 activités, IDs/dates/rattachements conservés ; POST avancement nœud `CH-2026-001` sans activité → **201**.

**Écarts :** instance 8082 sans v1.10 — `forme` absent du JSON live (colonnes pas encore appliquées). Convention 8 h/j pour dériver une fin si seule la durée est fournie ; 326 remplacera ça par le calendrier chantier. Pas de GET natures ni d’écran (328).

