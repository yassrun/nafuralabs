---

id: PLT-36
status: done-me
context: nafura
type: tech
priority: P2
assignee: agent
gate: none
sprint: 2026-W33
blocked_by: [SEKTOR-82]
---

# Supprimer le mock JWT project-fountain

> Plus d'émission de JWT dans le navigateur. `iss` / `aud` scaffold hors du front.

## Étapes

- [x] `TokenService` : plus de `generateTokenPair` / `encodeToken` ; decode + `isMockToken` seulement
- [x] `token.models.ts` : drop `TokenConfig` / `issuer: project-fountain` / `pf-frontend`
- [x] `AuthFacade` : plus de mint mock (`bypassLoginForDev`, onboarding, attachTenant)
- [x] Inbox JWT SEKTOR-82 : retirer la ligne

## Preuve de fin

Aucun `project-fountain` ni `pf-frontend` dans `nafura-platform/web`. Cursor QA / Keycloak inchangés (`nafura-onboarding-dev` + iss URL).

## Journal

```
14/08 00:50  tsk1  TokenService decode-only. isMockToken = pas onboarding-dev et iss pas URL.
14/08 00:50  tsk2  Drop TokenConfig / issuer / audience. AuthFacade : plus de generateTokenPair. bypassLoginForDev throw. establishOnboardingDevSession mort supprimé.
14/08 00:50  tsk3  Inbox SEKTOR-82 JWT retirée. Flag devAuthBypass (false partout) → inbox.

Livré : plus de JWT mock project-fountain
```
