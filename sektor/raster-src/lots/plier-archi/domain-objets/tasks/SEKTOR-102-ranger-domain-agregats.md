---
id: SEKTOR-102
status: done-agent
context: nafura
type: tech
priority: P1
assignee: agent
gate: none
sprint: 2026-W33
---

# Ranger les objets domain par agrégat

> Plus de `domain.model`. Chaque objet (et son vocabulaire) vit sous `domain/<agrégat>/`. Même comportement. JPA reste dans les classes — pas un repli persistance.

## Étapes

- [x] Tuer `domain.model` dans chaque BC (et socle)
- [x] Packages par agrégat : article / ouvrage / stock / … — enums et constantes collés à l’objet
- [x] Réécrire imports (y compris refs intra-domain devenues cross-package)
- [x] `:sektor:app:compileJava` VERT — aucun scénario nouveau

## Preuve de fin

`./gradlew :sektor:app:compileJava` VERT. `compileTestJava` VERT. Aucun `package …domain.model` restant sous `sektor/sources/backend`.

## Journal

```
14/08 18:57  exec     rangement objets domain par agrégat (suite archi BC)
14/08 19:05  exec     183 classes + 5 tests déplacés ; compileJava VERT ; compileTestJava VERT
```

## Rapport de livraison

ce qui a changé      `domain.model` tué. Objets sous `domain/<agrégat>/` dans tous les BC + socle (approbations à plat). JPA inchangé.
critères prouvés     n/a (tech) — compileJava + compileTestJava VERT
décidé seul          noms d’agrégats = objets du BC (article, ouvrage, stock, edition, dossier, devis, fournisseur, …)
écarts / dette       `@Entity` encore dans domain ; `ai/` pas rangé ; helpers `domain.audit` Études laissés
```
