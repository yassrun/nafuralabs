---
specVersion: 1
kind: screen
appId: beauty
screenId: register
name: Inscription
status: stable
route: /register
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

# Inscription

## Intent

Créer un compte client Beauty rapidement, OTP téléphone par défaut. Formulaire court : téléphone, prénom, locale.

## Route et accès

- Route : `/register`
- Layout : `public-layout`
- Auth : public
- Rôles : aucun (l'inscription crée un CUSTOMER)
- Tenant requis : non
- Query : `redirect`

## Données nécessaires

| Donnée | Source | Quand chargée | Mise en cache |
|---|---|---|---|
| Aucun load initial | — | — | — |

## Mock API consommée

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/otp/request`
- `POST /api/v1/auth/otp/verify`

## États

### loading
- Spinner sur bouton submit.

### empty
- N/A.

### error
- 409 `phone_exists` → message + lien "Se connecter".
- 422 (validation) → erreurs inline par champ.
- 429 rate-limit OTP.

### success
- Step 1 (compte) : téléphone (+212), prénom, locale, checkbox CGU obligatoire.
- Step 2 (OTP) : saisie 6 chiffres + cooldown 60s.
- Step 3 (succès) : confettis + bouton "Continuer" → redirection `redirect` ou `/`.

## Actions utilisateur

| Action | Déclencheur | Résultat |
|---|---|---|
| Soumettre step 1 | bouton | `POST /auth/register` puis `POST /auth/otp/request` automatique → step 2 |
| Soumettre OTP | bouton | `POST /auth/otp/verify` → step 3 |
| Renvoyer OTP | bouton (après 60s) | `POST /auth/otp/request` |
| Aller à login | lien | nav `/login?redirect=...` |
| Changer locale | dropdown | mise à jour i18n |

## Composants utilisés

| Composant | Source | Rôle |
|---|---|---|
| phone-otp-form | `@platform/core/components/phone-otp-form` | OTP step |

## Composants internes (non réutilisables)

- `<RegisterStepForm>` : formulaire step 1.
- `<RegisterStepper>` : stepper 1-2-3.

## Validations et règles métier

- Téléphone E.164 valide. Vérification d'unicité côté backend (409).
- Prénom 2-40 chars, lettres + espaces + tirets.
- Locale ∈ {fr, ar, en}.
- CGU obligatoire à cocher pour activer le submit.
- Le compte est créé en step 1 (statut `INACTIVE`), activé après OTP step 2.

## i18n

- Clés : `beauty.register.title`, `beauty.register.field.phone`, `beauty.register.field.firstName`, `beauty.register.field.locale`, `beauty.register.cgu`, `beauty.register.cta`, `beauty.register.error.phoneExists`, `beauty.register.otp.title`, `beauty.register.success.title`, `beauty.register.login.link`.

## Critères d'acceptation

- [ ] L'écran rend les 4 états sur les 3 steps.
- [ ] Le bouton submit step 1 est désactivé si CGU non cochée.
- [ ] Un téléphone déjà existant (409) renvoie vers login avec message explicite.
- [ ] L'OTP cooldown 60s est visible et bloque le renvoi.
- [ ] La redirection finale respecte `redirect` ou tombe sur `/`.
- [ ] Aucun appel direct à un endpoint hors `apiRefs`.

## Open questions

- Email facultatif dès l'inscription : V1 = optionnel ajouté ensuite dans le profil, V2 = champ.
- Recommandation marketing (consentement opt-in) : V2.
- Parrainage code à la création : V2.
