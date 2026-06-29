---
specVersion: 1
kind: flow
appId: beauty
flowId: customer-onboarding
name: Inscription et première connexion (client)
status: stable
actor: CUSTOMER
trigger: clic "S'inscrire" depuis home, login, ou au moment forcé du booking
screensRefs:
  - ../screens/account/login.screen.md
  - ../screens/account/register.screen.md
  - ../screens/account/customer-profile.screen.md
apiRefs:
  - ../api/auth.api.md
  - ../api/customers.api.md
---

# Inscription et première connexion (client)

> **P1 walkthrough :** OTP mock `123456` ; pas de `POST /auth/*` réel — voir [fixtures.md](../fixtures.md).

## Objectif

Permettre à un nouveau client de créer un compte rapidement (OTP téléphone par défaut) et d'arriver sur son écran cible (booking ou home) avec un profil minimal créé.

## Acteur déclencheur

- Persona : CUSTOMER (anonyme).
- Contexte : mobile, souvent au moment du premier booking (auth forcée au submit).

## Préconditions

- Le téléphone fourni n'est pas déjà associé à un compte (sinon login).

## Étapes

| # | Écran ou état | Action utilisateur | Mock API | Branche / état suivant |
|---|---|---|---|---|
| 1 | [login](../screens/account/login.screen.md) ou bouton "S'inscrire" | clic "Pas de compte ? S'inscrire" | — | → 2 |
| 2 | [register](../screens/account/register.screen.md) — step 1 | saisit téléphone, prénom, locale, accepte CGU | `POST /auth/register` | 409 phone_exists → bascule sur login avec phone pré-rempli ; 201 → 3 |
| 3 | OTP request automatique | — | `POST /auth/otp/request` (purpose=VERIFY_PHONE) | 202 → 4 ; 429 → message rate-limit |
| 4 | [register](../screens/account/register.screen.md) — step 2 | saisit code 6 chiffres | `POST /auth/otp/verify` | 200 (token JWT + phoneVerified=true) → 5 ; 401 → retry (max 3) ; 410 → renvoyer |
| 5 | [register](../screens/account/register.screen.md) — step 3 | confirmation succès | — | → 6 |
| 6 | redirection cible | si `redirect` query param interne → s'y rendre ; sinon `/me/bookings` ou `/` | — | fin |
| 7 | (optionnel) compléter profil | edit profil avec email, ville, nom famille | `PATCH /customers/me` | optionnel, peut être différé |

## États globaux du flow

- En cours : compte créé en step 2 (`status=INACTIVE`), activé après OTP.
- Sauvegardé : compte `ACTIVE`, JWT stocké.
- Abandonné : compte `INACTIVE` au step 2, purge après 24h.

## Erreurs et reprises

- 409 `phone_exists` au register : redirige vers login avec phone pré-rempli, message "Un compte existe déjà".
- OTP expiré (410) : permet de redemander (cooldown 60s).
- 429 rate-limit : affiche durée d'attente, propose login par email à la place (V2).
- Réseau perdu après OTP request : `challengeId` conservé en sessionStorage, reprise possible.
- Refus CGU : bouton submit désactivé, message inline.

## Critères d'acceptation

- [ ] Tous les écrans référencés sont implémentés.
- [ ] Un téléphone déjà existant redirige proprement vers login (pas d'erreur cryptique).
- [ ] L'OTP fonctionne avec cooldown visible.
- [ ] La redirection finale respecte `redirect` (chemin interne).
- [ ] Les CGU sont obligatoires (case à cocher pour activer le submit).
- [ ] Le compte créé est immédiatement utilisable après step 2.
- [ ] Si le compte est créé sans email (V1 = email optionnel), la page "Mot de passe oublié" propose explicitement la réinitialisation via OTP téléphone (et non par email).

## Open questions

- Email obligatoire à l'inscription : V1 = optionnel (à ajouter dans profile ensuite), V2 = obligatoire.
- Login social Google / Apple : V2.
- Parrainage code à l'inscription : V2.
- Vérification email post-inscription : V1 = pas obligatoire (téléphone est canonique), V2 = double opt-in.
