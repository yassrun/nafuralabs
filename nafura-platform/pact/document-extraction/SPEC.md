# BC document-extraction — tirer une structure d'un document

> Ce qui est **vrai maintenant**. Pas de futur ici.
> Canon : [`PACT_BLUEPRINT.md`](../../../PACT_BLUEPRINT.md). CADRE : [`../../CADRE.md`](../../CADRE.md).

## Intention

Tirer d'un **document** une **structure** (liste ou arbre) selon un **plan d'extraction**. Cette app extrait ; le produit interprète. L'IA compile le plan, elle ne lit pas les lignes.

## Ce que ça fait

- Reçoit un **schéma** du produit (champs attendus) — ne le compose pas
- Détecte une **grille** dans le fichier (tableau à colonnes)
- Compile un **plan d'extraction** typé : colonnes liées à des champs, classes de lignes, hiérarchie
- Exécute le plan sur la grille → enregistrements
- Si pas de grille (scan, image) : palier vision / modèle — toujours un plan validé avant d'accepter le résultat
- Signale des **doutes** de deux natures, jamais fusionnées à l'écran

## Limites

**owns** — grille, plan d'extraction, empreinte de trame, résultat structuré, doutes d'extraction

**not_owns**

| Ce que document-extraction ne fait pas | Qui s'en charge |
|----------------------------------------|-----------------|
| Interpréter un devis, un article, un nœud métier | **le produit** |
| Composer, cataloguer ou versionner un type de document (builder, schéma d'écran, colonnes de liste) | **le produit** |
| Conserver le fichier comme pièce jointe | **documents** |
| Prévenir quelqu'un | **contexte Notification** (non spécifié) |
| Décider une demande (accepter / refuser un résultat : brouillon, validé, refusé) | **contexte Approbation** (non spécifié) |

## Intervenants

- **bâtisseur d'un produit** — fournit le schéma attendu, reçoit la structure
- **personne qui utilise un produit** — dépose le fichier, revoit les doutes
- **administrateur d'un tenant** — même actions dans son tenant

## Données

| Objet | Forme | Obligations |
|-------|-------|-------------|
| **Grille** | lignes × cellules texte | obtenue du fichier ; vide = pas de palier grille |
| **Plan d'extraction** | source, liaisons colonne→champ, classes de lignes, hiérarchie (`NONE` \| `LEARNED`), chemins de collections | typé, borné ; jamais du code généré ; le schéma des champs vient du produit |
| **Empreinte** | signature de la trame | clé de cache **avec** le tenant (`POL-TENANT-ISOLATION`) |
| **Résultat** | enregistrements (liste ou arbre) | produit du plan appliqué à la grille |
| **Doute** | nature `extraction` \| `manque-source`, champ, ligne | une nature, jamais les deux à la fois |

Hiérarchie `NONE` : liste plate. `LEARNED` : groupes et feuilles lus dans la grille, sans objet métier du produit.

## États

**Extraction**

```
déposée → en cours → réussie | échouée
```

Relancer depuis `échouée`. Pas depuis `en cours`.

C'est le seul cycle de ce BC. Pas de brouillon / validé / refusé sur le résultat.

**Plan**

```
absent → compilé → en cache (tenant + empreinte)
```

Un plan en cache d'un tenant n'est pas servi à un autre.

## Règles

- **INV-1** Cette app ne connaît aucun objet métier d'un produit. Le produit ne connaît aucune empreinte de trame.
- **INV-2** L'IA compile un plan (en-têtes / schéma). Elle ne lit pas les données des lignes.
- **INV-3** Deux natures de doutes. Jamais un pourcentage ni un compteur unique qui les fusionne.
- **INV-4** Un plan n'entre en cache que s'il passe le validateur.
- **R-1** Palier heuristique : lier les colonnes par **nom d'en-tête et titres** du schéma. Pas de repli sur la position (colonne 0 = premier champ).
- **R-2** Cascade : heuristique → cache de ce tenant → compilation IA → vision. On s'arrête au premier plan accepté.
- **R-3** Pas de grille → pas d'heuristique ni de cache grille. Palier vision / modèle.
- **R-4** Lancer une extraction exige `P-EXTRACTION-LANCER`. Revoir les doutes exige `P-EXTRACTION-REVOIR`.
- **R-5** Reclasser un doute (extraction ↔ manque-source) est un geste manuel, sans relancer l'IA et sans éditer le fichier.

Soumis à `POL-TENANT-ISOLATION` · `POL-ERREUR-CODE` · `POL-PAS-METIER-PRODUIT`.

## Liens

- **publie** structure + doutes au produit qui a fourni le schéma
- **consomme** socle (tenant courant, erreurs)
- Canvas : [`ux/carte-des-doutes-wireframe.canvas.tsx`](ux/carte-des-doutes-wireframe.canvas.tsx)
