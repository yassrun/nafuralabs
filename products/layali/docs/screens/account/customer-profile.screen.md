---
specVersion: 1
kind: screen
appId: layali
screenId: customer-profile
name: Mon profil
status: stable
phase: P1
p1MobileId: customer-profile
p1Impl: mock
route: /me/profile
layout: account-shell
zone: account
roles: [CUSTOMER]
auth: required
flowRefs: []
apiRefs:
  - customers#GET-/customers/me
  - customers#PATCH-/customers/me
  - auth#POST-/auth/logout
abstractions:
  components:
    - "@platform/core/components/form-field"
    - "@platform/core/components/avatar-upload"
    - "@platform/core/components/toast"
  patterns:
    - "account/profile-form"
---

# Mon profil

## P1 - Client Walkthrough

| Champ | Valeur |
|-------|--------|
| Mobile `Screen` | `customer-profile` |
| Impl | mock |
| Fixtures | [fixtures.md](../../fixtures.md) |
| Cartographie | [mobile-map.md](../../mobile-map.md) |

> En P1 : **ne pas** utiliser `apiRefs` / composants `@platform/` comme brief agent - mock local uniquement.


## Intent

Voir et éditer ses informations personnelles, gérer les préférences (langue, ville préférée, notifications), se déconnecter, supprimer son compte (RGPD).

## Route et accès

- Route : `/me/profile`
- Layout : account-shell
- Auth : required
- Rôles autorisés : CUSTOMER
- Tenant requis : non

## Données nécessaires

| Donnée | Source | Quand chargée | Mise en cache |
|---|---|---|---|
| Profil utilisateur | [customers API](../../api/customers.api.md) `GET /customers/me` | onInit | session 5 min |

## Mock API consommée

- `GET /api/v1/customers/me`
- `PATCH /api/v1/customers/me`
- `POST /api/v1/auth/logout`
- `POST /api/v1/customers/me/delete-request` (RGPD)

## États

### loading
- Form skeleton.

### empty
- N/A (un user authentifié a toujours un profil ; sinon erreur).

### error
- 401 : redirect login.
- 422 : erreurs inline sur les champs.

### success
- Form édition : prénom, nom, email (lecture seule + lien changement), téléphone, ville préférée, langue, opt-in marketing.
- Boutons "Enregistrer", "Se déconnecter", "Supprimer mon compte" (avec confirmation forte).

## Actions utilisateur

| Action | Déclencheur | Résultat |
|---|---|---|
| Enregistrer | submit | `PATCH /customers/me` puis toast succès |
| Déconnecter | bouton | `POST /auth/logout` + redirect `/` |
| Supprimer | bouton + dialog | `POST /customers/me/delete-request` (process asynchrone) |
| Changer photo | upload | upload via `:platform:integrations:storage`, update profil |

## Composants utilisés

| Composant | Source | Rôle dans l'écran |
|---|---|---|
| form-field | `@platform/core/components/form-field` | inputs |
| avatar-upload | `@platform/core/components/avatar-upload` | upload photo |
| toast | `@platform/core/components/toast` | confirmations |

## Composants internes (non réutilisables)

- `<DangerZone>` : section grise pour suppression de compte.

## Validations et règles métier

- Email non modifiable directement (lien dédié pour validation par OTP).
- Téléphone E.164 (+212...).
- Préférences langue parmi `fr | ar | en`.
- Suppression de compte = process asynchrone (anonymisation 30j, données financières conservées).

## Topics realtime

Aucun.

## i18n

- `layali.account.profile.title`
- `layali.account.profile.fields.<field>`
- `layali.account.profile.cta.save`
- `layali.account.profile.cta.logout`
- `layali.account.profile.danger.delete`
- `layali.account.profile.toast.saved`
- `layali.account.profile.confirm.delete`

## Critères d'acceptation

- [ ] Les 4 états sont rendus.
- [ ] Auth requise.
- [ ] Aucun appel hors `apiRefs`.
- [ ] La suppression de compte exige une confirmation forte (re-saisie du mot "supprimer") avant d'appeler `POST /customers/me/delete-request`.
- [ ] Une 422 sur `PATCH /customers/me` mappe les erreurs au champ concerné (`details[].field`).
- [ ] L'utilisateur ne peut pas modifier `email` directement depuis ce formulaire.

## Open questions

- Suppression immédiate ou différée 30j ? Décision provisoire : différée 30j (réversible).
