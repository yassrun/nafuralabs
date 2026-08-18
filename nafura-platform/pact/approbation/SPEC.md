# BC approbation — faire décider une demande

> Ce qui est **vrai maintenant**. Pas de futur ici.
> Canon : [`PACT_BLUEPRINT.md`](../../../PACT_BLUEPRINT.md). CADRE : [`../../CADRE.md`](../../CADRE.md).

## Intention

Faire décider une **demande** accrochée à un enregistrement du produit — l'**accepter** ou la **refuser**. Cette app porte la décision et la chaîne de qui décide ; le produit dit ce qui est soumis. Elle n'interprète pas le devis, le chantier, ni le signataire métier.

## Ce que ça fait

- Reçoit une demande sur un enregistrement (`entité` + `id` opaques) avec un titre
- Pose les **étapes** : qui décide, dans quel ordre (un rôle, texte)
- Accepte l'étape en attente ; si toutes les étapes sont acceptées, la demande est acceptée
- Refuse : la demande est refusée tout de suite, les étapes restantes ne se jouent pas
- Liste les demandes d'un enregistrement ; les demandes en attente dont le rôle de l'étape courante est celui de la personne
- Range une **chaîne** (modèle d'étapes pour un type) ; l'administrateur du tenant l'active, la désactive ou la retire
- Démarre un **parcours** sur une chaîne active, l'avance d'une étape, le clôt ou l'annule

## Limites

**owns** — demande, étape de décision, chaîne (modèle d'étapes), parcours (enchaînement d'une chaîne). Tout le jar qui fait décider. Pas de lot à côté.

**not_owns**

| Ce que approbation ne fait pas | Qui s'en charge |
|------------------------------|-----------------|
| Interpréter ce qui est soumis (devis, chantier, article, …) | **le produit** |
| Qui est la personne, son rôle dans le tenant | **contexte Identité** (non spécifié) |
| Prévenir le décideur | **contexte Notification** (non spécifié) |
| Commenter l'enregistrement | **contexte Commentaire** (non spécifié) |
| Joindre un fichier à la demande | **documents** |

## Intervenants

- **bâtisseur d'un produit** — accroche les actions, fournit `entité` + `id` + le titre
- **personne qui utilise un produit** — demande, accepte, refuse — via ce produit
- **administrateur d'un tenant** — range les chaînes de son tenant

## Données

| Objet | Forme | Obligations |
|-------|-------|-------------|
| **Demande** | titre + `entité` + `id` | dans le tenant courant ; `entité` et `id` opaques |
| **Étape** | rang + rôle (texte) | appartient à une demande ; le rôle n'est pas un catalogue de cette app |
| **Chaîne** | code + nom + type (`entité`) + étapes | unique par code et type dans le tenant ; active ou non |
| **Parcours** | chaîne + `entité` + `id` | démarre sur une chaîne **active** qui a des étapes |

`entité` n'est pas un catalogue de cette app (`Invoice` est un mot du produit).

## États

**Demande**

```
en attente → acceptée | refusée
```

Accepter une étape ne clôt la demande que si plus aucune étape n'est en attente. Refuser clôt tout de suite. Pas depuis acceptée ou refusée.

**Étape**

```
en attente → acceptée
```

**Chaîne**

```
présente → retirée
```

Active / inactive : le même objet. On ne retire pas une chaîne tant qu'un parcours est en cours.

**Parcours**

```
en cours → clos | annulé
```

## Règles

- **INV-1** Cette app ne connaît aucun objet métier d'un produit. `entité`, `id` et le rôle d'une étape sont opaques.
- **INV-2** Demande, étape, chaîne et parcours portent le tenant (`POL-TENANT-ISOLATION`).
- **R-1** Lister et lire : seulement dans le tenant courant. `P-APPROBATION-LIRE`.
- **R-2** Demander, accepter, refuser, démarrer un parcours : `P-APPROBATION-DECIDER`. Une demande d'un autre tenant : pas trouvée.
- **R-3** Demander crée une demande **en attente**. Sans étape, l'accepter la clôt **acceptée**.
- **R-4** Accepter seulement une demande **en attente**. L'étape en attente de plus petit rang passe **acceptée**. Si toutes le sont : la demande passe **acceptée**.
- **R-5** Refuser seulement une demande **en attente** : elle passe **refusée**. Les étapes restantes ne se jouent pas.
- **R-6** Les demandes en attente d'une personne sont celles dont une étape en attente a son rôle.
- **R-7** Ranger une chaîne : **admin-tenant**, tenant courant. Un code déjà pris pour ce type est refusé.
- **R-8** Démarrer un parcours : chaîne active avec au moins une étape. Absente ou inactive : rien. Avancer : étape suivante, ou clos si dernière.

Soumis à `POL-TENANT-ISOLATION` · `POL-ERREUR-CODE` · `POL-PAS-METIER-PRODUIT`.

## Liens

- **publie** l'état de la demande (en attente, acceptée, refusée) au produit
- **consomme** socle (tenant courant, erreurs)
- Canvas : aucun — widgets embarqués dans le produit, pas d'écran propre à ce Change
