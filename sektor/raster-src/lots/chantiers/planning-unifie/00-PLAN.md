# Planning unifié — fondations L1

> Un planning commun par chantier, sur la couche d’activités déjà livrée : formes, natures, durée ouvrée, calendrier, droits, erreurs distinctes et vues sauvegardées. Palier 1 inchangé.

Source atelier : [`sektor/specifications/planning-unifie/SPECIFICATION.md`](../../../../specifications/planning-unifie/SPECIFICATION.md) §17 L1. Maquette HTML = discussion, pas SSOT. Canvas : [`ux/planning-unifie-l1-wireframe.canvas.tsx`](ux/planning-unifie-l1-wireframe.canvas.tsx). Gel : [`../../DECISIONS-PRODUIT-CHANTIER.md`](../../DECISIONS-PRODUIT-CHANTIER.md) § 08/09/2026 L1.

## Intention

`planning-activites` (AC-1..AC-19) a livré activités, WBS, rattachements, précédences et le Gantt `/chantiers/planning`. Ce sous-lot **étend** ce modèle. Il ne le relivre pas.

Quand L1 est livré :

- une ligne de planning a une **forme** (phase / activité / jalon) et une **nature** (classification, pas une permission) ;
- la durée opérationnelle est en **minutes ouvrées** ; l’affichage heures/jours montre la convention ;
- chaque chantier peut porter un **calendrier** versionné (fuseau IANA, semaine type, exceptions) ;
- une panne, un 403, un filtre vide et un chantier sans activité sont **quatre états distincts** — jamais « 0 activité » pour une erreur API (AC21) ;
- une **vue sauvegardée** mémorise filtres, colonnes et échelle, pas un second planning ;
- palier 1 reste facturable **sans aucune activité**.

## Périmètre

Inclus (L1 — SPECIFICATION.md §17) :

- Formes `PHASE` / `ACTIVITE` / `JALON` sur `ActiviteChantier`. Un parent existant n’est **pas** converti automatiquement en phase (quantités préservées).
- Natures initiales configurables : préparation/installation, études/validation, approvisionnement, travaux, contrôle/essai, réception/clôture ; jalons technique / contractuel / financier. Désactivation sans suppression d’historique.
- Durée en minutes ouvrées ; jalon = durée 0, même date début/fin ; phase = dates dérivées des enfants, pas une durée manuelle contradictoire.
- Calendrier chantier : fuseau IANA (défaut chantier/entreprise, ex. `Africa/Casablanca`), créneaux non chevauchants, exceptions datées, versions à date d’effet. Calendrier historique explicite pour les dates déjà visibles.
- Migration conservatrice : IDs, liens, zones, allocations, quantités, déclarations inchangés. Fin incluse historique → intervalle de calcul **sans** décaler la date affichée. Nature / durée ouvrée « à qualifier » si non déductibles. Pas de recalcul de masse au premier affichage (AC25).
- Capacités métier séparées : lire, éditer la structure, administrer le calendrier, gérer les vues. Réutiliser IAM existant (`chantiers.read` / `create` / `update`) comme **porte** ; pas un droit unique « modifier le planning ». ADMIN technique ≠ signature métier.
- États : vide (« Construire le planning »), chargement, erreur avec Réessayer, filtres sans résultat, accès refusé.
- Vues sauvegardées (personnelles ; partagées si le coût reste dans la Task UI) : nom, filtres, colonnes, regroupement, tri, échelle. Les paramètres de vue ne confèrent aucun accès.
- Minimum L2 pour démontrer L1 dans l’écran existant : colonnes **durée** et **prédécesseurs** à côté de début/fin déjà présents (AC27). Pas de simulation, pas de chemin critique.

Exclus (autres vagues / sous-lots, **pas de Task ici**) :

| Vague | Sous-lot visé | Contenu |
|---|---|---|
| L2 | `execution-fiable` (suivant) | Gantt/table complet, décalages de dépendance, simulation d’impact, marges, chemin critique (AC09, AC29–AC31), versions courantes / référence |
| L3 | `semaine-et-ressources` | Ma semaine, créneaux, disponibilités, conflits, préparation/validation, reliquats (AC02–AC03, AC11–AC15, AC23) |
| L4 | `publication-client` | sélection, aperçu, publication figée, PDF, preuve d’accord (AC18–AC19) |
| L5 | `vue-financiere` | situations / règlements, échéances, trésorerie (AC16–AC17, D07) |
| L6 | `assistant-ia` | explications et propositions, portefeuille enrichi |
| — | hors planning unifié | nivellement auto, XER/MSP, portail externe, scénarios multiples |

