---
specVersion: 1
kind: screen
appId: layali
screenId: pro-tenant-suspended
name: Venue suspendu
status: review
route: /pro/tenant-suspended
layout: public-shell
zone: pro
roles: [OWNER, ADMIN, HOST, BAR_MANAGER]
auth: required
flowRefs:
  - ../../flows/pro-access.flow.md
apiRefs: []
abstractions:
  components:
    - "@platform/core/components/banner"
    - "@platform/core/components/button"
  patterns:
    - "auth/blocked-tenant"
---

# Venue suspendu

## Intent

Bloquer proprement l'acces au back-office quand le tenant/venue est suspendu par Nafura tout en donnant le minimum de contexte et le canal de support.

## Route et accès

- Route : `/pro/tenant-suspended?tenant=<slug>`
- Layout : public-shell
- Auth : required
- Rôles autorisés : OWNER, ADMIN, HOST, BAR_MANAGER
- Tenant requis : oui en pratique, mais l'ecran se charge apres echec de resolution tenant active

## Données nécessaires

| Donnée | Source | Quand chargée | Mise en cache |
|---|---|---|---|
| Tenant cible (slug) | querystring ou contexte guard | onInit | n/a |
| Identité courante | `:platform:core:identity` | onInit | mémoire |

## Mock API consommée

Aucun endpoint direct. Cet ecran est atteint apres un 403 `tenant_suspended` emane d'un autre ecran/guard.

## États

### loading
- N/A.

### empty
- N/A.

### error
- N/A.

### success
- Titre : "L'acces a ce venue est temporairement suspendu".
- Bandeau d'information indiquant que les operations pro sont bloquees.
- Bloc contexte : tenant cible, role courant, email support Nafura.
- CTA : `Retour a l'accueil pro` (si futur selecteur multi-venue) ou `Se deconnecter`.

## Actions utilisateur

| Action | Déclencheur | Résultat |
|---|---|---|
| Retour accueil | bouton | navigation `/` ou `/pro` selon config runtime |
| Se déconnecter | bouton secondaire | logout + `/login` |

## Composants utilisés

| Composant | Source | Rôle dans l'écran |
|---|---|---|
| banner | `@platform/core/components/banner` | état suspendu |
| button | `@platform/core/components/button` | actions |

## Composants internes (non réutilisables)

- `<SupportContactCard>` : carte mail/téléphone support Nafura.

## Validations et règles métier

- Aucune action métier venue ne doit etre disponible.
- Le header global pro ne doit pas afficher les menus operatoires.
- Toute tentative de retour navigateur vers une route `/pro/*` doit etre reredirigee vers cet ecran tant que la session garde ce tenant suspendu.

## i18n

- `layali.pro.tenant-suspended.title`
- `layali.pro.tenant-suspended.body`
- `layali.pro.tenant-suspended.cta.home`
- `layali.pro.tenant-suspended.cta.logout`
- `layali.pro.tenant-suspended.support`

## Critères d'acceptation

- [ ] L'écran s'affiche suite a un 403 `tenant_suspended` sans boucle de redirection.
- [ ] Aucune navigation vers un ecran metier pro n'est possible depuis cet etat.
- [ ] La deconnexion fonctionne depuis cet ecran.

## Open questions

- En V1, le support doit-il etre email uniquement ou email + WhatsApp business ?
