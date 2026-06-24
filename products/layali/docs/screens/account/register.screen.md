---
specVersion: 1
kind: screen
appId: layali
screenId: register
name: Inscription
status: stable
route: /register
layout: public-shell
zone: account
roles: [PUBLIC]
auth: public
flowRefs:
  - ../../flows/pro-access.flow.md
  - ../../flows/pro-membership-request.flow.md
apiRefs:
  - auth#POST-/auth/register
  - auth#POST-/auth/otp/request
  - auth#POST-/auth/otp/verify
abstractions:
  components:
    - "@platform/core/components/form-field"
    - "@platform/core/components/checkbox"
  patterns:
    - "auth/register"
---

# Inscription

## Intent

Permettre la création d'un compte client. Demande nom, prénom, email, téléphone, mot de passe, et consentement 18+/CGV. Étape OTP téléphone optionnelle mais recommandée. Cet écran n'est pas le point d'entrée principal du profil manager.

## Route et accès

- Route : `/register?audience=customer&returnTo=<encoded>`
- Layout : public-shell
- Auth : public
- Rôles autorisés : public
- Tenant requis : non

## Données nécessaires

Aucune avant submit.

## Mock API consommée

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/otp/request` (post-register optionnel)
- `POST /api/v1/auth/otp/verify`

## États

### loading
- Spinner sur le bouton.

### empty
- N/A.

### error
- 409 `email_taken` ou `phone_taken` : message inline sur le champ.
- 422 : erreurs par champ.

### success
- Compte créé, token retourné automatiquement, redirect `returnTo` ou `/`.
- Si OTP demandé : étape supplémentaire avec saisie code (UI dérivée de `login`).
- Si `returnTo` cible `/pro` et que le compte créé n'a aucun `tenantId`, le guard pro redirige vers `pro-no-access` puis permet une demande d'acces.
- Si l'utilisateur venait d'un choix `Manager`, la UI rappelle que l'inscription seule n'ouvre pas automatiquement un back-office sans validation du lieu.

## Actions utilisateur

| Action | Déclencheur | Résultat |
|---|---|---|
| S'inscrire | submit | `POST /auth/register` |
| Vérifier téléphone | bouton | `POST /auth/otp/request` puis saisie |
| Vers login | lien | `/login?audience=customer&returnTo=` |

## Composants utilisés

| Composant | Source | Rôle dans l'écran |
|---|---|---|
| form-field | `@platform/core/components/form-field` | inputs |
| checkbox | `@platform/core/components/checkbox` | CGV, 18+ |

## Composants internes (non réutilisables)

- `<PasswordStrength>` : barre de qualité du mot de passe.

## Validations et règles métier

- Mot de passe ≥ 8 caractères, ≥ 1 chiffre + 1 lettre.
- Téléphone E.164 (+212).
- Email format valide, unique.
- Cases CGV et 18+ obligatoires (sinon submit désactivé).
- Langue par défaut = locale du navigateur (`fr`, `ar`, `en` supportées).
- L'inscription reste un parcours `customer-first` ; aucun CTA principal manager ne doit pousser vers `/register`.

## Topics realtime

Aucun.

## i18n

- `layali.account.register.title`
- `layali.account.register.fields.<field>`
- `layali.account.register.consent.cgv`
- `layali.account.register.consent.adult`
- `layali.account.register.cta.submit`
- `layali.account.register.errors.email-taken`

## Critères d'acceptation

- [ ] Les 4 états sont rendus.
- [ ] Auth public.
- [ ] Aucun appel hors `apiRefs`.
- [ ] Les cases CGV et 18+ doivent être cochées avant que le bouton submit soit cliquable.
- [ ] Une 409 `email_taken` ou `phone_taken` mappe l'erreur sur le champ correspondant sans réinitialiser le formulaire.
- [ ] Le mot de passe ne quitte jamais le composant via console.log ou state non sécurisé.
- [ ] Une inscription initiée depuis un contexte pro ne laisse pas l'utilisateur sur une route `/pro` inaccessible sans fallback lisible.
- [ ] Le lien vers cet écran n'est pas affiché comme CTA principal quand l'utilisateur a choisi `Manager` sur `login`.

## Open questions

- Vérification téléphone obligatoire dès l'inscription ou différée (à la première action critique) ? Décision provisoire : différée.
