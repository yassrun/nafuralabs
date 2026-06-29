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
route: /login?audience=customer|manager&returnTo=<encoded>
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

Permettre à un utilisateur de choisir son profil d'entrée (`Client` ou `Manager`) puis de se connecter par email/mot de passe ou par OTP téléphone. Reprendre une navigation interrompue (`returnTo`).

Si `returnTo` pointe vers une route `/pro`, la redirection post-login doit aussi tenir compte du tenant courant et du rôle métier retourné par la session (`OWNER`, `ADMIN`, `HOST`, `BAR_MANAGER`). Si `audience=manager`, le formulaire adapte sa copy back-office et préremplit le contexte pro.

## Route et accès

- Route : `/login?audience=customer|manager&returnTo=<encoded>`
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
- Si `audience` absent : écran de choix initial avec deux gros boutons `Je suis client` et `Je suis manager`.
- Si `audience=customer` ou `audience=manager` : formulaire du profil choisi prêt à être rempli.

### error
- 401 : message "Email ou mot de passe invalide".
- 423 (locked) : "Trop de tentatives, réessayer dans X min".
- OTP expiré / faux : message + bouton renvoyer code.

### success
- Token stocké via `@platform/core/identity`.
- Redirection `returnTo` si présent, sinon `/` pour `customer` et `/pro` pour `manager`.
- Si `returnTo=/pro` et que le rôle principal est `HOST`, redirection finale recommandée vers `/pro/door`.
- Si `returnTo=/pro` et que le rôle principal est `BAR_MANAGER`, redirection finale recommandée vers `/pro/bookings`.
- Si `returnTo=/pro` et qu'aucun `tenantId` compatible n'est retourne, le guard pro doit afficher `/pro/no-access?reason=no_tenant_membership` sans boucle.

## Actions utilisateur

| Action | Déclencheur | Résultat |
|---|---|---|
| Choisir profil client | clic bouton | navigation `/login?audience=customer` |
| Choisir profil manager | clic bouton | navigation `/login?audience=manager&returnTo=/pro` |
| Se connecter (email) | submit form | `POST /auth/login` |
| Demander OTP | bouton | `POST /auth/otp/request` puis input code |
| Vérifier OTP | submit code | `POST /auth/otp/verify` |
| Vers inscription | lien (mode client uniquement) | `/register?audience=customer&returnTo=` |
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
- `audience=manager` préremplit `returnTo=/pro` si absent.
- Si `audience` absent, aucun appel API ne part avant le choix explicite `Client` ou `Manager`.

## Topics realtime

Aucun.

## i18n

- `layali.account.login.title`
- `layali.account.login.audience.title`
- `layali.account.login.audience.customer`
- `layali.account.login.audience.manager`
- `layali.account.login.tab.email`
- `layali.account.login.tab.otp`
- `layali.account.login.errors.invalid`
- `layali.account.login.errors.locked`
- `layali.account.login.cta.submit`
- `layali.account.login.cta.register`

## Critères d'acceptation

- [ ] Les 4 états sont rendus.
- [ ] Auth public, mais si l'utilisateur est déjà authentifié, redirection immédiate vers `returnTo` ou `/`.
- [ ] Si `audience` n'est pas fourni, l'écran affiche d'abord deux boutons `Client` / `Manager` avant le formulaire.
- [ ] Si l'utilisateur arrive depuis une route pro, `audience=manager` est prérempli et le lien d'inscription client n'est pas le CTA secondaire principal.
- [ ] Aucun appel hors `apiRefs`.
- [ ] Une erreur 423 (locked) désactive le bouton submit et affiche un compte à rebours basé sur header `Retry-After`.
- [ ] L'OTP expiré (`code: otp_expired`) propose immédiatement "Renvoyer le code".
- [ ] Aucune fuite d'information : un email inconnu retourne la même 401 générique qu'un mot de passe faux.
- [ ] Un login pro réussi mais sans membership compatible aboutit à `pro-no-access`, pas à une 403 brute.

## Open questions

- Login social (Google) en V1 ou V2 ? Décision provisoire : V2.
