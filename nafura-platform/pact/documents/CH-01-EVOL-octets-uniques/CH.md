# CH-01-EVOL — octets uniques

**Type :** `EVOL`
**Cible :** BC `documents`
**Qualification :** la SPEC décrit une empreinte calculée et ignorée ; chaque dépôt réécrit les octets. La règle « ne pas stocker deux fois » est muette.

## Pourquoi

Joindre le même fichier deux fois double le stockage. L'empreinte existe déjà sur l'original et ne sert à rien.

## Aujourd'hui

Original : SHA-256 rangé, jamais lu pour réutiliser. Pièce : pas d'empreinte. Deux dépôts identiques = deux objets.

## Attendu

Dans **un même tenant**, la même empreinte = les mêmes octets (une copie). Plusieurs pièces / originaux peuvent pointer dessus. Un autre tenant **re-stocke** (`POL-TENANT-ISOLATION` — même famille que le cache des plans).

Retirer : tant qu'une référence vit dans le tenant, les octets restent. La dernière référence enlevée, les octets partent.

Les pièces portent aussi l'empreinte.

## Critères d'acceptation (gelés)

- **AC-1** Tenant A joint deux fois le même fichier : deux pièces, **un** objet de stockage. (`POL-TENANT-ISOLATION`)
- **AC-2** Tenant B joint le même fichier : un objet **à lui**. La clé / les octets de A ne sont pas réutilisés.
- **AC-3** Retirer une des deux pièces de A : l'autre se télécharge encore. Retirer la dernière : le téléchargement échoue.
- **AC-4** Un original déposé une deuxième fois dans A réutilise les octets déjà rangés (même empreinte).

## Preuves attendues

| Scénario | État initial | AC |
|----------|--------------|----|
| `documents-meme-fichier-deux-pieces` | tenant A, un fichier, deux jointures | AC-1 |
| `documents-meme-fichier-deux-tenants` | même octets, A puis B | AC-2 |
| `documents-retrait-derniere-reference` | deux pièces, même empreinte, chez A | AC-3 |
| `documents-original-reutilise-octets` | un original déjà déposé chez A, mêmes octets | AC-4 |

`POL-TENANT-ISOLATION` · `POL-PAS-METIER-PRODUIT`.

## Hors périmètre

INIT · `CH-02-EVOL-download-tenant` (avant celui-ci) · unifier pièce et original · un seau `documents` · templates / PDF.
