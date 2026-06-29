---
specVersion: 1
kind: navigation
appId: layali
status: stable
language: fr
---

# Layali — Navigation et routes

## 1. Hôtes et entrées applicatives

| Audience | Hôte | Description |
|---|---|---|
| Client public | `layali.ma` | Découverte et achat. Auth optionnelle, requise au moment de payer ou d'accéder à `account`. L'entrée auth publique propose un choix `Client` ou `Manager`. |
| Pro (back-office venue) | `<venue-slug>.pro.layali.ma` | Tenant résolu par le sous-domaine. Auth requise. |
| Admin plateforme | `admin.layali.ma` | Accès `PLATFORM_ADMIN` uniquement. Auth requise. |

En mode mock/dev, un seul hôte (`localhost`) suffit ; le tenant pro est résolu par header `X-Tenant-Id` et par segment URL `/pro/:tenant` si besoin. Sur cet hôte unique, l'entrée auth doit afficher deux boutons explicites : `Je suis client` et `Je suis manager`.

## 2. Layouts

| Layout | Audience | Composants |
|---|---|---|
| `public-shell` | client | header transparent, recherche persistante, footer marketing |
| `account-shell` | client connecté | header avec menu profil, breadcrumb compact |
| `pro-shell` | pro | sidebar gauche par menus, header avec sélecteur venue (multi-venue) |
| `admin-shell` | admin Nafura | sidebar gauche, header admin |
| `fullscreen` | door check-in | sans chrome, plein écran, scanner caméra |

## 3. Sitemap web client (zone `discovery`, `booking`, `ticket`, `account`)

```
/                                    home.screen
/venues                              venue-search.screen
/venues/:venueSlug                   venue-detail.screen
/events                              event-list.screen
/events/:eventSlug                   event-detail.screen

/venues/:venueSlug/book              table-booking-create.screen
/venues/:venueSlug/book/payment      table-booking-payment.screen
/venues/:venueSlug/book/confirm/:bookingId   table-booking-confirm.screen

/venues/:venueSlug/guest-list                guest-list-booking-create.screen
/venues/:venueSlug/guest-list/review         guest-list-booking-review.screen
/venues/:venueSlug/guest-list/confirm/:bookingId   guest-list-booking-confirm.screen

/venues/:venueSlug/counter                   counter-booking-create.screen
/venues/:venueSlug/counter/review            counter-booking-review.screen
/venues/:venueSlug/counter/confirm/:bookingId   counter-booking-confirm.screen

/events/:eventSlug/buy               ticket-buy.screen
/events/:eventSlug/buy/payment       ticket-payment.screen
/events/:eventSlug/buy/confirm/:ticketOrderId  ticket-confirm.screen

/login                               login.screen (`?audience=customer|manager`)
/register                            register.screen

/me/bookings                         customer-bookings.screen
/me/tickets                          customer-tickets.screen
/me/profile                          customer-profile.screen
```

Guards client :
- `/me/*` : `auth: required`, rôle `CUSTOMER` (ou tout rôle authentifié).
- `/venues/:venueSlug/book*`, `/venues/:venueSlug/guest-list*`, `/venues/:venueSlug/counter*` et `/events/:eventSlug/buy*` : auth déclenchée si non connecté avant `payment`, `review` ou confirmation.

## 4. Sitemap web pro (zone `pro`)

```
/pro                                 pro-dashboard.screen
/pro/no-access                       pro-no-access.screen
/pro/request-access                  pro-access-request.screen
/pro/access-requests                 pro-access-requests.screen
/pro/tenant-suspended                pro-tenant-suspended.screen
/pro/venue                           pro-venue-settings.screen
/pro/events                          pro-events-list.screen
/pro/events/new                      pro-event-edit.screen
/pro/events/:eventId                 pro-event-edit.screen
/pro/tables                          pro-tables.screen
/pro/bookings                        pro-bookings-list.screen
/pro/bookings/:bookingId             pro-booking-detail.screen
/pro/tickets                         pro-tickets-list.screen
/pro/door                            pro-door-checkin.screen (layout fullscreen)
/pro/reviews                         pro-reviews.screen
```

