---
specVersion: 1
kind: screen
appId: layali
screenId: pro-access-requests
name: Acces equipe
status: review
phase: P1
p1MobileId: pro-access-requests
p1Impl: mock
route: /pro/access-requests
layout: pro-shell
zone: pro
roles: [OWNER, ADMIN]
auth: required
flowRefs:
  - ../../flows/pro-access.flow.md
  - ../../flows/pro-membership-review.flow.md
  - ../../flows/pro-membership-request.flow.md
apiRefs:
  - memberships#GET-/memberships/requests
  - memberships#POST-/memberships/requests/:id/approve
  - memberships#POST-/memberships/requests/:id/reject
abstractions:
  components:
    - "@platform/core/components/result-list"
    - "@platform/core/components/filters-panel"
    - "@platform/core/components/button"
    - "@platform/core/components/badge"
  patterns:
    - "pro/list"
    - "pro/approval-queue"
---

# Acces equipe

## P1 - Client Walkthrough

| Champ | Valeur |
|-------|--------|
| Mobile `Screen` | `pro-access-requests` |
| Impl | mock |
| Fixtures | [fixtures.md](../../fixtures.md) |
| Cartographie | [mobile-map.md](../../mobile-map.md) |

> En P1 : **ne pas** utiliser `apiRefs` / composants `@platform/` comme brief agent - mock local uniquement.


## Intent

Donner au proprietaire du venue une file de revue des demandes d'acces pro de son equipe, avec capacite d'approuver ou rejeter chaque demande. L'ADMIN peut consulter cette file en lecture seule si le produit decide de l'exposer.

## Route et accès

- Route : `/pro/access-requests`
- Layout : pro-shell
- Auth : required
- Rôles autorisés : OWNER (plein accès), ADMIN (lecture seule)
- Tenant requis : oui (`X-Tenant-Id`)

## Données nécessaires

| Donnée | Source | Quand chargée | Mise en cache |
|---|---|---|---|
| Demandes d'acces du tenant | [memberships API](../../api/memberships.api.md) `GET /memberships/requests?tenantSlug=&status=` | onInit + filtres | session 30s |

## Mock API consommée

- `GET /api/v1/memberships/requests?tenantSlug=&status=&requestedRole=&q=&cursor=&size=`
- `POST /api/v1/memberships/requests/:id/approve`
- `POST /api/v1/memberships/requests/:id/reject`

## États

### loading
- Liste skeleton + filtres skeleton.

### empty
- "Aucune demande d'acces en attente".
- CTA secondaire : basculer sur `Toutes` pour voir l'historique recent.

### error
- 401 : redirect login.
- 403 `forbidden` : si role sans lecture autorisee, fallback `pro-no-access`.
- 403 `tenant_suspended` : redirect `pro-tenant-suspended`.
- 409 `request_already_processed` : toast info + refresh discret.

### success
- Presets rapides : `En attente`, `Approuvees`, `Rejetees`, `Toutes`.
- Tableau : date demande, nom utilisateur, email/telephone, role demande, message, statut, acteur de revue, date de revue.
- Drawer detail : contexte complet, motif de demande, role final si modifie.
- OWNER : boutons `Approuver` et `Rejeter` sur les lignes `PENDING`.
- ADMIN : badges d'etat visibles mais aucune action mutatrice.

## Actions utilisateur

| Action | Déclencheur | Résultat |
|---|---|---|
| Filtrer par statut ou role | filtres | refetch |
| Rechercher un demandeur | input debounce | refetch `q=` |
| Ouvrir une demande | clic ligne | ouvre le drawer detail |
| Approuver | bouton OWNER | `POST /memberships/requests/:id/approve` |
| Rejeter | bouton OWNER | dialog motif → `POST /memberships/requests/:id/reject` |
| Charger plus | bouton / scroll | requete cursor |

## Composants utilisés

| Composant | Source | Rôle dans l'écran |
|---|---|---|
| result-list | `@platform/core/components/result-list` | liste tableau |
| filters-panel | `@platform/core/components/filters-panel` | filtres et presets |
| button | `@platform/core/components/button` | actions approve/reject |
| badge | `@platform/core/components/badge` | statut et role |

## Composants internes (non réutilisables)

- `<MembershipRequestStatusBadge>` : `PENDING`, `APPROVED`, `REJECTED`.
- `<MembershipRequestDrawer>` : detail complet de la demande.
- `<RejectMembershipRequestDialog>` : saisie du motif de rejet.

## Validations et règles métier

- Preset par defaut : `status=pending`.
- OWNER peut approuver ou rejeter uniquement les lignes `PENDING`.
- ADMIN voit l'ecran en lecture seule ; aucune mutation visible.
- Le role final approuve doit rester dans `HOST`, `ADMIN`, `BAR_MANAGER`.
- Un `request_already_processed` doit recharger silencieusement la ligne sans casser la pagination.

## i18n

- `layali.pro.access-requests.title`
- `layali.pro.access-requests.filters.status`
- `layali.pro.access-requests.filters.role`
- `layali.pro.access-requests.search.placeholder`
- `layali.pro.access-requests.actions.approve`
- `layali.pro.access-requests.actions.reject`
- `layali.pro.access-requests.empty`
- `layali.pro.access-requests.status.<status>`

## Critères d'acceptation

- [ ] Les 4 états sont rendus.
- [ ] OWNER peut approuver ou rejeter une demande `PENDING` depuis la liste.
- [ ] ADMIN peut consulter la liste mais aucun bouton mutateur n'est visible.
- [ ] Une demande deja traitee ne peut plus etre mutée et affiche un retour non bloquant.
- [ ] Aucun appel hors `apiRefs`.

## Open questions

- Faut-il afficher l'historique complet des membres actifs sur ce meme ecran ou separer une future page `Equipe` en V2 ?
