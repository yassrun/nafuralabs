# CH-00-INIT — approbation

**Type :** `EVOL (forme `INIT` — premier contrat du BC)`
**Cible :** BC `approbation` (nouveau)
**Qualification :** le CADRE annonce ce contexte ; aucun contrat ne le porte. Le code vit dans `workflow`.

## Pourquoi

Un jar sans contrat n'a pas de frontière : on ne peut ni lui refuser un besoin, ni savoir ce qu'il promet. L'INIT existe pour **couper** — dire ce qui entre dans le BC et ce qui reste dehors.

## Aujourd'hui

`workflow` — pas de `SPEC.md`, pas de `e2e/approbation/`.

## Attendu

Une `SPEC.md` d'une page (intention · owns / not_owns · données · règles) et une **baseline e2e** qui fige le comportement actuel avant qu'on y touche.

Ce que l'INIT coupe : tout le jar `workflow`, ou seulement la part qui fait décider. **Pas de lot workflow à côté** : un besoin, faire décider.

## Coupe (AC-2)

**Tout le jar.** Demande, étape, chaîne (qui décide, dans quel ordre) et parcours sont le même besoin : faire décider. Pas de lot workflow à côté.

## Critères d'acceptation (gelés)

- **AC-1** `SPEC.md` existe et son `not_owns` porte au moins une exclusion, chacune nommant qui s'en charge.
- **AC-2** La coupe est tranchée et écrite : tout le jar `workflow`, ou seulement la part qui fait décider. **Pas de lot workflow à côté** : un besoin, faire décider.
- **AC-3** Une baseline e2e `approbation-*` passe sur le comportement **actuel**, sans le corriger.
- **AC-4** Un lecteur de la seule SPEC peut répondre : « ce besoin appartient-il à `approbation` ? »
- **AC-5** Aucune règle métier produit n'entre dans la SPEC.

## Preuves attendues

`e2e/approbation/` — baseline verte pour AC-3. Revue humaine pour AC-1, AC-2, AC-4, AC-5.

| Scénario | État initial | AC |
|----------|--------------|----|
| `approbation-demander` | tenant A, un utilisateur, un enregistrement opaque sans demande | AC-3 |
| `approbation-accepter` | tenant A, une demande en attente à **une** étape dont le rôle est celui de l'utilisateur | AC-3 |
| `approbation-refuser` | tenant A, une demande en attente | AC-3 |
| `approbation-deux-tenants` | une demande en attente chez A ; session B ensuite | AC-3 |
| `approbation-etapes` | tenant A, une demande en attente à **deux** étapes (rôle de l'utilisateur, puis un autre rôle) | AC-3 |
| `approbation-chaine` | tenant A, admin-tenant, un type opaque ; tenant B ensuite | AC-3 |

**La règle de discrimination ne s'applique pas** (baseline). Substitut : le test a été vu rouge avant d'être vert.

`POL-TENANT-ISOLATION` · `POL-ERREUR-CODE` · `POL-PAS-METIER-PRODUIT`.

Canvas : aucun — INIT de contrat, pas de refonte d'écran.

## Hors périmètre

Déplacer le code → `CH-01-TECHNICAL-plier` · refondre le comportement · brancher un nouveau consommateur
