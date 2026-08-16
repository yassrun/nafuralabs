# CH-02-EVOL — impression sans facture

**Type :** `EVOL`
**Cible :** BC `impression`
**Qualification :** le BC rend une page, mais son contrat porte encore la forme d'une facture — `PrintDocument`, TVA, lignes.

## Pourquoi

Imprimer est une capacité de plateforme. Y laisser la TVA et les lignes de facture, c'est y laisser du métier : le prochain produit qui imprime autre chose devra le contourner. La forme facture appartient à **Sektor**, qui la garde.

## Aujourd'hui

`PrintDocument` et ses champs de facturation vivent dans le jar `impression`. Le rendu les connaît.

## Attendu

Le BC reçoit un **type opaque** : des données qu'il place dans un modèle sans les comprendre. Plus de `PrintDocument` dans `impression`. Sektor garde la forme facture chez lui.

## Critères d'acceptation (gelés)

- **AC-1** Aucun type nommant une notion de facturation (TVA, lignes, totaux) ne subsiste dans le jar `impression`.
- **AC-2** Le contrat d'entrée du rendu est opaque : le BC ne lit aucun champ métier.
- **AC-3** La SPEC `impression` dit en `not_owns` que la forme d'un document métier appartient au produit.
- **AC-4** La suite e2e `impression-*` reste verte.
- **AC-5** Sektor imprime toujours une facture, sans régression.

## Preuves attendues

| Scénario | État initial | AC |
|----------|--------------|----|
| `impression-type-opaque` | contrat actuel | AC-1, AC-2 |
| suite `impression-*` | inchangée | AC-4 |

Revue de SPEC pour AC-3.

## Hors périmètre

Refondre les modèles · l'écran de configuration · la facture Sektor elle-même
