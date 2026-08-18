# BC notification — prévenir une personne

> Ce qui est **vrai maintenant**. Pas de futur ici.
> Canon : [`PACT_BLUEPRINT.md`](../../../PACT_BLUEPRINT.md). CADRE : [`../../CADRE.md`](../../CADRE.md).

## Intention

Prévenir une **personne** : un **message** à son intention. Cette app notifie ; le produit (ou un autre contexte) demande. Elle ne transporte pas.

## Ce que ça fait

- Reçoit une demande de prévenir quelqu'un : titre, corps, destinataire, accroche opaque
- Range le message dans la boîte de la personne, dans le tenant courant — non lu
- Liste les messages de la personne courante, compte les non lus, les pousse en direct si elle est connectée
- Marque lu (un, plusieurs, tous). Oublie les lues trop anciennes
- Peut regrouper les non lues en un message
- Demande une copie par e-mail selon la préférence ; sans préférence, la copie est demandée

## Limites

**owns** — le message (à une personne), la boîte (lu / non lu), la préférence (quels canaux la personne accepte), la demande de copie

**not_owns**

| Ce que notification ne fait pas | Qui s'en charge |
|---------------------------------|-----------------|
| Transporter le message (e-mail, push, SMTP, Brevo) | **ops** |
| Le métier d'un produit (devis, chantier, alerte ERP, …) | **le produit** |
| Qui est la personne | **identité** (non spécifié) |
| Commenter un enregistrement | **commentaire** (non spécifié) |
| Décider une demande (accepter / refuser) | **approbation** (non spécifié) |
| Composer un courrier documentaire (modèle + pièce métier) | **le produit** · **impression** · **ops** |

## Intervenants

- **bâtisseur d'un produit** — demande de prévenir une personne, fournit titre / corps / accroche
- **personne qui utilise un produit** — est prévenue, lit, marque lu — via ce produit
- **administrateur d'un tenant** — mêmes lectures dans son tenant, pour lui-même

## Données

| Objet | Forme | Obligations |
|-------|-------|-------------|
| **Message** | titre + corps + destinataire | rangé dans le tenant courant ; `entité` + `id` opaques ; une personne, pas un rôle |
| **Boîte** | les messages d'une personne | listée / comptée seulement pour la personne courante |
| **Préférence** | personne + type d'événement + canaux acceptés | absente = copie e-mail demandée |

`entité` n'est pas un catalogue de cette app (`FACTURE` est un mot du produit).

Noms interdits comme types de ce BC : tout type qui nomme un devis, un chantier, une alerte ERP, une paie.

## États

**Message**

```
déposé → lu → retiré
```

Déposé = non lu. Marquer lu ne revient pas en déposé. Retiré = plus de ligne (lues anciennes seulement).

## Règles

- **INV-1** Cette app ne connaît aucun objet métier d'un produit. `entité` + `id` sont opaques.
- **INV-2** Le message porte le tenant (`POL-TENANT-ISOLATION`).
- **INV-3** Ce BC notifie. Il ne transporte pas. Un canal (e-mail, push) est un souhait de la personne, pas un engin.
- **R-1** Lister, compter, flux : seulement la boîte de la personne courante, tenant courant. `P-NOTIFICATION-LIRE`.
- **R-2** Marquer lu / retirer les lues anciennes : seulement les siens, tenant courant. Un message d'un autre tenant : pas trouvé. `P-NOTIFICATION-MARQUER`.
- **R-3** Déposer exige `P-NOTIFICATION-DEPOSER`. Le produit ne notifie pas : il demande à cette app. L'entrée est le destinataire + le message + l'accroche opaque.
- **R-4** Une copie e-mail est demandée à ops si la préférence l'accepte ou si elle est absente. L'engin n'est pas de ce BC.

Soumis à `POL-TENANT-ISOLATION` · `POL-ERREUR-CODE` · `POL-PAS-METIER-PRODUIT`.

## Liens

- **publie** le message (id, titre, lu / non lu) à la personne, via le produit
- **consomme** socle (tenant courant, erreurs) · le destinataire à **identité** (non spécifié)
- Canvas : aucun — cet INIT ne porte pas l'écran
