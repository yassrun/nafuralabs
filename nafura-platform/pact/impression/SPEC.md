# BC impression — produire une page

> Ce qui est **vrai maintenant**. Pas de futur ici.
> Canon : [`PACT_BLUEPRINT.md`](../../../PACT_BLUEPRINT.md). CADRE : [`../../CADRE.md`](../../CADRE.md).

## Intention

Produire une **page** ou un **PDF** à partir d'un **modèle** et de **données**. Cette app rend ; le produit fournit le modèle métier et les données.

## Ce que ça fait

- Reçoit un modèle (HTML) et un sac de données opaque
- Remplit le modèle, y pose le chrome du tenant (identité, pied de page)
- Rend un PDF
- Range le modèle par tenant ; un `type` texte dit à quoi le produit l'accroche

## Limites

**owns** — rendu (modèle + données → page / PDF), chrome de page (identité tenant, pied), le modèle *en tant que contenant* rangé chez le tenant

**not_owns**

| Ce que impression ne fait pas | Qui s'en charge |
|------------------------------|-----------------|
| La forme d'un document métier (facture, devis, …) | **le produit** |
| Interpréter les données (lignes, TVA, client) | **le produit** |
| Conserver le PDF comme fichier | **documents** |
| L'engin d'hébergement (Gotenberg) | **ops** |

## Intervenants

- **bâtisseur d'un produit** — fournit le modèle métier et les données, reçoit le PDF
- **personne qui utilise un produit** — demande une page — via ce produit
- **administrateur d'un tenant** — voit les modèles de son tenant

## Données

| Objet | Forme | Obligations |
|-------|-------|-------------|
| **Modèle** | HTML + `type` (texte opaque) | rangé dans le tenant courant |
| **Données** | sac de valeurs fourni par le produit | opaque : cette app ne lit aucun champ |
| **Page** | PDF (octets) | produit du modèle rempli + chrome du tenant |

`type` n'est pas un catalogue de cette app (`facture_client` est un mot du produit).

Noms interdits comme types de ce BC : `PrintDocument`, et tout type qui nomme une TVA, une ligne, un total, un client de facture.

## États

**Rendu**

```
demandé → rendu | échoué
```

Pas de brouillon de page. Relancer = redemander.

**Modèle**

```
présent → retiré
```

## Règles

- **INV-1** Cette app ne connaît aucun objet métier d'un produit. `type` est opaque. Aucun type de ce BC ne s'appelle `PrintDocument` ni ne nomme une TVA, une ligne, un total.
- **INV-2** Métadonnées du modèle portent le tenant (`POL-TENANT-ISOLATION`).
- **R-1** Rendre exige un modèle du tenant courant et `P-IMPRESSION-RENDRE`. Le résultat est un PDF. L'entrée est le modèle + le sac opaque — pas un objet facture.
- **R-2** Lister / lire un modèle : seulement dans le tenant courant. `P-IMPRESSION-MODELE-LIRE`.
- **R-3** Un modèle de A n'est pas servi à B.

Soumis à `POL-TENANT-ISOLATION` · `POL-ERREUR-CODE` · `POL-PAS-METIER-PRODUIT`.

## Liens

- **publie** le PDF au produit
- **consomme** socle (tenant courant, erreurs) · données et modèle métier au produit
- Canvas : [`ux/page-rendue-wireframe.canvas.tsx`](ux/page-rendue-wireframe.canvas.tsx)
