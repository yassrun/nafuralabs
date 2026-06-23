# Login / 2FA — démo vs production (tâche 8.7)

## Production (`environment.prod.ts`)

- **IAM** : Keycloak (flux OAuth2 + PKCE) via `AuthApiService.login()` — redirection vers la page de login hébergée par le realm.
- **MFA / 2FA** : configuré dans Keycloak (OTP TOTP, WebAuthn, e-mail, etc.). L’application Angular ne contient pas d’écran OTP métier : l’utilisateur s’authentifie entièrement sur l’IdP.
- **Page `/login`** : bouton « Continuer vers la connexion sécurisée (SSO) » ; pas de redirection automatique au chargement (évite les boucles et laisse le choix explicite).

## Développement (`environment.ts`, `devAuthBypass: true`)

### Mode historique — `devAuthEagerBootstrap: true` (défaut actuel)

- Au **premier chargement**, `AuthFacade.initialize()` appelle `bypassLoginForDev()` : session fictive super-admin sans interaction.
- Si l’utilisateur arrive sur `/login` non authentifié, la page relance aussi `login()` → même bypass + navigation vers l’app.
- **Pas de vrai 2FA** : uniquement des jetons mock (`TokenService`).

### Mode parcours in-app — `devAuthEagerBootstrap: false`

- `initialize()` tente de **restaurer** une session dev persistée (`sessionStorage`) ; sinon statut **non authentifié**.
- La page `/login` affiche un **assistant en deux étapes** : mot de passe + code OTP mock.
- Identifiants attendus : `environment.devInAppAuth` (`password` / `totp`, défaut `demo` / `123456`).
- Après validation, `AuthFacade.completeDevInAppAuth()` émet la même session que le bypass.
- **Déconnexion** : `logout()` efface la session et renvoie vers `/login` (plus de ré-injection automatique de session).

## Limites démo

- Aucun secret réel, aucun chiffrement métier : ne pas réutiliser ces mots de passe hors environnement local.
- Pas d’intégration Keycloak dans l’iframe : le parcours in-app est **uniquement** pour démo / tests UX lorsque le bypass est actif.
- La conformité PCI / audit IAM reste celle du **realm Keycloak** en production.
