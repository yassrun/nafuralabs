---

id: SEKTOR-326
status: done
context: nafura
type: feature
agent_type: exec
priority: P1
assignee: agent
blocked_by: [SEKTOR-325]
tags: [chantiers]
---

# Calendrier chantier versionné et calcul de durée ouvrée

> Calendrier par chantier : fuseau IANA, semaine type, exceptions, versions. Calcul début+durée→fin. AC04. Calendrier historique pour données migrées. A04/A05 provisoires. Pas de calendrier par activité. Pas de simulation d'impact L2.

## Étapes

- [x] Entité calendrier versionné : fuseau IANA (défaut chantier/entreprise, ex. `Africa/Casablanca`), créneaux hebdo non chevauchants, exceptions datées, date d’effet. Création **paresseuse** à la première écriture planning, jamais à la conversion.
- [x] Calendrier historique pour lignes migrées : reproduire les dates visibles ; ne pas présumer lundi–vendredi ni convertir en shifts de nuit.
- [x] Calcul : début + `duree_minutes_ouvrees` → fin selon créneaux. A05 provisoire : minutes réelles, affichage local. A04 provisoire : un calendrier chantier, pas par activité.
- [x] AC04 : 8 h le vendredi finit vendredi ; 16 h finit samedi si ouvert, lundi si week-end fermé. Exception de fermeture retire les heures futures ; réalisé inchangé.
- [x] API CRUD calendrier sous le chantier. Modifier ≠ recalcul de masse à l’ouverture. Pas de simulation d’impact (L2). Shifts nuit stockables ; réservation ressource = L3.
- [x] Tests unitaires AC04 + exception + fuseau ; `:chantiers:test`.

## Journal

```
08/09 16:14  posée
08/09 16:32  status → doing
08/09 16:48  calendrier + calcul + API + tests ; :chantiers:test OK
08/09 16:49  status → done
```

## Rapport de livraison

Calendrier **un par chantier** (A04 provisoire) : versions à date d’effet, fuseau IANA (défaut `Africa/Casablanca`, décalage UTC fixe refusé), créneaux hebdo non chevauchants, exceptions datées. Création **paresseuse** à la première écriture planning (`deriveInclusiveFin` / PUT) — jamais à la conversion, jamais au GET. Chantier déjà pourvu d’activités → kind `HISTORIQUE` 7×8 h (dates visibles, pas lun–ven, pas de shifts nuit). Sinon `STANDARD` lun–ven 08:00–16:00.

Calcul début + `dureeMinutesOuvrees` → fin visible (fin incluse) via minutes réelles dans le fuseau (A05). AC04 : 8 h vendredi → vendredi ; 16 h → samedi si ouvert, lundi si week-end fermé. Fermeture = portions de cette date locale (y compris nuit commencée la veille) ; le réalisé des activités n’est pas réécrit. PUT/POST version ≠ recalcul de masse. Shifts nuit stockables ; réservation ressource = L3. Pas de simulation d’impact.

**API** `GET|PUT /api/v1/chantiers/{id}/calendrier` · `POST|DELETE …/versions`. GET 404 si pas encore créé.

**Validation :** `./gradlew :sektor:chantiers:test` depuis `sektor/sources/backend` — **BUILD SUCCESSFUL**. Live 8082 non rechargé (Liquibase v1.11 pas appliqué sur le JVM déjà up) ; les tests Gradle font foi.

**Écarts :** A04/A05 restent provisoires. Pas d’écran (328). Pas de capacités métier (327). Pas de calendrier par activité. Pas de simulation L2.
