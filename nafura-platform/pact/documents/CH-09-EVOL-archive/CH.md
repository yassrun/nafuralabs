# CH-09-EVOL — archivé : une seule vérité

**Type :** `EVOL`
**Cible :** BC `documents`
**Qualification :** « archivé » existe dans le code sans que la SPEC dise ce que c'est.

## Pourquoi

Un état qui n'est ni spécifié ni supprimé finit par être interprété différemment à chaque usage. Deux lectures possibles : une **transition** d'un cycle de vie, ou un **reste** à jeter. Les deux sont défendables ; ce qui ne l'est pas, c'est de ne pas trancher.

## Aujourd'hui

Le champ existe et personne ne peut dire s'il est porteur.

## Attendu

**Le spec tranche**, et la SPEC ne porte plus qu'une seule vérité : soit `archivé` est une transition documentée du cycle de vie, soit il disparaît du contrat et du code.

## Critères d'acceptation (gelés)

- **AC-1** La SPEC `documents` dit ce qu'est `archivé`, ou ne le mentionne plus du tout.
- **AC-2** Si transition : le cycle de vie la nomme, avec qui la déclenche et ce qu'elle interdit ensuite.
- **AC-3** Si drop : plus aucune occurrence dans le contrat, le code et les migrations.
- **AC-4** Aucune lecture ambiguë ne subsiste — on ne peut pas répondre « ça dépend » à la question « qu'est-ce qu'un document archivé ».
- **AC-5** La suite e2e `documents-*` reste verte.

## Preuves attendues

Revue de SPEC pour AC-1 → AC-4. Suite `documents-*` pour AC-5.

## Hors périmètre

La corbeille · la rétention légale · l'export
