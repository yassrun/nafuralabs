---
id: SEKTOR-98
status: done-agent
context: nafura
type: tech
priority: P1
assignee: agent
gate: none
sprint: 2026-W33
---

# Socle compile sans jars BC

> `socle/build.gradle` n’a plus `project(':sektor:catalogue|finance|chantiers|rh')`. `:sektor:socle:compileJava` VERT. Comportement d’onboarding / approbations inchangé.

## Étapes

- [x] Sortir le seed métier hors socle (`TenantReferenceDataSeedService`, `TenantPresetOrchestratorService`, `OnboardingCompletenessService` touchent item/stock/currency/finance). Le BC propriétaire sème ses données ; le socle n’orchestre que des ports
- [x] Inverser approbations → chantiers : port dans **socle**, impl dans **chantiers** (`ApprovalEngineService` n’importe plus `ChantierRoleCodes` / `ApproverResolutionService`)
- [x] Drop les 4 `implementation project(':sektor:…')` métier dans `socle/build.gradle`
- [x] Interdit : Socle qui route du métier · copier des entités Catalogue dans socle « pour compiler »

## Preuve de fin

`socle/build.gradle` : plus aucune dep `:sektor:` hors éventuellement rien (platform + Spring). `./gradlew :sektor:socle:compileJava` VERT. `:sektor:app:bootJar` encore possible.

## Journal

```
14/08 15:50  promote  lot plier-archi · Raster seul · ARCHI_BLUEPRINT
14/08 15:56  orch     sprint: 2026-W33
14/08 16:00  orch     doing — SEKTOR-97 laissé doing (demande humaine)
14/08 16:05  tsk1     ports socle : ApproverResolutionPort, CatalogueOnboardingPort, FinanceOnboardingPort
14/08 16:10  tsk2     seed référentiel + articles JSON → catalogue ; chart → finance adapter
14/08 16:15  tsk3     ApprovalEngineService → port ; impl ApproverResolutionService
14/08 16:20  tsk4     drop 4 deps Gradle socle ; catalogue/finance/chantiers consomment socle
14/08 16:22  preuve   :sektor:socle:compileJava + catalogue/finance/chantiers VERT
14/08 16:24  preuve   :sektor:app:bootJar VERT ; ApprovalEngineServiceTest VERT
```

## Rapport de livraison

ce qui a changé      socle sans jars BC ; onboarding via ports ; approbations via ApproverResolutionPort
critères prouvés     n/a (tech) — `socle/build.gradle` 0× `project(':sektor:…')` · compileJava VERT · bootJar VERT
décidé seul          currencies restent seedées depuis catalogue (déjà dep finance) ; JSON onboarding déplacé avec le seed
écarts / dette       SEKTOR-99+ pour le contrat Études↔Catalogue
