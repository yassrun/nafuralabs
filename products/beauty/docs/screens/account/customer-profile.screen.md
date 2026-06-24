---
specVersion: 1
kind: screen
appId: beauty
screenId: customer-profile
name: Mon profil
status: stable
route: /me
layout: account-layout
zone: account
roles: [CUSTOMER]
auth: required
flowRefs: []
apiRefs:
  - ../../api/customers.api.md
  - ../../api/auth.api.md
abstractions:
  components:
    - "@platform/core/components/phone-otp-form"
    - "@platform/core/i18n"
---

# Mon profil

## Intent

Permettre au client de consulter et modifier ses informations personnelles, préférences (locale), avatar, consentements RGPD, et de supprimer son compte.

## Route et accès

- Route : `/me`
- Layout : `account-layout`
- Auth : required
- Rôles : CUSTOMER
- Tenant requis : non

## Données nécessaires

| Donnée | Source | Quand chargée | Mise en cache |
|---|---|---|---|
| Profil customer | [GET /api/v1/customers/me](../../api/customers.api.md#GET-/api/v1/customers/me) | onInit | session 1 min |
| Stats agrégées | inclus dans réponse `me` | onInit | session |

## Mock API consommée

- `GET /api/v1/customers/me`
- `PATCH /api/v1/customers/me`
- `POST /api/v1/customers/me/avatar`
- `POST /api/v1/customers/me/phone/change/request`
- `POST /api/v1/customers/me/phone/change/confirm`
- `DELETE /api/v1/customers/me`
- `POST /api/v1/auth/logout`

## États

### loading
- Skeleton header + cards.

### empty
- N/A.

### error
- 401 → redirection login. 503 → bouton "Réessayer".

### success
- Header : avatar (upload), displayName, badge "Membre depuis ...".
- Stats : nombre de RDV, points fidélité, salons favoris (V2).
- Section "Informations" : displayName, firstName, lastName, email, téléphone (badge vérifié), birthDate, ville, locale.
- Section "Préférences" : langue, format date, consentements marketing.
- Section "Sécurité" : changer téléphone (OTP), changer email (lien email), changer mot de passe (lien email).
- Section "Compte" : bouton "Déconnexion", lien "Supprimer mon compte" (dangereux, dialog double confirmation).

## Actions utilisateur

| Action | Déclencheur | Résultat |
|---|---|---|
| Modifier un champ | inline edit | `PATCH /customers/me` |
| Upload avatar | bouton + file picker | `POST /customers/me/avatar` → nouveau avatarUrl |
| Changer téléphone | bouton | dialog phone-otp → `POST /phone/change/*` |
| Déconnexion | bouton | `POST /auth/logout` + clear token + redirection `/` |
| Supprimer compte | lien | dialog double confirm (saisir "SUPPRIMER") → `DELETE /customers/me` |
| Changer locale | dropdown | `PATCH /customers/me` + reload i18n |

## Composants utilisés

| Composant | Source | Rôle |
|---|---|---|
| phone-otp-form | `@platform/core/components/phone-otp-form` | changement téléphone |

## Composants internes (non réutilisables)

- `<ProfileSection>` : section pliable avec titre + body.
- `<InlineEditableField>` : champ avec mode lecture / édition.
- `<DeleteAccountDialog>` : double confirm.

## Validations et règles métier

- Email modifiable uniquement via lien confirmé (pas inline).
- displayName 2-50 chars, prénom/nom 2-40.
- birthDate : utilisateur > 16 ans (sinon 422).
- Suppression compte : nécessite saisie exacte "SUPPRIMER" + clic confirm.
- Avatar : 2 Mo max, jpeg/webp.

## i18n

- Clés : `beauty.profile.title`, `beauty.profile.section.info`, `beauty.profile.section.prefs`, `beauty.profile.section.security`, `beauty.profile.section.account`, `beauty.profile.field.*`, `beauty.profile.cta.logout`, `beauty.profile.cta.delete`, `beauty.profile.delete.dialog.confirm`, `beauty.profile.delete.dialog.warning`.

## Critères d'acceptation

- [ ] L'écran rend les 4 états.
- [ ] L'édition inline persiste après refresh (vraiment patché côté backend).
- [ ] La déconnexion révoque le refresh token.
- [ ] La suppression du compte exige la saisie exacte "SUPPRIMER" et redirige vers `/` avec message.
- [ ] Le changement de téléphone passe par OTP et met à jour `phoneVerified`.
- [ ] Aucun appel direct à un endpoint hors `apiRefs`.

## Open questions

- Multi-comptes (basculer rapidement entre profils) : V3.
- Export données personnelles (RGPD) : V2.
- Préférences notifications (SMS rappel J-1, email confirmation) toggles individuels : V2.
