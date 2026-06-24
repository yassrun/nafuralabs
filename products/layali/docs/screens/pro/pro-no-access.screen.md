---
specVersion: 1
kind: screen
appId: layali
screenId: pro-no-access
name: Acces pro non autorise
status: review
route: /pro/no-access
layout: public-shell
zone: pro
roles: [OWNER, ADMIN, HOST, BAR_MANAGER, PUBLIC]
auth: optional
flowRefs:
  - ../../flows/pro-access.flow.md
  - ../../flows/pro-membership-request.flow.md
apiRefs: []
abstractions:
  components:
    - "@platform/core/components/empty-state"
    - "@platform/core/components/button"
  patterns:
    - "auth/forbidden"
---

# Acces pro non autorise

## Intent

Informer un utilisateur authentifie ou non qu'il n'a pas encore acces au back-office du venue courant. Couvre les cas compte client simple, compte pro sans rattachement tenant, ou role insuffisant pour le tenant resolu.

## Route et accès

- Route : `/pro/no-access?tenant=<slug>&reason=<code>`
- Layout : public-shell
- Auth : optional
- Rôles autorisés : public, CUSTOMER, OWNER, ADMIN, HOST, BAR_MANAGER
- Tenant requis : non, mais `tenant` peut etre passe en query pour contextualiser

## Données nécessaires

| Donnée | Source | Quand chargée | Mise en cache |
|---|---|---|---|
| Session user courante | `:platform:core:identity` | onInit | mémoire |
| Tenant cible (slug) | querystring | onInit | n/a |

## Mock API consommée

Aucun endpoint direct. L'ecran se base sur la session deja resolue et sur le motif de redirection.

## États

### loading
- Skeleton simple pendant la résolution d'identité.

### empty
- N/A.

### error
- N/A ; l'ecran lui-meme sert de fallback d'erreur fonctionnelle.

### success
- Titre : "Vous n'avez pas encore acces a ce back-office".
- Sous-texte contextuel selon `reason` : `not_authenticated`, `no_tenant_membership`, `role_not_allowed`, `tenant_mismatch`.
- CTA primaire : `Se connecter` si utilisateur anonyme ; `Retour a l'accueil` sinon.
- CTA secondaire : `Demander un acces` si utilisateur authentifie et `reason=no_tenant_membership` ou `reason=role_not_allowed`.
- CTA tertiaire : `Contacter le proprietaire du lieu` (mailto ou fiche support V2).
- Si `tenant` present, afficher le nom/slug du venue cible dans un encart.

## Actions utilisateur

| Action | Déclencheur | Résultat |
|---|---|---|
| Se connecter | bouton primaire si anonyme | navigation `/login?returnTo=/pro` |
| Retour accueil | bouton primaire si authentifié | navigation `/` |
| Demander un acces | bouton secondaire si authentifie | navigation `/pro/request-access?tenant=<slug>&suggestedRole=<role>` |
| Reessayer | bouton secondaire | relance la navigation vers `/pro` |

## Composants utilisés

| Composant | Source | Rôle dans l'écran |
|---|---|---|
| empty-state | `@platform/core/components/empty-state` | message central |
| button | `@platform/core/components/button` | CTA |

## Composants internes (non réutilisables)

- `<AccessReasonHint>` : texte conditionnel selon le code de raison.

## Validations et règles métier

- Si l'utilisateur est authentifie mais ne possede aucun `tenantId`, le message doit orienter vers une invitation/admin venue plutot qu'un simple login.
- Si le role est `BAR_MANAGER` et la route cible etait `/pro/door`, indiquer explicitement que l'acces door est reserve a `HOST`, `ADMIN`, `OWNER`.
- Le `suggestedRole` par defaut vaut `HOST` si la route cible etait `/pro/door`, `BAR_MANAGER` si la route cible etait `/pro/bookings`, sinon `ADMIN`.
- Aucun endpoint de mutation ne doit etre appele depuis cet ecran.

## i18n

- `layali.pro.no-access.title`
- `layali.pro.no-access.reason.not-authenticated`
- `layali.pro.no-access.reason.no-tenant-membership`
- `layali.pro.no-access.reason.role-not-allowed`
- `layali.pro.no-access.reason.tenant-mismatch`
- `layali.pro.no-access.cta.login`
- `layali.pro.no-access.cta.home`
- `layali.pro.no-access.cta.request-access`
- `layali.pro.no-access.cta.retry`

## Critères d'acceptation

- [ ] L'écran couvre les 4 raisons de redirection principales.
- [ ] Un utilisateur anonyme est invité à se connecter avec `returnTo=/pro`.
- [ ] Un utilisateur authentifié sans rattachement tenant n'est pas renvoyé en boucle vers `/pro`.
- [ ] Un utilisateur authentifie sans rattachement peut ouvrir `/pro/request-access` avec le tenant pre-rempli.
- [ ] Aucun appel hors `apiRefs`.

## Open questions

- Le contact proprietaire du lieu doit-il etre un email, un WhatsApp business ou une simple note de support V1 ?
