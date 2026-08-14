---

id: SEKTOR-91
status: done-me
context: nafura
type: tech
priority: P0
assignee: agent
gate: none
sprint: 2026-W33
blocked_by: [SEKTOR-90]
---

# partner / currency / approbations + bootJar

> Fournisseurs → achats, clients → ventes, devises → finance, approbations → socle. Plus de ces jars. bootJar VERT.

## Étapes

- [x] Code `partner/` : split fournisseurs → `achats/`, clients → `ventes/` (packages inchangés si possible)
- [x] `currency/` → `finance/`
- [x] `approbations/` → `socle/`
- [x] Retirer partner, currency, approbations de `settings.gradle.kts` ; supprimer les dossiers
- [x] Retarget `project(':sektor:…')` concernés
- [x] `cd sektor/sources/backend && ./gradlew.bat :sektor:app:bootJar` VERT (`-Xmx2g` si OOM)

## Preuve de fin

Arbre backend = `app/` + `socle catalogue etudes chantiers marches achats ventes finance rh hse`. bootJar VERT.

## Journal

```
14/08 13:20  tsk1  partner entier → achats/ (package ma.nafura.partner) ; entity unifiée CLIENT/FOURNISSEUR/MOA/SOUS_TRAITANT ; deux fiches ICE/RC = hors lot
14/08 13:20  tsk2  etudes Java importe PartnerClientAdapter → retarget :partner → :achats (dep pas unused)
14/08 13:21  tsk3  currency → finance/ (ma.nafura.currency) ; :currency → :finance (catalogue/achats/socle/app) ; finance/build.gradle déjà superset
14/08 13:21  tsk4  approbations → socle/ ; socle + :chantiers + :rh ; etudes :approbations → :socle ; pas de cycle (chantiers ↛ socle)
14/08 13:22  tsk5  settings + app Layer 3 = 10 jars ; drop partner/currency/approbations includes + dossiers
14/08 13:23  preuve  ./gradlew.bat :sektor:app:bootJar --no-daemon -Dorg.gradle.jvmargs=-Xmx2g BUILD SUCCESSFUL
```

## Rapport de livraison

ce qui a changé      partner → achats, currency → finance, approbations → socle ; includes morts droppés ; arbre = `app/` + 10 jars ; packages Java inchangés
critères prouvés     n/a (tech) — `:sektor:app:bootJar` VERT ; plus de `modules/` `item/` `stock/` `partner/` `currency/` `approbations/`
décidé seul          entity Partner unifiée dans achats (pas de split ventes) ; etudes retarget `:sektor:achats` car `PartnerClientAdapter` importe `ma.nafura.partner` ; socle gagne `:chantiers` (ApprovalEngineService) sans cycle
écarts / dette       ICE/RC type + deux fiches fournisseurs/clients = hors lot
