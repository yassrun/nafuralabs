---
specVersion: 1
kind: flow
appId: layali
flowId: pro-membership-review
name: Revue des demandes d'acces equipe
status: review
actor: OWNER
trigger: ouverture de /pro/access-requests par le proprietaire du venue
screensRefs:
  - ../screens/pro/pro-access-requests.screen.md
  - ../screens/pro/pro-tenant-suspended.screen.md
apiRefs:
  - ../api/memberships.api.md
---

# Revue des demandes d'acces equipe

## Objectif

Permettre au proprietaire d'un venue de consulter, approuver ou rejeter les demandes d'acces pro (`HOST`, `ADMIN`, `BAR_MANAGER`) rattachees a son tenant.

## Acteur déclencheur

- Persona : OWNER principalement ; ADMIN peut consulter en lecture seule si expose en V1.
- Contexte : preparation equipe avant service, ou traitement d'une nouvelle demande recue par email/notification.

## Préconditions

- L'utilisateur est authentifie et rattache au tenant courant avec role `OWNER` ou `ADMIN`.
- Le tenant n'est pas suspendu.

## Étapes

| # | Écran ou état | Action utilisateur | Mock API | Branche / état suivant |
|---|---|---|---|---|
| 1 | [pro-access-requests](../screens/pro/pro-access-requests.screen.md) | ouvre la liste des demandes | `GET /memberships/requests?tenantSlug=&status=pending` | vide → etat empty ; demandes → 2 |
| 2 | [pro-access-requests](../screens/pro/pro-access-requests.screen.md) | filtre ou ouvre une demande | `GET /memberships/requests` | clic approuver → 3 ; clic rejeter → 4 |
| 3 | approbation | confirme le role final | `POST /memberships/requests/:id/approve` | succes → 5 ; erreur → retour 2 |
| 4 | rejet | saisit un motif | `POST /memberships/requests/:id/reject` | succes → 6 ; erreur → retour 2 |
| 5 | demande approuvee | la ligne passe en `APPROVED` et disparait du preset pending | — | fin |
| 6 | demande rejetee | la ligne passe en `REJECTED` avec motif | — | fin |

## Erreurs et reprises

- `request_already_processed` : afficher un toast "Demande deja traitee" puis refresh discret.
- `tenant_suspended` : rediriger vers [pro-tenant-suspended](../screens/pro/pro-tenant-suspended.screen.md).
- `forbidden` : si ADMIN tente une mutation reservee OWNER, afficher lecture seule et toast explicatif.

## Critères d'acceptation

- [ ] Le preset par defaut affiche les demandes `PENDING` du tenant courant.
- [ ] OWNER peut approuver ou rejeter sans quitter la liste.
- [ ] ADMIN peut consulter mais pas muter en V1.
- [ ] Une demande traitee n'apparait plus dans le preset `pending` apres refresh.

## Open questions

- Faut-il permettre a OWNER de modifier le role demande (`HOST` → `BAR_MANAGER`) au moment d'approuver en V1 ?