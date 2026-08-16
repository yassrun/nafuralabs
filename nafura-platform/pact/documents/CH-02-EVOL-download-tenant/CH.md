# CH-02-EVOL — download dans le tenant

**Type :** `EVOL`
**Cible :** BC `documents`
**Qualification :** R-2 décrit un download par clé sans revérif tenant. C'est conforme à la photo, pas à l'isolation.

## Pourquoi

`POL-TENANT-ISOLATION` exige que les octets d'un tenant ne soient pas servis à un autre. R-2 le contredit.

## Aujourd'hui

`P-DOCUMENT-LIRE` + une clé connue suffisent. Le tenant de la clé n'est pas revérifié.

## Attendu

Télécharger exige `P-DOCUMENT-LIRE` **et** que la clé appartienne au tenant courant. Sinon : pas trouvé (même code d'erreur qu'une clé inconnue — on ne révèle pas l'existence chez un autre).

## Critères d'acceptation (gelés)

- **AC-1** Tenant A joint et télécharge : mêmes octets. (`R-3`)
- **AC-2** Tenant B, même clé que A : échec, pas d'octets. (`POL-TENANT-ISOLATION`)
- **AC-3** La réponse de B ne distingue pas « clé d'un autre tenant » et « clé inconnue ».

## Preuves attendues

| Scénario | État initial | AC |
|----------|--------------|----|
| `documents-download-proprietaire` | pièce chez A | AC-1 |
| `documents-download-autre-tenant` | clé de A, session B | AC-2, AC-3 |

`POL-TENANT-ISOLATION` · `POL-ERREUR-CODE`.

## Hors périmètre

Octets uniques · unifier les deux formes · changer le nombre de seaux (un seau `documents`, préfixe tenant — figé, pas ce CH).
