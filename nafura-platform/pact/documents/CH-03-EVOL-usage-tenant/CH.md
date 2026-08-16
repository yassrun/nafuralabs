# CH-03-EVOL — usage par tenant

**Type :** `EVOL`
**Cible :** BC `documents`
**Qualification :** la SPEC park « compter l'usage disque » en *non spécifié*. Muette → EVOL.

## Pourquoi

Documents owns les octets et l'empreinte. Après R-5, sommer les pièces **compte deux fois** le même objet. Personne n'a le droit de publier un chiffre juste tant que ce n'est pas ce contexte.

## Aujourd'hui

Pas de contrat. Le module `usage` (hors ce BC) additionne les tailles de lignes. IAM `storageUsed` est vide. Quota : aucun.

## Attendu

Documents **publie** l'usage du tenant courant : octets des **objets uniques** (une empreinte = une fois), pièces et originaux chacun de leur côté. Un autre tenant n'entre pas dans le chiffre.

Pas de quota. Pas de dossier. Pas d'écran.

## Critères d'acceptation (gelés)

- **AC-1** Tenant A joint un fichier de N octets : l'usage de A vaut N. (`R-6`)
- **AC-2** Tenant A joint une deuxième fois le même fichier : l'usage reste N. (`R-5`, `R-6`)
- **AC-3** Tenant B : son usage ne contient pas les octets de A. (`POL-TENANT-ISOLATION`)
- **AC-4** Après retrait de la dernière référence chez A : l'usage de A ne contient plus ces N octets. (`R-4`, `R-6`)

## Preuves attendues

| Scénario | État initial | AC |
|----------|--------------|----|
| `documents-usage-une-piece` | tenant A, un fichier de N octets | AC-1 |
| `documents-usage-deux-pieces-meme-empreinte` | A, deux jointures, mêmes octets | AC-2 |
| `documents-usage-deux-tenants` | A a un fichier ; B ensuite | AC-3 |
| `documents-usage-apres-retrait` | A, deux pièces même empreinte, puis retraits | AC-4 |

`POL-TENANT-ISOLATION` · `POL-PAS-METIER-PRODUIT`. Action : `P-DOCUMENT-MESURER`.

## Hors périmètre

Quota / plafond / refus d'upload · dossier / classeur · écran admin ou produit · unifier pièce et original · le module `administration/usage` (super-admin, hors Pact) · IAM `storageUsed`
