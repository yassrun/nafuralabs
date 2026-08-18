# BC commentaire — commenter un enregistrement

> Ce qui est **vrai maintenant**. Pas de futur ici.
> Canon : [`PACT_BLUEPRINT.md`](../../../PACT_BLUEPRINT.md). CADRE : [`../../CADRE.md`](../../CADRE.md).

## Intention

Tenir un **fil** accroché à un enregistrement du produit. Cette app range les messages ; le produit décide à quoi le fil se rattache. Elle ne mentionne personne, ne prévient pas, ne modère pas.

## Ce que ça fait

- Accroche un **fil** à un enregistrement (`entité` + `id` opaques)
- Reçoit un **message** (corps + auteur), le range, le rend
- Reçoit une **réponse** à un message du tenant
- Liste les messages racines d'un enregistrement, du plus ancien au plus récent ; liste les réponses d'un parent à part
- L'auteur corrige le corps (marque d'édition) ou retire son message
- Publie un widget sur la fiche produit : racines, saisie, corriger / retirer les siens — pas les réponses

## Limites

**owns** — fil, message (corps, auteur, dates, parent), poster, lire, répondre, corriger / retirer par l'auteur, widget du fil

**not_owns**

| Ce que commentaire ne fait pas | Qui s'en charge |
|--------------------------------|-----------------|
| Mentionner une personne (`@`, résoudre qui) | **identité** |
| Prévenir qu'un message a été posté | **notification** |
| Modérer (cacher, valider, retirer le message d'autrui) | **non spécifié** — le CADRE n'owns pas « modérer » ; un produit qui filtre s'en charge |
| Interpréter l'enregistrement (devis, chantier, …) | **le produit** |
| Qui *est* la personne (fiche, session) | **identité** |
| Droits métier d'un produit (qui a le droit de commenter *ce* devis) | **le socle de l'app cliente** |

Coupe : **commenter** = fil + messages. **Mention** dehors. **Notification** dehors. **Modération** dehors.

## Intervenants

- **bâtisseur d'un produit** — accroche le widget, reçoit le fil
- **personne qui utilise un produit** — lit, poste, répond, corrige, retire les siens — via ce produit
- **administrateur d'un tenant** — les mêmes actions dans son tenant, pas davantage

## Données

| Objet | Forme | Obligations |
|-------|-------|-------------|
| **Fil** | messages accrochés à `entité` + `id` (opaques) | listé dans le tenant courant |
| **Message** | corps + auteur + créé ; optionnellement parent, édité | corps non vide à la correction ; l'auteur est la personne qui poste |

`entité` n'est pas un catalogue de cette app (`FACTURE` est un mot du produit).

## États

**Message**

```
présent → édité
présent → retiré
```

Retiré = plus de ligne. Édité = même ligne, corps nouveau, marque d'édition. Pas de brouillon. Une réponse est un message avec parent.

## Règles

- **INV-1** Cette app ne connaît aucun objet métier d'un produit. `entité` + `id` sont opaques.
- **INV-2** Chaque message porte le tenant (`POL-TENANT-ISOLATION`).
- **R-1** Lister, poster, répondre, corriger, retirer : seulement dans le tenant courant.
- **R-2** Corriger ou retirer : l'auteur seulement (sans tenir compte de la casse). Sinon : interdit.
- **R-3** Même `entité` + `id`, autre tenant : liste vide. Corriger ou retirer l'id de A depuis B : pas trouvé — même erreur qu'un id inconnu.
- **R-4** Retirer enlève la ligne.
- **R-5** Poster un racine : pas de parent. Répondre : parent du tenant courant.
- **R-6** Le corps n'est pas interprété : pas de mention, pas de prévention.

Soumis à `POL-TENANT-ISOLATION` · `POL-PAS-METIER-PRODUIT`.

## Liens

- **publie** le fil (messages) au produit
- **consomme** socle (tenant courant, erreurs)
- Canvas : [`ux/fil-commentaire-wireframe.canvas.tsx`](ux/fil-commentaire-wireframe.canvas.tsx)
