---
specVersion: 1
kind: screen
appId: beauty
screenId: login
name: Connexion
status: stable
route: /login
layout: public-layout
zone: account
roles: []
auth: public
flowRefs:
  - ../../flows/customer-onboarding.flow.md
apiRefs:
  - ../../api/auth.api.md
abstractions:
  components:
    - "@platform/core/components/phone-otp-form"
    - "@platform/core/i18n"
---

# Connexion

## Intent

Authentifier un client (et accessoirement un pro) sur Beauty. Deux modes : OTP téléphone (par défaut, optimisé mobile) et email+password (fallback / pro).

## Route et accès

- Route : `/login`
- Layout : `public-layout`
- Auth : public
- Rôles : tous (CUSTOMER, OWNER, ADMIN, STAFF, PLATFORM_ADMIN)
- Tenant requis : non
- Query : `redirect`, `reason` (`expired`, `forbidden`), `role` (`pro`)

## Données nécessaires

| Donnée | Source | Quand chargée | Mise en cache |
|---|---|---|---|
| Aucun load initial | — | — | — |

## Mock API consommée

- `POST /api/v1/auth/otp/request`
- `POST /api/v1/auth/otp/verify`
- `POST /api/v1/auth/login` (email/password)
- `POST /api/v1/auth/password/reset/request`

## États

### loading
- Bouton submit en spinner pendant l'appel.

### empty
- N/A.

### error
- 401 `invalid_credentials` → message inline sous le formulaire.
- 410 `otp_expired` → message + bouton "Renvoyer le code".
- 429 `rate_limited` → message "Trop d'essais, réessayez dans X minutes".
- 423 `account_locked` → message + lien "Mot de passe oublié".

### success
- Tab "Téléphone" (défaut) :
  - Champ téléphone E.164 (prefix +212 par défaut).
  - CTA "Envoyer le code" → step "Saisir le code" (6 chiffres + cooldown).
  - Lien "Connexion email" pour bascule.
- Tab "Email" :
  - Email + password.
  - CTA "Se connecter".
  - Lien "Mot de passe oublié" → email reset.
- Liens : "Pas de compte ? S'inscrire" → `/register?redirect=...`.
- Si `reason=expired` : bandeau "Votre session a expiré, reconnectez-vous".
- Si `role=pro` : message "Connexion espace pro" et CTA prioritaire email.

## Actions utilisateur

| Action | Déclencheur | Résultat |
|---|---|---|
| Soumettre téléphone | bouton step 1 | `POST /auth/otp/request` → step 2 |
| Soumettre OTP | bouton step 2 | `POST /auth/otp/verify` → stockage JWT + redirection `redirect` ou `/me/bookings` |
| Renvoyer OTP | bouton après cooldown | `POST /auth/otp/request` à nouveau |
| Soumettre email/pwd | bouton | `POST /auth/login` → stockage JWT + redirection |
| Mot de passe oublié | lien | dialog email → `POST /auth/password/reset/request` |
| Bascule tab | clic tab | reset formulaire |
| S'inscrire | lien | nav `/register?redirect=...` |

## Composants utilisés

| Composant | Source | Rôle |
|---|---|---|
| phone-otp-form | `@platform/core/components/phone-otp-form` | formulaire téléphone + OTP |

## Composants internes (non réutilisables)

- `<EmailPasswordForm>` : form classique.
- `<AuthTabs>` : tabs Téléphone / Email.
- `<ResetPasswordDialog>` : dialog reset.

## Validations et règles métier

- Téléphone E.164 valide, préfixe MA par défaut.
- Email format RFC 5322 light.
- Cooldown OTP : 60s entre 2 demandes.
- Stockage JWT en mémoire (et refreshToken en `httpOnly` cookie si possible, sinon `localStorage`).
- Redirection : `redirect` query param doit être un chemin interne ; ignoré sinon (anti-open-redirect).

## i18n

- Clés : `beauty.login.title`, `beauty.login.tab.phone`, `beauty.login.tab.email`, `beauty.login.phone.cta`, `beauty.login.otp.cta`, `beauty.login.otp.resend`, `beauty.login.email.cta`, `beauty.login.forgot`, `beauty.login.register.link`, `beauty.login.error.invalid`, `beauty.login.error.locked`, `beauty.login.session.expired`, `beauty.login.pro.banner`.

## Critères d'acceptation

- [ ] L'écran rend correctement les 4 états.
- [ ] L'OTP fonctionne avec cooldown visible (timer).
- [ ] Le rate-limit 429 affiche un message clair sans bloquer le bouton autre tab.
- [ ] La redirection post-login respecte `redirect` (chemin interne) ou retombe sur `/me/bookings` par défaut.
- [ ] Aucun appel direct à un endpoint hors `apiRefs`.
- [ ] La saisie du téléphone respecte le clavier numérique mobile (`inputmode=tel`).

## Open questions

- Auto-fill OTP via WebOTP API (Android) : V2.
- Social login (Google/Apple) : V2.
- 2FA pour les rôles pro : V2.
