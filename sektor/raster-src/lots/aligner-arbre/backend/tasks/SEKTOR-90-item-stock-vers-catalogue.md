---

id: SEKTOR-90
status: done-me
context: nafura
type: tech
priority: P0
assignee: agent
gate: none
sprint: 2026-W33
blocked_by: [SEKTOR-89]
---

# item + stock → catalogue

> Un jar `catalogue`. Packages Java inchangés si ça évite le churn. Plus d’includes `:sektor:item` / `:sektor:stock`.

## Étapes

- [x] Déplacer `item/src` et `stock/src` dans `catalogue/src`
- [x] `catalogue/build.gradle` : deps qu’avaient item et stock
- [x] Tous les `implementation project(':sektor:item'|':sektor:stock')` → `:sektor:catalogue`
- [x] Retirer item et stock de `settings.gradle.kts` ; supprimer les dossiers
- [x] Ne pas toucher partner / currency / approbations

## Preuve de fin

Plus de dossiers `item/` `stock/`. Compile catalogue + consommateurs.

## Journal

```
14/08 13:17  tsk1  git mv ma.nafura.item + ma.nafura.stock (java/test) → catalogue/ ; packages inchangés
14/08 13:18  tsk2  merge resources liquibase v1.0/v1.1 + validation JSON (aucun collision de nom)
14/08 13:18  tsk3  catalogue/build.gradle : drop :item ; + :currency + ai-agent-api ; dedupe
14/08 13:18  tsk4  retarget app/socle/achats/etudes ; drop includes item/stock ; rmdir
14/08 13:19  preuve  ./gradlew.bat :sektor:catalogue:compileJava :sektor:achats:compileJava :sektor:socle:compileJava --no-daemon BUILD SUCCESSFUL
```

## Rapport de livraison

ce qui a changé      sources item+stock dans `catalogue/` ; plus d’includes `:sektor:item` / `:sektor:stock` ; packages `ma.nafura.item` et `ma.nafura.stock` inchangés
critères prouvés     n/a (tech) — compile catalogue + achats + socle VERT ; dossiers `item/` `stock/` absents
décidé seul          liquibase merged in-place (filenames distincts, pas de dossier sibling) ; seed/ stock vide ignoré
écarts / dette       partner/currency/approbations = SEKTOR-91