Guards pro :
- Tenant résolu obligatoirement (`X-Tenant-Id` ou sous-domaine).
- Utilisateur anonyme : redirection `/login?audience=manager&returnTo=<encoded>`.
- Utilisateur authentifié sans `tenantIds[]` ou sans rôle compatible : redirection `/pro/no-access?reason=<code>`.
- `/pro/request-access` : auth requise, accessible a tout utilisateur authentifie ; `tenant` passe en querystring.
- `/pro/access-requests` : rôles `OWNER`, `ADMIN` ; mutations approve/reject reservees a `OWNER`.
- Tenant suspendu : redirection `/pro/tenant-suspended?tenant=<slug>`.
- `/pro/door` : rôles `HOST`, `ADMIN`, `OWNER`.
- `/pro/venue`, `/pro/events*`, `/pro/tables` : rôles `OWNER`, `ADMIN`.
- `/pro/bookings*`, `/pro/tickets`, `/pro/reviews` : rôles `OWNER`, `ADMIN`, `BAR_MANAGER` (lecture seule pour BAR_MANAGER).
- `/pro` : `OWNER`, `ADMIN`; si `HOST` → redirect `/pro/door`, si `BAR_MANAGER` → redirect `/pro/bookings`.

## 5. Sitemap admin Nafura (zone `admin`)

```
/admin                               admin-overview.screen
/admin/tenants                       admin-tenants.screen
/admin/tenants/:tenantId             admin-tenant-detail.screen
```

Guards admin :
- Rôle `PLATFORM_ADMIN`.

## 6. Menus principaux

### 6.1 Menu client (header)
- Découvrir → `/`
- Venues → `/venues`
- Événements → `/events`
- (connecté) Mes réservations → `/me/bookings`
- (connecté) Mes tickets → `/me/tickets`
- (connecté) Profil → `/me/profile`
- (déconnecté) Se connecter → `/login` (choix `Client` / `Manager` si aucun `audience` n'est fourni)

### 6.2 Sidebar pro
- Tableau de bord → `/pro`
- Accès équipe → `/pro/access-requests`
- Événements → `/pro/events`
- Plan de salle → `/pro/tables`
- Réservations → `/pro/bookings`
- Tickets → `/pro/tickets`
- Door (entrée) → `/pro/door`
- Avis → `/pro/reviews`
- Paramètres venue → `/pro/venue`

### 6.3 Sidebar admin
- Vue d'ensemble → `/admin`
- Venues / Tenants → `/admin/tenants`

## 7. Conventions de breadcrumb

Format : `Zone > Section > Détail`. Exemples :
- Pro : `Pro > Événements > Soirée Saint-Valentin (Édition)`
- Admin : `Admin > Tenants > Sky31 Casablanca`
- Client : pas de breadcrumb, fil d'Ariane visuel via le titre de page et un bouton retour.

Les libellés sont i18n (`layali.nav.breadcrumb.*`).

## 8. Redirections et fallbacks

- `404` global : composant `<NotFound>` (`@platform/core/components/not-found`), bouton retour à la racine de la zone.
- `403` global : composant `<Forbidden>`, indique le rôle requis et propose login si pertinent.
- Session expirée : redirection vers `/login?returnTo=<encoded>`.
- Tenant introuvable côté pro : redirection vers `/admin/tenants` si `PLATFORM_ADMIN`, sinon page d'erreur dédiée.

## 9. Deep linking et partage

- Les URLs `/venues/:venueSlug` et `/events/:eventSlug` sont publiques et indexables (SEO).
- Open Graph : titre, description, image principale du venue/event injectée par SSR (out of scope V1 si trop coûteux ; CSR + meta dynamiques acceptés).
- QR scannés à l'entrée pointent vers un payload signé (pas une URL web), traité exclusivement par `pro-door-checkin`.

## 10. Open questions

- Faut-il un domaine dédié `pro.layali.ma` global avec sélecteur de venue, ou strictement un sous-domaine par venue ? Décision provisoire : sous-domaine par venue pour V1.
- Le `/admin` doit-il être strictement isolé sur `admin.layali.ma` ou accessible via `layali.ma/admin` ? Décision provisoire : sous-domaine dédié pour V1.
- SEO du venue-detail : besoin de SSR dès V1 ? Décision provisoire : non, pre-rendering ciblé suffira.

## 11. Prototype mobile P1 (hash routing)

Le Client Walkthrough (`products/layali/mobile/`) n’implémente **pas** toutes les routes web §3–5. Il utilise un hash routing partiel et des écrans fusionnés.

**Cartographie officielle :** [mobile-map.md](mobile-map.md)

| Type | Exemples |
|------|----------|
| Hash synchronisé | `#/venues`, `#/events`, `#/login`, `#/pro`, `#/me/accesses` |
| État interne seulement | `booking-create`, `ticket-buy`, `pro-access-requests` |
| Mobile-only | `entry`, `pro-login`, `my-accesses` |
| Booking unifié | 9 specs `screens/booking/*` → 3 `Screen` ids — voir [screens/booking/README.md](screens/booking/README.md) |

En P1, `my-accesses` regroupe partiellement `customer-bookings` + `customer-tickets`. Le web gardera les routes séparées `/me/bookings` et `/me/tickets`.