Ne pas relivrer AC-1..AC-19. Ne pas ajouter la navigation à six vues (Synthèse / Ma semaine / Client / Financier / Ressources). Route conservée : `/chantiers/planning?chantier=`.

## Approche

Étendre `ActiviteChantier` / `ActivitePrecedence` / `ActiviteChantierService` et l’écran `sources/web/app/chantiers/planning/`. Pas de second moteur de tâches.

1. **Domaine** — colonnes forme, nature, code, `duree_minutes_ouvrees` (nullable = à qualifier). Liquibase add. Jalon et phase validés à l’écriture. Parents productifs inchangés.
2. **Calendrier** — entité versionnée + calcul début + durée → fin selon créneaux. Données migrées : calendrier historique qui reproduit les dates visibles, pas un lundi–vendredi présumé.
3. **Droits** — politique de domaine sur les opérations planning (structure vs calendrier vs vues). Périmètre = chantier autorisé (affectation / Direction), comme `equipe-autorite`. A01–A03 hors L1 (semaine, publication).
4. **Écran** — casser `loadAll` qui avale les erreurs en liste vide. CTA création : Activité / Jalon / Phase. Calendrier depuis le contexte. Vues sauvegardées. Colonnes durée + prédécesseurs.

Arbitrages A01–A09 **non tranchés**. L1 n’en dépend que de :

| ID | Usage L1 | Statut |
|---|---|---|
| A04 | Un calendrier par chantier, pas par activité | **Provisoire** — proposition §19 : calendrier chantier par défaut ; variante d’activité = L2+ |
| A05 | Minutes réelles pour le calcul, affichage local | **Provisoire** — proposition §19 |

A01, A02, A03, A06, A07, A08, A09 : hors L1.

Risques : collision avec `equipe-autorite` (même BC, autre surface) ; DHTMLX grid width si on ajoute deux colonnes ; convention de fin incluse déjà dans le Gantt (`end_date - 1 jour`) à préserver à l’affichage.

## Tasks

| # | Task | agent_type | blocked_by |
|---|---|---|---|
| 1 | SEKTOR-324 Clarifier L1 | spec | — |
| 2 | SEKTOR-325 Formes, natures, durée, migration | exec | 324 |
| 3 | SEKTOR-326 Calendrier chantier et calcul ouvré | exec | 325 |
| 4 | SEKTOR-327 Capacités métier du planning | exec | 326 |
| 5 | SEKTOR-328 Écran : erreurs, vues, colonnes durée/prédécesseurs | exec | 327 |

Première Task exec exécutable dès 324 `done` : **SEKTOR-325**.

## Validation technique

Portée par Code (pas de Task QA). Preset Mode B : `make -C nafura-platform/ops mode-b` · `qa@nafuralabs.local` · API `http://localhost:8082` · UI `http://127.0.0.1:4200`.

État initial : tenant `qa-local`, un chantier palier 1 sans activité + un chantier avec activités existantes (IDs connus).

| Contrôle | Résultat attendu |
|---|---|
| GET activités pré-L1 | mêmes IDs, rattachements, dates **visibles** ; forme=`ACTIVITE` ; nature/durée à qualifier si non déduites |
| POST jalon | durée 0, début = fin ; refus d’un jalon d’un jour fictif |
| POST phase | pas de quantité autonome ; dates = min/max enfants |
| Parent déjà productif | reste `ACTIVITE` (pas de conversion auto) |
| Calendrier | 8 h le vendredi → finit vendredi ; 16 h → samedi si ouvert, lundi si week-end fermé (AC04) |
| Exception de fermeture | heures futures retirées ; dates réelles inchangées |
| 5xx / réseau | message d’erreur + Réessayer ; chantier et filtres conservés ; **pas** empty « 0 activité » (AC21) |
| Filtres vides | « Effacer les filtres », pas « Construire le planning » |
| 403 autre chantier | pas de fuite d’activités (AC13) |
| Palier 1 | POST avancement direct sur nœud sans activité → 2xx |
| Grille Exécution | début, fin, durée, prédécesseurs lisibles sans ouvrir le drawer (AC27) |
| Vue sauvegardée | nommer, recharger, retrouver filtres/colonnes/échelle |
| Gradle | `:chantiers:test` sur les classes touchées |
| Script | étape de la Task 328, ex. `sektor/e2e/scripts/verify-planning-unifie-l1.mjs` — pas une Task séparée |

## Blocages extérieurs

Aucun pour démarrer 325. A01–A09 restent ouverts pour L3–L5. La borne ROADMAP `chantiers` ne bouge pas.
