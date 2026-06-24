---
specVersion: 1
kind: screen
appId: layali
screenId: pro-access-request
name: Demande d'acces pro
status: review
route: /pro/request-access
layout: public-shell
zone: pro
roles: [OWNER, ADMIN, HOST, BAR_MANAGER, CUSTOMER]
auth: required
flowRefs:
  - ../../flows/pro-membership-request.flow.md
  - ../../flows/pro-access.flow.md
apiRefs:
  - memberships#POST-/memberships/requests
abstractions:
  components:
    - "@platform/core/components/form-field"
    - "@platform/core/components/select"
    - "@platform/core/components/button"
    - "@platform/core/components/banner"
  patterns:
    - "auth/request-access"
---

# Demande d'acces pro

## Intent

Permettre a un utilisateur authentifie sans rattachement tenant compatible de demander un acces pro a un venue donne, avec un role cible (`HOST`, `ADMIN`, `BAR_MANAGER`) et un message libre.

## Route et accès

- Route : `/pro/request-access?tenant=<slug>&suggestedRole=<role>`
- Layout : public-shell
- Auth : required
- Rôles autorisés : utilisateur authentifie quel que soit son role courant
- Tenant requis : non strictement, mais `tenant` est fortement recommande

## Données nécessaires

| Donnée | Source | Quand chargée | Mise en cache |
|---|---|---|---|
| Identité courante | `:platform:core:identity` | onInit | mémoire |
| Tenant cible (slug) | querystring | onInit | n/a |
| Rôle suggéré | querystring | onInit | n/a |

## Mock API consommée

- `POST /api/v1/memberships/requests`

## États

### loading
- Skeleton formulaire court.

### empty
- N/A.

### error
- 404 `tenant_not_found` : "Ce venue est introuvable".
- 409 `request_already_pending` : banniere info + CTA retour `/pro/no-access`.
- 409 `membership_exists` : banniere succes douce + CTA `Aller au back-office`.
- 422 : erreurs inline par champ.

### success
- Message : "Votre demande d'acces a bien ete envoyee".
- Resume : tenant cible, role demande, date/heure.
- CTA primaire : `Retour a l'accueil`.
- CTA secondaire : `Revenir au back-office` (retourne vers `/pro/no-access` tant que la demande n'est pas approuvee).

## Actions utilisateur

| Action | Déclencheur | Résultat |
|---|---|---|
| Envoyer la demande | submit formulaire | `POST /memberships/requests` |
| Changer le role demande | select | met a jour le form state |
| Revenir | bouton secondaire | retour `/pro/no-access?tenant=<slug>&reason=no_tenant_membership` |

## Composants utilisés

| Composant | Source | Rôle dans l'écran |
|---|---|---|
| form-field | `@platform/core/components/form-field` | tenant, téléphone, message |
| select | `@platform/core/components/select` | choix du role |
| button | `@platform/core/components/button` | CTA |
| banner | `@platform/core/components/banner` | duplication/existence |

## Composants internes (non réutilisables)

- `<RequestedRoleHelp>` : explique ce que chaque role permet.
- `<PendingRequestHint>` : resume l'etat si une demande similaire existe deja.

## Validations et règles métier

- `tenantSlug` obligatoire.
- `requestedRole` limite a `HOST`, `ADMIN`, `BAR_MANAGER`.
- Telephone optionnel mais si saisi, format E.164.
- Message max 500 caracteres.
- Si l'utilisateur possede deja un `tenantId` compatible + le role demande, ne pas permettre le submit ; proposer directement le back-office.

## i18n

- `layali.pro.request-access.title`
- `layali.pro.request-access.fields.tenant`
- `layali.pro.request-access.fields.role`
- `layali.pro.request-access.fields.phone`
- `layali.pro.request-access.fields.message`
- `layali.pro.request-access.cta.submit`
- `layali.pro.request-access.success`
- `layali.pro.request-access.errors.pending`

## Critères d'acceptation

- [ ] Les 4 états sont rendus.
- [ ] Le tenant passe automatiquement depuis `?tenant=` quand disponible.
- [ ] Un 409 `request_already_pending` n'efface pas le formulaire.
- [ ] Un 409 `membership_exists` propose un lien direct vers la bonne surface pro.
- [ ] Aucun appel hors `apiRefs`.

## Open questions

- Faut-il permettre une demande `OWNER` depuis cette UI ou la reserver au back-office Nafura ? Décision provisoire : non, `OWNER` hors scope V1.
