# BC documents — conserver un fichier

> Ce qui est **vrai maintenant**. Pas de futur ici.
> Canon : [`PACT_BLUEPRINT.md`](../../../PACT_BLUEPRINT.md). CADRE : [`../../CADRE.md`](../../CADRE.md).

## Intention

Conserver un **fichier** pour un produit, le rendre, le retirer. Cette app stocke ; le produit décide à quoi le fichier se rattache. Elle n'extrait pas, n'imprime pas, n'interprète pas.

## Ce que ça fait

- Reçoit un fichier, le range, en garde le nom, le type, la taille, l'empreinte
- Accroche une **pièce** à un enregistrement du produit (`entité` + `id` opaques)
- Range un **fichier** que le produit peut **tenir** par son id (dépôt sans accroche)
- Dans un tenant, ne range pas deux fois les mêmes octets — pièce ou tenu, même tas
- Publie l'usage du tenant courant (octets des objets uniques)
- Refuse si l'usage plus les octets nouveaux dépasse le plafond du tenant
- Refuse un fichier plus grand que 50 Mio
- Rend les octets. Retire la pièce (plus de ligne ; les octets partent à la dernière référence)

## Limites

**owns** — fichier, clé de rangement, métadonnées, pièce (accroche), fichier tenu (id gardé par le produit), usage (octets uniques du tenant), quota (applique le plafond)

**not_owns**

| Ce que documents ne fait pas | Qui s'en charge |
|------------------------------|-----------------|
| Interpréter le contenu (devis, photo de chantier, …) | **le produit** |
| Tirer une structure du fichier | **document-extraction** |
| Produire une page / un PDF | **impression** |
| Modèles métier d'une page (facture, devis, …) | **le produit** |
| Commenter | **contexte Commentaire** (non spécifié) |
| Qui *fixe* le plafond (offre / abonnement) | **non spécifié** (lab : `documents.quota.bytes`) |
| Classeur / dossier visible | **le produit** |

## Intervenants

- **bâtisseur d'un produit** — accroche le widget, reçoit la clé ou l'id
- **personne qui utilise un produit** — joint, télécharge, retire — via ce produit
- **administrateur d'un tenant** — mêmes actions dans son tenant

## Données

| Objet | Forme | Obligations |
|-------|-------|-------------|
| **Fichier** | octets + nom + type + taille | rangé sous une clé qui **porte le tenant** ; au plus **50 Mio** |
| **Empreinte** | SHA-256 des octets | dans un tenant, la même empreinte = le même objet ; un autre tenant re-stocke |
| **Pièce** | fichier accroché à `entité` + `id` (textes opaques) | listée / retirée dans le tenant courant |
| **Tenu** | le produit / l'extraction garde l'id du fichier | pas de REST public ; même objet qu'une pièce de même empreinte |
| **Usage** | octets du tenant courant | une empreinte = une fois, peu importe pièce ou tenu |
| **Quota** | plafond d'usage du tenant | `usage + octets nouveaux` (empreinte absente) ≤ plafond ; absent ou ≤ 0 = pas de plafond |

Un fichier, deux pointeurs. `entité` n'est pas un catalogue de cette app (`FACTURE` est un mot du produit).

## États

**Pièce**

```
présente → retirée
```

Retirée = plus de ligne. Les octets partent à la dernière référence du tenant. Pas de brouillon.

**Tenu**

```
déposé → retiré
```

Retiré = ligne marquée. Les octets partent à la dernière référence du tenant (pièce ou tenu).

## Règles

- **INV-1** Cette app ne connaît aucun objet métier d'un produit. `entité` + `id` sont opaques.
- **INV-2** Métadonnées et clé de rangement portent le tenant (`POL-TENANT-ISOLATION`).
- **R-1** Lister et retirer une pièce : seulement dans le tenant courant.
- **R-2** Télécharger par clé : `P-DOCUMENT-LIRE` **et** la clé appartient au tenant courant. Sinon : pas trouvé — même erreur qu'une clé inconnue.
- **R-3** Joindre exige `P-DOCUMENT-JOINDRE`. Lire / télécharger exige `P-DOCUMENT-LIRE`. Retirer exige `P-DOCUMENT-RETIRER`. Mesurer l'usage exige `P-DOCUMENT-MESURER`.
- **R-4** Retirer une pièce enlève la ligne. Les octets partent quand plus aucune référence du tenant (pièce ou tenu) ne les pointe.
- **R-5** Dans un tenant, une empreinte = un objet de stockage, pièce ou tenu. Un autre tenant re-stocke.
- **R-6** L'usage d'un tenant = somme des tailles des objets uniques. Une empreinte, une fois — les deux pointeurs ne s'additionnent pas.
- **R-7** Un fichier plus grand que 50 Mio est refusé (`PAYLOAD_TOO_LARGE`). Pas de ligne, pas d'octets. Un produit peut être plus strict.
- **R-8** Si `usage + octets d'un objet nouveau` dépasse le plafond : refus (`STORAGE_QUOTA_EXCEEDED`), pas de ligne. Une empreinte déjà présente ne consomme pas.

Soumis à `POL-TENANT-ISOLATION` · `POL-ERREUR-CODE` · `POL-PAS-METIER-PRODUIT`.

## Liens

- **publie** pièce (id, clé, nom), fichier tenu (id) et usage (octets) au produit
- **consomme** socle (tenant courant, erreurs)
- Canvas : [`ux/piece-jointe-wireframe.canvas.tsx`](ux/piece-jointe-wireframe.canvas.tsx)
