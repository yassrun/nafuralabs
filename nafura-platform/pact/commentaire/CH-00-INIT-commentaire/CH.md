# CH-00-INIT — commentaire

**Type :** `EVOL (forme `INIT` — premier contrat du BC)`
**Cible :** BC `commentaire` (nouveau)
**Qualification :** le CADRE annonce ce contexte ; aucun contrat ne le porte. Le code vit dans `features/collaboration/comment`.

## Pourquoi

Un jar sans contrat n'a pas de frontière : on ne peut ni lui refuser un besoin, ni savoir ce qu'il promet. L'INIT existe pour **couper** — dire ce qui entre dans le BC et ce qui reste dehors.

## Aujourd'hui

`features/collaboration/comment` — pas de `SPEC.md`, pas de `e2e/commentaire/`.

## Attendu

Une `SPEC.md` d'une page (intention · owns / not_owns · données · règles) et une **baseline e2e** qui fige le comportement actuel avant qu'on y touche.

Ce que l'INIT coupe : ce que commenter recouvre — et ce qu'il ne recouvre pas (mention, notification, modération).

## Critères d'acceptation (gelés)

- **AC-1** `SPEC.md` existe et son `not_owns` porte au moins une exclusion, chacune nommant qui s'en charge.
- **AC-2** La coupe est tranchée et écrite : ce que commenter recouvre — et ce qu'il ne recouvre pas (mention, notification, modération).
- **AC-3** Une baseline e2e `commentaire-*` passe sur le comportement **actuel**, sans le corriger.
- **AC-4** Un lecteur de la seule SPEC peut répondre : « ce besoin appartient-il à `commentaire` ? »
- **AC-5** Aucune règle métier produit n'entre dans la SPEC.

## Politiques

`POL-TENANT-ISOLATION` · `POL-ERREUR-CODE` · `POL-PAS-METIER-PRODUIT`

## Preuves attendues

Scénarios e2e (projet `nafura-platform/e2e/`, pas par BC) :

| Scénario | État initial | AC |
|----------|--------------|----|
| `commentaire-poster-et-lire` | tenant A, une personne, enregistrement opaque | AC-3 |
| `commentaire-deux-tenants` | même entité+id, A puis B | AC-3 |
| `commentaire-auteur-seul` | un message d'Alice ; Bob dans le même tenant | AC-3 |
| `commentaire-retirer` | un message présent chez A, posté par A | AC-3 |
| `commentaire-repondre` | un message racine chez A | AC-3 |
| `commentaire-frontiere-produit` | compile : zéro type métier produit dans commentaire | AC-3 |

Les tests déjà verts du module `comment` **peuvent** servir s'ils assertent bien les AC — l'exec le déclare. Un test écrit directement vert sans avoir été vu rouge est refusé.

**La règle de discrimination ne s'applique pas** (baseline). Substitut : le test a été vu rouge avant d'être vert.

Revue humaine pour AC-1, AC-2, AC-4, AC-5.

## Hors périmètre

Déplacer le code → `CH-01-TECHNICAL-plier` · refondre le comportement · brancher un nouveau consommateur · matrice socle (`P-…` commentaire) → `socle/CH-05-EVOL-consommateur-commentaire`

Canvas : [`../ux/fil-commentaire-wireframe.canvas.tsx`](../ux/fil-commentaire-wireframe.canvas.tsx)
