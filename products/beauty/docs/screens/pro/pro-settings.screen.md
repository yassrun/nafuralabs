---
specVersion: 1
kind: screen
appId: beauty
screenId: pro-settings
name: Paramètres salon (pro)
status: stable
phase: P1
p1MobileId: manager-settings
p1Impl: mock
route: /pro/settings
layout: pro-layout
zone: pro
roles: [OWNER, ADMIN]
auth: required
flowRefs: []
apiRefs:
  - ../../api/salons.api.md
  - ../../api/tenants-admin.api.md
abstractions:
  components:
    - "@platform/core/components/photo-gallery"
    - "@platform/core/components/address-with-map"
    - "@platform/core/forms/business-hours-editor"
    - "@platform/core/i18n"
---

# Paramètres salon (pro)

## P1 - Client Walkthrough

| Champ | Valeur |
|-------|--------|
| Mobile `Screen` | `â€”` |
| Impl | none |
| Fixtures | [fixtures.md](../../fixtures.md) |
| Cartographie | [mobile-map.md](../../mobile-map.md) |

> En P1 : **ne pas** utiliser `apiRefs` / composants `@platform/` comme brief agent - mock local uniquement. *(wp-p1-03 stub)*

## Intent

Configurer la fiche publique du salon (identité, photos, adresse, horaires, conditions) et les règles opérationnelles (fenêtre annulation, paiement en ligne obligatoire, etc.). OWNER seul accède aux sections billing et suppression.

## Route et accès

- Route : `/pro/settings`
- Layout : `pro-layout`
- Auth : required
- Rôles : OWNER (full), ADMIN (sauf Billing et Suppression)
- Tenant requis : oui

## Données nécessaires

| Donnée | Source | Quand chargée | Mise en cache |
|---|---|---|---|
| Salon (config complète) | [GET /api/v1/pro/salon](../../api/salons.api.md) | onInit | session 1 min |
| Info billing (OWNER) | [GET /api/v1/pro/billing](../../api/tenants-admin.api.md) | lazy tab "Facturation" | session |

## Mock API consommée

- `GET /api/v1/pro/salon`
- `PATCH /api/v1/pro/salon`
- `POST /api/v1/pro/salon/photos`
- `DELETE /api/v1/pro/salon/photos/:id`
- `POST /api/v1/pro/salon/opening-hours`
- `POST /api/v1/pro/salon/publish` / `unpublish`
- `GET /api/v1/pro/billing`
- `DELETE /api/v1/pro/salon` (OWNER, suppression compte tenant)

## États

### loading
- Skeleton tabs + form.

### empty
- N/A.

### error
- 401, 503.

### success
- Tabs verticales : `Identité` | `Photos` | `Adresse` | `Horaires` | `Réservation` | `Notifications` | `Facturation` | `Compte`.
- Identité : nom, tagline, description, catégories, dressCode, ageMin, langues, slug (lecture seule).
- Photos : galerie réordonnable, upload, suppression.
- Adresse : champs + map avec lat/lng (composant adressé).
- Horaires : `business-hours-editor` récurrent + exceptions.
- Réservation : `acceptsOnlineBooking`, `requireOnlinePayment`, fenêtre annulation gratuite (en heures), buffer global staff.
- Notifications : toggles SMS rappel J-1, email confirmation, langue templates.
- Facturation : RIB, plan plateforme (V1 monoplan), historique factures Nafura.
- Compte : statut tenant, bouton "Suspendre temporairement" (OWNER), bouton "Supprimer le salon" (OWNER, dangereux).

## Actions utilisateur

| Action | Déclencheur | Résultat |
|---|---|---|
| Modifier un champ | inline / form | `PATCH /pro/salon` |
| Upload photo | bouton | `POST /photos` |
| Supprimer photo | bouton | dialog → `DELETE` |
| Modifier horaires | éditeur | `POST /opening-hours` |
| Publier/Dépublier | toggle | `POST /publish` ou `/unpublish` |
| Suspendre temporaire | bouton OWNER | `PATCH /pro/salon` `status=SUSPENDED_BY_OWNER` |
| Supprimer salon | lien OWNER | dialog triple confirm → `DELETE /pro/salon` |
| Changer langue templates | dropdown | `PATCH /pro/salon` |

## Composants utilisés

| Composant | Source | Rôle |
|---|---|---|
| photo-gallery | `@platform/core/components/photo-gallery` | galerie photos |
| address-with-map | `@platform/core/components/address-with-map` | adresse + carte |
| business-hours-editor | `@platform/core/forms/business-hours-editor` | horaires |

## Composants internes (non réutilisables)

- `<SettingsTabsLayout>` : tabs verticales.
- `<DeleteSalonDialog>` : dialog triple confirm avec saisie nom du salon.

## Validations et règles métier

- ADMIN : tabs Facturation et Compte cachées ; PATCH bloqué côté backend (403).
- Slug non modifiable en V1.
- Suppression salon : interdit si bookings futurs (409, conseil d'annuler d'abord).
- Publication : pré-conditions identité + au moins 1 photo + adresse + horaires + 1 service.
- Photos : 5 Mo max, jpeg/webp ; min 1, max 30.

## i18n

- Clés : `beauty.proSettings.title`, `beauty.proSettings.tab.<tab>`, `beauty.proSettings.publish.cta`, `beauty.proSettings.unpublish.cta`, `beauty.proSettings.delete.cta`, `beauty.proSettings.delete.warning`, `beauty.proSettings.booking.requireOnlinePayment`, `beauty.proSettings.booking.cancelWindowHours`, `beauty.proSettings.notifications.smsReminder`.

## Critères d'acceptation

- [ ] L'écran rend les 4 états.
- [ ] ADMIN n'accède pas aux tabs Facturation et Compte (UI + guard backend).
- [ ] La publication vérifie les pré-conditions et retourne 422 sinon.
- [ ] La suppression du salon est triple-confirmée et bloquée si bookings futurs.
- [ ] Les modifications publiques (nom, photos) sont visibles côté découverte sans délai > 1 min (cache invalidé).
- [ ] Aucun appel direct à un endpoint hors `apiRefs`.

## Open questions

- Multi-salons sous un même tenant : V2.
- Templates SMS/email personnalisables : V2.
- Historique audit interne (qui a modifié quoi) : V2.
