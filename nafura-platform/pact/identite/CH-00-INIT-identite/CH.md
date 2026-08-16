# CH-00-INIT — identite

**Type :** `EVOL (forme `INIT` — premier contrat du BC)`
**Cible :** BC `identite` (nouveau)
**Qualification :** le CADRE annonce ce contexte ; aucun contrat ne le porte. Le code vit dans `core/identity`, `iam`, `settings`.

## Pourquoi

Un jar sans contrat n'a pas de frontière : on ne peut ni lui refuser un besoin, ni savoir ce qu'il promet. L'INIT existe pour **couper** — dire ce qui entre dans le BC et ce qui reste dehors.

## Aujourd'hui

`core/identity`, `iam`, `settings` — pas de `SPEC.md`, pas de `e2e/identite/`.

## Attendu

Une `SPEC.md` d'une page (intention · owns / not_owns · données · règles) et une **baseline e2e** qui fige le comportement actuel avant qu'on y touche.

Ce que l'INIT coupe : les trois jars d'un coup. **Pas de 2ᵉ lot iam.** Si `settings` n'est pas « qui est là », l'INIT le met en `not_owns`.

## Critères d'acceptation (gelés)

- **AC-1** `SPEC.md` existe et son `not_owns` porte au moins une exclusion, chacune nommant qui s'en charge.
- **AC-2** La coupe est tranchée et écrite : les trois jars d'un coup. **Pas de 2ᵉ lot iam.** Si `settings` n'est pas « qui est là », l'INIT le met en `not_owns`.
- **AC-3** Une baseline e2e `identite-*` passe sur le comportement **actuel**, sans le corriger.
- **AC-4** Un lecteur de la seule SPEC peut répondre : « ce besoin appartient-il à `identite` ? »
- **AC-5** Aucune règle métier produit n'entre dans la SPEC.

## Preuves attendues

`e2e/identite/` — baseline verte pour AC-3. Revue humaine pour AC-1, AC-2, AC-4, AC-5.

## Hors périmètre

Déplacer le code → `CH-01-TECHNICAL-plier` · refondre le comportement · brancher un nouveau consommateur
