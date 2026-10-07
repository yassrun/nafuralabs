# 04 — Isoler l'héritage Sektor

> Revue 2026-10-07, doublons D5 et D6. Taille **S** (front + back). Aucune dépendance. Peut partir tout de suite.

## Objectif

Le code que seul Sektor utilise est marqué comme tel, et aucun nouvel usage n'est possible depuis la plateforme ou un BC. Il sera supprimé avec la reconstruction de Sektor sur le host (ROADMAP 7), pas avant.

## Besoin

- `lib/anatomy` porte l'ancienne architecture. La plateforme n'en utilise plus qu'une partie, mais environ 180 fichiers web de Sektor l'importent (`@platform/lib/anatomy`, alias `@lib/*`).
- Un agent ou un développeur qui cherche « comment faire une page » tombe sur `FeatureListPage` (902 lignes) ou `ConfigDrivenMasterSlavePage`, et les prend pour la norme.
- Côté serveur, `ErpEntityTransitionEvent` + `ErpNotificationPublisher` adressent des notifications **par rôle**, ce qui contredit la règle « permissions, jamais de rôles ». La plateforme ne les publie plus ; Sektor oui.

## Existant

| Élément | Lignes | Utilisateurs hors `lib/anatomy` |
|---|---|---|
| `lib/anatomy/pages/config-driven-dashboard-page.class.ts` | 139 | Sektor |
| `…/config-driven-document-workspace-page.class.ts` | 86 | Sektor |
| `…/config-driven-master-slave-page.class.ts` | 317 | Sektor |
| `…/config-driven-wizard-page.class.ts` | 156 | Sektor |
| `…/feature-page.class.ts`, `feature-list-page.class.ts`, `feature-detail-page.class.ts` | 182 + 902 + 162 | Sektor |
| `…/config-driven-listing-page.class.ts`, `config-driven-detail-page.class.ts` | 243 + 757 | plateforme (7 + 2 écrans, voir 01 et 02) et Sektor |
| `core/framework/…/platform/framework/event/ErpEntityTransitionEvent.java`, `ErpNotificationPublisher.java` | — | Sektor : `BonCommandeAchatService`, `SituationTravauxService`, `CongeService`, `ApprovalEngineService` (socle) |
| `notification/…/event/ErpDomainNotificationListener.java` | — | écoute l'événement ci-dessus |

`ConfigDrivenSettingsPage` est utilisé par la plateforme (paramètres de l'application et de l'utilisateur) : ce n'est pas un héritage. Il reste.

## Contrat

### Lot 1 — Marquer

- `@deprecated Héritage Sektor — supprimé avec sektor-sur-host. Utiliser <remplaçant>.` sur chaque classe du tableau (TS et Java). Remplaçants :
  - pages de liste → `nf-listing-page` ;
  - pages de fiche → `nf-record-page` ;
  - assistant → `RecordPageConfig.createLayout` en `steps` ;
  - maître-détail, tableau de bord, espace document → écran spécifique déclaré (`spec.screens`) en attendant un archétype ;
  - `ErpEntityTransitionEvent` → `notify` du cycle de vie JSON.
- `lib/anatomy/pages/index.ts` : un commentaire en tête qui renvoie vers `docs/UI.md`.

### Lot 2 — Interdire les nouveaux usages

`architecture:check` refuse tout import des éléments ci-dessus depuis `nafura-platform/sources/web/{platform,features,app,core}` et depuis `*/bcs/`. Exceptions :
- la liste explicite des écrans encore à migrer par 01 et 02, retirée au fur et à mesure (même mécanisme que la tolérance actuelle de `LegacyListingPageComponent`) ;
- Sektor, qui n'est pas contrôlé.

Côté serveur, un test d'architecture (host-tests) vérifie qu'aucune classe de `nafura-platform/sources/backend` ne publie `ErpEntityTransitionEvent`.

### Lot 3 — Supprimer (après ROADMAP 7)

Suppression des classes marquées, de `ErpDomainNotificationListener` et des exceptions du garde-fou. Ce lot reste dans la spec pour mémoire ; il n'est pas à affecter avant la reconstruction de Sektor.

## Vérification

1. `node platform-host/ops/run.mjs check`.
2. Ajouter temporairement `import { FeatureListPage } from '@lib/anatomy'` dans un fichier de `platform/` : `architecture:check` échoue avec un message qui nomme le remplaçant. Retirer l'import.
3. Le build de Sektor passe toujours (`sektor/ops`, ou `npm run build` dans `sektor/sources/web`).

## Critères d'acceptation

- [ ] Toutes les classes du tableau portent `@deprecated` avec leur remplaçant.
- [ ] Le garde-fou refuse un nouvel import, avec un message explicite.
- [ ] Sektor compile sans changement.

## Documentation

- `docs/UI.md` § Ce que Sektor a fait et qu'on ne refait pas : une ligne « Classes de pages `lib/anatomy/pages` (`Feature*Page`, `ConfigDriven*Page`) → archétypes du host ».
- `docs/ARCHITECTURE.md` (État et écarts) : ligne « Héritage Sektor dans `lib/anatomy` et `core/framework/event` : isolé, supprimé avec Sektor sur le host ».
