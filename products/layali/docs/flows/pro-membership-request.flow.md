---
specVersion: 1
kind: flow
appId: layali
flowId: pro-membership-request
name: Demande d'acces pro a un venue
status: review
actor: HOST
trigger: utilisateur authentifie sans membership compatible sur un tenant tente d'acceder a /pro
screensRefs:
  - ../screens/pro/pro-no-access.screen.md
  - ../screens/pro/pro-access-request.screen.md
  - ../screens/pro/pro-access-requests.screen.md
apiRefs:
  - ../api/memberships.api.md
---

# Demande d'acces pro a un venue

## Objectif

Donner une sortie utile a un utilisateur authentifie qui n'a pas encore de rattachement pro pour un venue cible, afin qu'il puisse demander un acces au role adequat.

## Acteur déclencheur

- Persona : HOST, BAR_MANAGER, ADMIN potentiel, parfois CUSTOMER recruté par un venue.
- Contexte : echec guard sur une route `/pro/*` avec raison `no_tenant_membership` ou `role_not_allowed`.

## Préconditions

- L'utilisateur est authentifie.
- Le tenant cible est connu via sous-domaine, header ou querystring.
- Le systeme accepte les demandes d'acces manuelles V1.

## Étapes

| # | Écran ou état | Action utilisateur | Mock API | Branche / état suivant |
|---|---|---|---|---|
| 1 | [pro-no-access](../screens/pro/pro-no-access.screen.md) | l'utilisateur lit le motif de refus | — | clique `Demander un acces` → 2 |
| 2 | [pro-access-request](../screens/pro/pro-access-request.screen.md) | remplit role, téléphone, message | `POST /memberships/requests` | succes → 3 ; erreur → reste 2 |
| 3 | succes demande | consulte le resume | — | attente de revue OWNER/PLATFORM_ADMIN |
| 4 | [pro-access-requests](../screens/pro/pro-access-requests.screen.md) | OWNER du tenant ouvre la liste des demandes et choisit approuver ou rejeter | `GET /memberships/requests`, `POST /memberships/requests/:id/approve`, `POST /memberships/requests/:id/reject` | approbation → 5 ; rejet → 6 |
| 5 | demande approuvee | l'utilisateur demandeur recoit notification et peut retenter `/pro` | — | prochain login/refresh → acces pro actif |
| 6 | demande rejetee | l'utilisateur demandeur recoit notification avec motif | — | fin |

## Erreurs et reprises

- `request_already_pending` : rester sur l'ecran avec message clair et sans duplication.
- `membership_exists` : proposer `Aller au back-office`.
- `tenant_suspended` : rediriger vers `pro-tenant-suspended`.
- `request_already_processed` : cote OWNER, desactiver les actions et rafraichir la liste.

## Critères d'acceptation

- [ ] Le passage depuis `pro-no-access` vers la demande d'acces preserve `tenant` et `suggestedRole`.
- [ ] Une demande deja existante ne cree pas de doublon.
- [ ] Un utilisateur deja membre n'est pas laisse dans un cul-de-sac.
- [ ] Une demande approuvee permet ensuite a l'utilisateur de re-rentrer sur `/pro` avec le tenant adequat.

## Open questions

- Notification d'approbation par email, SMS ou uniquement in-app en V1 ? Décision provisoire : email.
