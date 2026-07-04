---
specVersion: 1
kind: screen
appId: layali
screenId: login
name: Connexion
status: stable
phase: P1
p1MobileId: login
p1Impl: mock
route: /login?returnTo=<encoded>
layout: public-shell
zone: account
roles: [PUBLIC]
auth: public
flowRefs:
  - ../../flows/pro-access.flow.md
apiRefs:
  - auth#POST-/auth/login
  - auth#POST-/auth/otp/request
  - auth#POST-/auth/otp/verify
abstractions:
  components:
    - "@platform/core/components/form-field"
    - "@platform/core/components/tabs"
  patterns:
    - "auth/login"
---

# Connexion

## P1 - Client Walkthrough

| Champ | Valeur |
|-------|--------|
| Mobile `Screen` | `login` |
| Impl | mock |
| Fixtures | [fixtures.md](../../fixtures.md) |
| Cartographie | [mobile-map.md](../../mobile-map.md) |

> En P1 : **ne pas** utiliser `apiRefs` / composants `@platform/` comme brief agent - mock local uniquement. *(#/login)*


## Intent

Authentifier un **client** (CUSTOMER) par email/mot de passe ou OTP téléphone. Reprendre une navigation interrompue (`returnTo`). Surface **client uniquement** — le login pro est sur [pro-login.screen.md](../pro/pro-login.screen.md) (`/pro/login`).

## Route et accès

- Route : `/login?returnTo=<encoded>`
- Layout : public-shell (variante minimaliste)
- Auth : public (redirige si déjà connecté)
- Rôles autorisés : public
- Tenant requis : non

## Données nécessaires

Aucune. L'écran est statique avant submit.

## Mock API consommée

- `POST /api/v1/auth/login` (body : `{ email, password }`)
- `POST /api/v1/auth/otp/request` (body : `{ phone }`)
- `POST /api/v1/auth/otp/verify` (body : `{ phone, code }`)

## États

### loading
- Bouton submit en spinner pendant la requête.

### empty
- Formulaire client prêt (email ou OTP).

### error
- 401 : message "Email ou mot de passe invalide".
- 423 (locked) : "Trop de tentatives, réessayer dans X min".
- OTP expiré / faux : message + bouton renvoyer code.

### success
- Token stocké via `@platform/core/identity`.
- Redirection `returnTo` si présent, sinon `/`.

## Actions utilisateur

| Action | Déclencheur | Résultat |
|---|---|---|
| Se connecter (email) | submit form | `POST /auth/login` |
| Demander OTP | bouton | `POST /auth/otp/request` puis input code |
| Vérifier OTP | submit code | `POST /auth/otp/verify` |
| Vers inscription | lien | `/register?returnTo=` |
| Mot de passe oublié | lien | `/forgot-password` (V2) |

## Composants utilisés

| Composant | Source | Rôle dans l'écran |
|---|---|---|
| tabs | `@platform/core/components/tabs` | Email / OTP |
| form-field | `@platform/core/components/form-field` | inputs |

## Composants internes (non réutilisables)

- `<OtpInput>` : 6 cases pour saisir le code.
- `<ResendOtpTimer>` : décompte avant renvoi.

## Validations et règles métier

- Email format valide.
- Téléphone E.164 (+212...).
- Mot de passe minimum 8 caractères.
- OTP 6 chiffres, TTL 5 min.
- Rate limit : 5 tentatives login / 15 min ; renvoi OTP toutes les 60s.

## Topics realtime

Aucun.

## i18n

- `layali.account.login.title`
- `layali.account.login.tab.email`
- `layali.account.login.tab.otp`
- `layali.account.login.errors.invalid`
- `layali.account.login.errors.locked`
- `layali.account.login.cta.submit`
- `layali.account.login.cta.register`

## Critères d'acceptation

- [ ] Les 4 états sont rendus.
- [ ] Auth public, mais si l'utilisateur est déjà authentifié, redirection immédiate vers `returnTo` ou `/`.
- [ ] Pas de choix Client/Manager sur cet écran.
- [ ] Aucun appel hors `apiRefs`.
- [ ] Une erreur 423 (locked) désactive le bouton submit et affiche un compte à rebours basé sur header `Retry-After`.
- [ ] L'OTP expiré (`code: otp_expired`) propose immédiatement "Renvoyer le code".
- [ ] Aucune fuite d'information : un email inconnu retourne la même 401 générique qu'un mot de passe faux.

## Open questions

- Login social (Google) en V1 ou V2 ? Décision provisoire : V2.
