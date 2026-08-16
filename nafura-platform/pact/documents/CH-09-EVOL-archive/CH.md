# CH-09-EVOL — archivé : une seule vérité

**Type :** `EVOL`
**Cible :** BC `documents`
**Qualification :** « archivé » existe dans le code sans que la SPEC dise ce que c'est. Muette sur l'objet → EVOL.

## Décision

**Drop.** `archivé` n'est pas une transition. Il disparaît du contrat et du code.

Le cycle Tenu est déjà `déposé → retiré`. Aucune action `P-DOCUMENT-*`, aucun service, aucune API n'écrit `ARCHIVED`. Les motifs qui justifieraient un troisième état (corbeille, rétention légale, export) sont hors périmètre. Un état inatteignable n'est pas un état.

## Pourquoi

Un état qui n'est ni spécifié ni supprimé finit par être interprété différemment à chaque usage. CH-07 l'avait laissé hors périmètre (« `archivé` sans transition »). Ici on tranche.

## Aujourd'hui

`DocumentStatus.ARCHIVED` existe. Rien ne le pose. La SPEC le mentionnait comme « sans transition ».

## Attendu

La SPEC ne nomme plus `archivé`. Le cycle Tenu reste `déposé → retiré`. Le code et les migrations du BC documents ne portent plus `ARCHIVED`.

## Critères d'acceptation (gelés)

- **AC-1** La SPEC `documents` décrit le Tenu uniquement comme `déposé → retiré`. Elle ne nomme pas `archivé`.
- **AC-2** Plus aucune occurrence de `ARCHIVED` / `archivé` dans le contrat documents, l'enum, les services, l'API et les migrations de ce BC.
- **AC-3** Déposer puis retirer un tenu : ligne marquée ; les octets partent à la dernière référence du tenant.
- **AC-4** Aucune action, aucun champ, aucune erreur n'expose un document « archivé ».
- **AC-5** La suite e2e `documents-*` reste verte.

## Preuves attendues

| Scénario | État initial | AC |
|----------|--------------|----|
| revue SPEC | SPEC `documents` après patch | AC-1 |
| `documents-archive-absent` | tenant A, un tenu déposé | AC-2, AC-4 |
| `documents-tenu-retrait` | tenant A, un tenu déposé, seule référence | AC-3 |
| suite `documents-*` | inchangée | AC-5 |

`POL-TENANT-ISOLATION` · `POL-ERREUR-CODE` · `POL-PAS-METIER-PRODUIT`.

## Hors périmètre

La corbeille · la rétention légale · l'export

## Constat d'écart

**Verdict :** spec-ok. Après PLT-98 (`review`).

Le livré tient les AC gelés. La SPEC déjà patchée par PLT-97 est la vérité visée : Tenu `déposé → retiré`, retiré = ligne marquée, plus de nom `archivé`. Rien à y ajouter.

Choix d'implémentation jugés, **non recopiés** dans la SPEC : pas de changelog documents (colonne texte, schéma hors BC) ; champ de cycle conservé ; preuves dans les suites existantes. Ça ne contredit pas le contrat.

Hors périmètre confirmé, pas une dette : `ConversationStatus.ARCHIVED`, ruban UX `document-status-ribbon`, fichiers `venue-catalog` non touchés. Pas de question bloquante. QA peut enchaîner.
