# 02 — Fiche unique

> Revue 2026-10-07, doublon D2. Taille **M** (front, un peu de back). Dépend de [03](03-types-de-champs.md) et [07](07-section-ecran.md). À faire avec le lot 5 de [01](01-liste-unique.md).

## Objectif

Les fiches de la plateforme passent par `nf-record-page` et `RecordPageConfig`. `nf-entity-detail` et `ConfigDrivenDetailPage` ne servent plus qu'à Sektor.

## Besoin

- Deux fiches coexistent :
  - `nf-record-page` : 1 composant, sections, onglets, étapes, cycle de vie, collaboration ;
  - `nf-entity-detail` (1 239 lignes) + `ConfigDrivenDetailPage` (757 lignes), avec une façade (`DetailFacade`) écrite à la main pour chaque écran.
- Les écrans IAM n'ont donc pas la barre d'enregistrement, la garde de sortie, ni le comportement des fiches de BC.
- `iam.md` signale déjà « UX archétype » comme manque de la capability.

## Existant

| Écran | Fichier | Particularités |
|---|---|---|
| Détail membre | `app/identite/member-detail/member-detail.page.ts` (370 lignes) | Créer = inviter (`inviteMember`, corps différent : `toInvite`) ; modifier = `toUpdate` ; actions propres (`onAction`) |
| Détail rôle | `features/administration/iam/roles/role-detail/role-detail.page.ts` (158) + `role-members-section.component.ts` (175) | `nf-permission-picker` (arbre de permissions groupées) ; section « membres du rôle » = `nf-listing-flat` intégrée à la main |
| Éléments récents | `core/shell/command-palette/recent-items.service.ts` | Référence `ConfigDrivenDetailPage` |

## Contrat

### Lot 1 — Détail rôle

- Le rôle devient un `RecordController` (lot 5 de 01) ou garde son API ; `nf-record-page` exige `GET/PUT/DELETE {endpoint}/{id}` et `POST {endpoint}`, à vérifier sur `/api/tenants/{tenantId}/roles`.
- `RecordPageConfig` :
  - section `fields` : code, libellé, description ;
  - section `kind: 'screen'` ([07](07-section-ecran.md)) qui affiche le choix des permissions : écran déclaré par la plateforme, qui utilise `nf-permission-picker` ;
  - section `listing` : membres du rôle (`ListingPageConfig` filtré sur le rôle), à la place de `role-members-section`.
- Un rôle système (plateforme ou `defaultRoles` d'un BC) est en lecture seule : `permissions.update` absente ou `readonly` conditionnel ([08](08-champs-conditionnels.md)).

### Lot 2 — Détail membre

- Création : plus de mode `new` sur la fiche. On invite par une action de liste avec formulaire (lot 5 de 01), ce qui supprime `toInvite`.
- Fiche : identité (lecture seule), rôles (`multiselect` avec `lookupKey`), statut de l'appartenance, audience. Les actions propres (suspendre, renvoyer l'invitation…) deviennent des `RecordAction` (`POST /{id}/<action>`).
- Retirer `DetailFacade` et `MembersFacade` s'ils n'ont plus d'utilisateur.

### Lot 3 — Nettoyage

- `recent-items.service.ts` lit la route ou le `RecordPageConfig`, et ne dépend plus de `ConfigDrivenDetailPage`.
- `architecture:check` interdit l'import de `nf-entity-detail` et de `ConfigDrivenDetailPage` hors `lib/anatomy` et Sektor ([04](04-heritage-sektor.md)).

## Règles

- Aucun composant propre à l'écran dans `features/` ou `app/` pour ces fiches, en dehors de l'écran déclaré pour le choix des permissions.
- Les permissions vérifiées sont celles de `administration.iam.*` existantes ; pas de vérification de rôle (`OWNER`).
- Le dernier `OWNER` ne peut pas être retiré : la règle reste côté serveur (roadmap IAM), la fiche affiche le 409.

## Vérification

1. `node platform-host/ops/run.mjs check`.
2. Lab, en `admin@host.local` :
   - créer un rôle, cocher des permissions, enregistrer (Ctrl+S), recharger : les permissions sont conservées ;
   - ouvrir un rôle système : lecture seule ;
   - membres du rôle visibles ;
   - inviter un membre depuis la liste ; modifier ses rôles depuis sa fiche.
3. En `reader@host.local` : fiches en lecture seule, aucune action.
4. Garde de sortie : quitter avec des modifications non enregistrées affiche la confirmation.

## État (2026-10-08)

Livré : fiches rôle et membre en `RecordPageConfig` ; permissions en section écran ; membres du rôle en section listing ; listes IAM en `nf-listing-page` (01 lot 5) ; allowlist détail vidée. Façades `/api/v1/platform/admin/{roles,members}`.

## Critères d'acceptation

- [x] Détail rôle et détail membre sont des `RecordPageConfig`.
- [x] `role-members-section.component.ts`, `member-detail.page.ts` et `role-detail.page.ts` sont supprimés (ou réduits à leur configuration).
- [x] Plus aucune référence à `ConfigDrivenDetailPage` ni `nf-entity-detail` hors `lib/anatomy` et Sektor.

## Documentation

- `docs/capabilities/iam.md` : état et note mis à jour, retirer « UX archétype » de la roadmap.
- `docs/PLATFORM.md` § Permissions et rôles : la phrase « listing + détail config-driven (`nf-entity-detail`) » devient « archétypes liste et fiche ».

## Décisions ouvertes

1. Le choix des permissions doit-il devenir un type de champ (`permissions`) plutôt qu'une section d'écran ? Recommandation : section d'écran ([07](07-section-ecran.md)). Un seul écran en a besoin, ce qui ne justifie pas un type de champ.
