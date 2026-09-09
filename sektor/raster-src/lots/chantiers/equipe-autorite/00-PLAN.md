# Autorité des affectations chantier

> Nommer, remplacer ou retirer un membre de l’équipe d’un chantier n’est plus un simple `chantiers.update` : chaque rang commande strictement les rangs inférieurs, dans son périmètre.

## Intention

Aujourd’hui POST/PUT/DELETE d’affectation ne regardent que la permission IAM. Un chef de chantier avec le droit d’update peut nommer un Directeur des travaux.

Après livraison : l’autorité est une **politique de domaine** dans le BC chantiers. IAM ouvre la porte ; le **grade de commandement** décide qui on peut nommer.

## Périmètre

- Inclus : create / update / deactivate d’affectation ; `GET …/roles` = rôles que **l’acteur courant** peut nommer sur **ce** chantier ; flag `canMutate` sur chaque ligne ; onglet Équipe (CTA, liste des rôles, retirer).
- Exclus : répartition des tâches du chef d’équipe (planning / pointage) ; nouvelle permission IAM par rang ; unicité « un seul titulaire par rôle » ; magasinier / pointeur / ingénieur hors de l’échelle de commandement.

## Approche

Une seule comparaison, pas une matrice rôle × rôle.

1. **Grade de commandement** (entier) sur le rôle cible. L’acteur commande un rôle ssi `grade(acteur) > grade(cible)`.
2. **Acteur sur ce chantier** :
   - OWNER / SUPER_ADMIN / `BTP_DG` → grade Direction (tous chantiers).
   - sinon → max des grades de ses **affectations actives** sur ce chantier.
   - IAM DT / conducteur / chef **sans** nomination sur le chantier → aucun droit d’affectation ici.
3. **Cascade** : un DT (3) commande conducteur (2) **et** tout ce qui est en dessous. Pas de liste spéciale par rôle.
4. **Périmètre** = la nomination, pas le rôle IAM. « Ses chantiers » = ceux où il est affecté.

Échelle (cible → grade) :

| Grade | Rôles cibles | Qui peut les nommer |
|---|---|---|
| 0 | Chef d’équipe, pointeur | Chef de chantier et au-dessus |
| 1 | Chef de chantier, magasinier, ingénieur | Conducteur et au-dessus |
| 2 | Conducteur de travaux | DT et au-dessus |
| 3 | Directeur des travaux | DG / Owner |
| 4 | Direction (non affectable) | — |

IAM reste la porte (`chantiers.chantiers.chantier.update`, déjà seedée). Pas de `chantiers.affectations.dt`.

`HIERARCHY_ASC` / `nextHigherRole` restent pour le **repli d’approbateur** en cas d’absence — autre problème.

Création de chantier : pas encore de nomination sur le nouveau chantier → seuls Direction / DG posent les titulaires initiaux. Le DT nomme le reste **après** avoir été affecté, onglet Équipe.

## Tasks

| # | Task | agent_type | blocked_by |
|---|---|---|---|
| 1 | SEKTOR-322 Clarifier le résultat | spec | — |
| 2 | SEKTOR-323 Politique de grade, API, onglet Équipe | exec | 322 |

## Validation technique

- Tests unitaires de `commandGrade` / `canCommand` : DT nomme conducteur + chef ; conducteur ne nomme pas DT ; chef d’équipe ne nomme personne ; DG nomme DT.
- Tests policy : acteur sans affectation sur le chantier → 403 ; acteur DT affecté → OK pour conducteur, 403 pour DT.
- `GET …/roles` ne renvoie que les rôles commandables par l’acteur.
- Gradle `:chantiers:test` sur les classes touchées.
- `node raster/t.mjs check`.

## Blocages extérieurs

Aucun. Mode B owner (SUPER_ADMIN) conserve le grade Direction — bootstrap inchangé.
