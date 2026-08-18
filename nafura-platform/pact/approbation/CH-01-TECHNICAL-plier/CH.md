# CH-01-TECHNICAL — plier l'arbre

**Type :** `TECHNICAL`
**Cible :** BC `approbation`
**Qualification :** le contrat est posé ; le code de **ce** BC vit encore sous `features/collaboration/workflow`. Aucune règle ne change.

## Pourquoi

Un contexte Pact a un arbre (`ARCHI_BLUEPRINT`). Tant que le code de ce BC porte le nom de son ancien paquet, le prochain Change travaille dans le mauvais dossier.

## Aujourd'hui

- Backend `sources/backend/features/collaboration/workflow/` (sources Java sous `src/main/java/ma/nafura/workflow/` ; un événement sous `src/main/java/ma/nafura/platform/collaboration/workflow/event/`).
- Include `includePlatform(":platform:features:collaboration:workflow")` dans `sources/backend/settings.gradle.kts`.
- Web de ce BC, dispersé :
  - `sources/web/features/collaboration/workflow/` (`index.ts` · `services/workflow-api.service.ts` · `components/approval-banner.component.ts` · `components/approval-action.component.ts` · `components/workflow-template-select-dialog.component.ts`)
  - `sources/web/features/administration/workflows/` (listing · editor · `services/workflow-templates-api.service.ts` · `services/workflows.facade.ts`)
- Consommateurs (pas de ce BC) : `sources/web/features/approvals/` (page inbox + `services/approvals-facade.service.ts` + `config/entity-type-routes.config.ts`) ; `lib/anatomy/…/entity-detail.component.ts` ; shell (`platform-app-shell.component.ts`).
- e2e déjà `e2e/approbation/` ; Gradle des e2e `:platform:features:collaboration:workflow` (`e2e/approbation/_gradle.mjs`).

## Attendu

Le module Gradle et le web de **ce** BC vivent sous `approbation`. Les packages Java, les routes HTTP et les noms de scénarios `approbation-*` **ne bougent pas**.

## Coupe web (AC-2) — décidé seul

**Entre** sous `sources/web/app/approbation/` : widgets embarqués + client HTTP demandes/parcours (`features/collaboration/workflow/`) **et** écrans + client HTTP des chaînes (`features/administration/workflows/` — même geste que les modèles d'impression).

**Reste consommateur** (repointe l'import, n'entre pas) : `features/approvals/` entier (inbox + facade + cartes de routes produit) · anatomy `entity-detail` · shell.

La SPEC owns demande + chaîne + parcours + widgets. La page inbox assemble le BC avec des routes produit (`entity-type-routes.config.ts`) : ce n'est pas l'arbre de ce BC.

## Critères d'acceptation (gelés)

- **AC-1** Le module Gradle de ce BC est `sources/backend/approbation/`, inclus `:platform:approbation` (`projectDir` = `approbation`). L'ancien include `:platform:features:collaboration:workflow` n'est plus. Les e2e lancent `:platform:approbation:test` ; le dossier sources Java interne `src/main/java/ma/nafura/workflow/` reste.
- **AC-2** Le web de ce BC est sous `sources/web/app/approbation/` (`index.ts` · `services/workflow-api.service.ts` · `components/approval-banner.component.ts` · `components/approval-action.component.ts` · `components/workflow-template-select-dialog.component.ts` · écrans chaînes issus de `administration/workflows/`). Les anciens dossiers `sources/web/features/collaboration/workflow/` et `sources/web/features/administration/workflows/` ne sont plus.
- **AC-3** Les e2e restent sous `e2e/approbation/`. Les noms `test("approbation-…")` sont inchangés : `approbation-demander` · `approbation-accepter` · `approbation-refuser` · `approbation-deux-tenants` · `approbation-etapes` · `approbation-chaine`.
- **AC-4** La suite e2e existante (`approbation-*`) reste verte.
- **AC-5** Les FQCN Java `ma.nafura.platform.collaboration.workflow` (dont `ApprovalController` · `WorkflowController` · `WorkflowTemplateController` · `ApprobationBaselineTest`) et les routes `/api/v1/platform/collaboration/approvals` · `/api/v1/platform/collaboration/workflows` · `/api/v1/platform/collaboration/workflow/templates` ne changent pas.

## Preuves attendues

| Scénario | État initial | AC |
|----------|--------------|----|
| `approbation-plier-arbre` | backend `features/collaboration/workflow` · web `features/collaboration/workflow` + `features/administration/workflows` · include `:platform:features:collaboration:workflow` · e2e déjà `e2e/approbation/` | AC-1, AC-2, AC-3, AC-5 |
| suite `approbation-*` | inchangée (demander / accepter / refuser / deux tenants / étapes / chaîne — CH-00) | AC-4 |

`POL-TENANT-ISOLATION` · `POL-ERREUR-CODE` · `POL-PAS-METIER-PRODUIT` — inchangées (pas de patch SPEC).

## Hors périmètre

Renommer les packages · aligner le dossier `ma/nafura/workflow/` sur le FQCN · refondre l'intérieur `api/domain/…` · toucher au comportement · dossier `features/approvals/` (consommateur) · organism anatomy `lib/anatomy/…/entity-detail` et `lib/anatomy/…/workflow-editor` · autres BC (seul un `project(':platform:…')` qui nomme l'ancien include suit AC-1)
