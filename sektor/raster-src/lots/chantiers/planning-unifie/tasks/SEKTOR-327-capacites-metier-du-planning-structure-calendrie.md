---

id: SEKTOR-327
status: done
context: nafura
type: feature
agent_type: exec
priority: P1
assignee: agent
blocked_by: [SEKTOR-326]
tags: [chantiers]
---

# Capacités métier du planning : structure, calendrier, vues

> Séparer lire / éditer structure / administrer calendrier / gérer vues. IAM porte existante. ADMIN ≠ signature métier. 403 hors périmètre (AC13). A01–A03 hors L1. Palier 1 inchangé.

## Étapes

- [x] Politique domaine (pas une matrice IAM) : lire / éditer structure / administrer calendrier / gérer vues. Porte IAM existante (`chantiers.read` / `update` / `create`). ADMIN technique n’autorise pas une signature métier.
- [x] Périmètre = chantier autorisé (Direction / affectation active), même esprit que `equipe-autorite`. AC13 : autre chantier → 403, aucune fuite.
- [x] Chef : lire + proposer / éditer selon le droit structure ; calendrier : proposer si pas le droit d’administrer. Conducteur / DT / DG : appliquer dans le périmètre. A01–A03 (semaine, report, publication) hors L1.
- [x] Exposer les capacités dans le payload planning pour l’écran 328. Palier 1 (avancement nœud, situation) inchangé.
- [x] Tests policy + Gradle `:chantiers:test`.

## Journal

```
08/09 16:14  posée
08/09 16:43  status → doing
08/09 17:05  PlanningPolicy + payload capacites + tests Gradle OK
08/09 17:08  status → done
```

## Rapport de livraison

**Fichiers :** `PlanningPolicy` + `PlanningCapacitesDto` ; garde-fous sur `ActiviteChantierService` / `CalendrierChantierService` ; `actorRolesOn` réutilisé depuis `ChantierAffectationPolicy` ; payload `GET …/activites/planning` ; type TS `PlanningCapacites` pour 328.

**Règle :** IAM (`chantiers.read` / `create` / `update`) reste la porte. Grade + affectation active (Direction / DG / owner) décident. Chef : lire + proposer structure/calendrier. Conducteur : appliquer structure, proposer calendrier. DT / DG : appliquer. ADMIN technique sans nomination → 403. DAF : lecture seule. A01–A03 absents du DTO. Palier 1 (`AvancementPhysiqueService`) non touché.

**Validation :** `./gradlew :sektor:chantiers:test` depuis `sektor/sources/backend` — BUILD SUCCESSFUL (`PlanningPolicyTest` + services).

**Écarts :** JVM 8082 non rechargé — GET planning owner sans champ `capacites`. Alias `chef-chantier` → 403 IAM (`chantier-activite.chantiers.read`) avant la politique domaine. Tests Gradle font foi. Pas d’écran 328, pas de nouvelles permissions IAM.

**status: done**
