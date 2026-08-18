# BC identite — savoir qui est là

> Ce qui est **vrai maintenant**. Pas de futur ici.
> Canon : [`PACT_BLUEPRINT.md`](../../../PACT_BLUEPRINT.md). CADRE : [`../../CADRE.md`](../../CADRE.md).

## Intention

Savoir **qui est là** : la **personne**, l'**organisation** (tenant), la **session**. Cette app tient l'identité ; le produit ne s'authentifie pas à sa place.

## Ce que ça fait

- Reconnaît une personne (email, nom) et la range — à la connexion si elle n'y est pas encore
- Range une organisation (tenant : clé, nom, email du propriétaire)
- Fait appartenir une personne à un tenant (membre)
- Invite : la personne devient membre invitée ; elle accepte ; elle devient active
- Suspend, réactive ou retire un membre
- Pose sur le membre des **codes de rôle** qui existent pour le tenant (textes)
- L'administrateur d'un tenant liste et gère les membres de ce tenant
- La personne courante lit et met à jour son profil (nom)
- Liste la session courante de la personne

## Limites

**owns** — personne, organisation (le tenant *en tant que qui*), appartenance, invitation, session, affectation d'un code de rôle au membre, écran admin des membres

**not_owns**

| Ce que identite ne fait pas | Qui s'en charge |
|-----------------------------|-----------------|
| Réglages génériques (définitions, valeurs, résolution) | **non spécifié** |
| Marque, langue, préférences d'affichage du tenant | **non spécifié** |
| Préférences d'affichage de la personne (locale, thème) | **non spécifié** |
| Préférences de notification de la personne | **notification** (non spécifié) |
| Catalogue des rôles, ce qu'un code autorise, rôles custom, catalogue de permissions | **socle** |
| Rôles et droits métier d'un produit | **le socle de l'app cliente** |
| Login, mot de passe, prestataire d'identité | **ops** |
| Envoyer le courrier d'invitation | **notification** (non spécifié) |
| Domaines / drapeaux de fonctionnalités du tenant | **non spécifié** |
| Le métier d'un produit (devis, chantier, paie, …) | **le produit** |

## Intervenants

- **administrateur d'un tenant** — membres, accès de son tenant
- **personne qui utilise un produit** — est membre, accepte une invitation, tient son profil
- **bâtisseur d'un produit** — consomme qui est là ; n'authentifie pas

## Données

| Objet | Forme | Obligations |
|-------|-------|-------------|
| **Personne** | email + nom | l'email identifie ; une personne, plusieurs tenants |
| **Organisation** | clé + nom + email du propriétaire | isolée ; le tenant *en tant que qui* |
| **Appartenance** | personne + tenant + statut | une par couple personne/tenant |
| **Invitation** | jeton + email + tenant + expiration | liée à une appartenance invitée |
| **Affectation de rôle** | code texte sur l'appartenance | le code existe pour le tenant ; au moins un |
| **Session** | session courante de la personne | une listée ; révoquer n'a pas d'effet |

Le code de rôle n'est pas un catalogue de ce BC (`estimeur` est un mot du produit ; `OWNER` est un mot du moteur).

Noms interdits comme types de ce BC : `Devis`, `Chantier`, `Paie`, et tout type qui nomme un métier produit.

## États

**Appartenance**

```
invitée → active ⇄ suspendue
invitée | active | suspendue → retirée
```

Retirée = plus de ligne d'appartenance. La personne reste si un autre tenant la tient.

**Invitation**

```
en attente → acceptée | révoquée | expirée
```

Relancer = nouvel envoi tant que l'appartenance est invitée.

**Personne** — présente. Pas de brouillon.

**Session** — courante (seule listée).

## Règles

- **INV-1** Cette app ne connaît aucun objet métier d'un produit. Aucun type de ce BC ne s'appelle `Devis`, `Chantier`, `Paie`.
- **INV-2** Appartenance, invitation et organisation portent le tenant (`POL-TENANT-ISOLATION`).
- **R-1** Lister / lire un membre : seulement dans le tenant sur lequel on agit. `P-IDENTITE-LIRE`.
- **R-2** Inviter exige `P-IDENTITE-GERER`, un email et au moins un code de rôle du tenant. Statut : invitée. Un email déjà membre de ce tenant est refusé. Le même email chez un autre tenant est une autre appartenance.
- **R-3** Accepter avec un jeton valide : invitée → active. Sans session. Jeton invalide ou expiré : refusé. Déjà active : accepté, inchangé.
- **R-4** Suspendre / réactiver : `P-IDENTITE-GERER`. `active ⇄ suspendue`.
- **R-5** Retirer exige `P-IDENTITE-GERER`. Plus d'appartenance. La personne n'est pas effacée.
- **R-6** Remplacer les codes de rôle d'un membre : au moins un code qui existe pour le tenant. `P-IDENTITE-GERER`.
- **R-7** Un membre de A n'est pas listé chez B. Agir sur l'appartenance de A depuis B échoue.
- **R-8** La personne courante lit et met à jour son nom.
- **R-9** Relancer l'invitation : seulement si l'appartenance est invitée. `P-IDENTITE-GERER`.

Soumis à `POL-TENANT-ISOLATION` · `POL-ERREUR-CODE` · `POL-PAS-METIER-PRODUIT`.

`P-IDENTITE-LIRE` et `P-IDENTITE-GERER` : le BC les nomme ; la matrice socle ne les indexe pas encore (`CH-07-EVOL-consommateur-identite`).

## Liens

- **publie** personne, organisation, appartenance au produit
- **consomme** socle (tenant courant, erreurs) · le courrier à **notification** · l'IdP à **ops**
- Canvas : [`ux/membres-tenant-wireframe.canvas.tsx`](ux/membres-tenant-wireframe.canvas.tsx)
