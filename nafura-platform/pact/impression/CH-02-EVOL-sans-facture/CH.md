# CH-02-EVOL — impression sans facture

**Type :** `EVOL`
**Cible :** BC `impression`
**Qualification :** `EVOL` — baseline posée (CH-00) ; le contrat porte encore `PrintDocument` / TVA / lignes.

## Pourquoi

Imprimer est une capacité de plateforme. Y laisser la TVA et les lignes, c'est y laisser du métier. La forme facture appartient à **Sektor**, qui la garde.

## Aujourd'hui

`PrintDocument` et ses champs de facturation vivent dans le jar `impression`. Le rendu les connaît.

## Attendu

Le BC reçoit un **sac opaque** : des données qu'il place dans un modèle sans les comprendre. Plus de `PrintDocument` dans `impression`. Sektor garde la forme facture chez lui.

## Critères d'acceptation (gelés)

- **AC-1** Aucun type du jar `impression` ne s'appelle `PrintDocument` ni ne nomme une TVA, une ligne, un total. (`INV-1`)
- **AC-2** Le contrat d'entrée du rendu est un modèle + un sac opaque : le BC ne lit aucun champ métier (TVA, lignes, totaux, client). (`INV-1`, `R-1`)
- **AC-3** La SPEC `impression` dit en `not_owns` que la forme d'un document métier appartient au produit. (`POL-PAS-METIER-PRODUIT`)
- **AC-4** La suite e2e `impression-*` reste verte.
- **AC-5** Sektor imprime toujours une facture, sans régression. Preuve = **non-régression produit** — pas un e2e `nafura-platform/e2e`.

## Preuves attendues

| Scénario | État initial | AC |
|----------|--------------|----|
| `impression-type-opaque` | jar `impression` avec `PrintDocument` présent — l'ancienne vérité doit échouer | AC-1, AC-2 |
| suite `impression-*` (`impression-rendre-pdf`, `impression-deux-tenants`, `impression-frontiere-produit`, `impression-plier-arbre`) | inchangée | AC-4 |
| revue de SPEC | SPEC `impression` patchée | AC-3 |
| non-régression Sektor | un tenant Sektor, une facture client imprimable (l'exec choisit l'id) | AC-5 |

`impression-type-opaque` observe l'absence de `PrintDocument` et des types TVA / ligne / total dans le jar `impression`, et un rendu qui n'exige aucun de ces champs. Discrimination : rouge tant que `PrintDocument` est dans le jar.

AC-5 s'exerce sur le chemin d'impression facture **déjà là chez Sektor**. Ce n'est pas un scénario `nafura-platform/e2e`. Déplacer la forme vers Sektor n'est pas refondre la facture.

Canvas inchangé : [`../ux/page-rendue-wireframe.canvas.tsx`](../ux/page-rendue-wireframe.canvas.tsx) — écran de config hors périmètre.

## Politiques

`POL-TENANT-ISOLATION` · `POL-ERREUR-CODE` · `POL-PAS-METIER-PRODUIT`

Actions inchangées : `P-IMPRESSION-RENDRE` · `P-IMPRESSION-MODELE-LIRE`.

## Hors périmètre

Refondre les modèles · l'écran de configuration · la facture Sektor elle-même
