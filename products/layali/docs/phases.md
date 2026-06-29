---
specVersion: 1
kind: phase-plan
appId: layali
status: ready
language: fr
---

# Layali — Plan de phases

Modèle aligné sur [Beauty phases.md](../../beauty/docs/phases.md) : **specs as code** par phase, **Client Walkthrough** en P1.

| Phase | Nom | Livrable | Profondeur spec |
|-------|-----|----------|-----------------|
| **P1** | Client Walkthrough | `mobile/` Ionic + `prototypeData.ts` | `navigation`, `flows`, `screens`, `fixtures.md` — **pas** détail `api/` |
| **P2** | Skeleton technique | `web/` + mock server | `mock-api.md`, shells Angular, realtime/QR platform |
| **P3** | Wire API | `backend/` + HTTP | `api/*.md`, `technical-spec` |
| **P4** | Ship | K8s, prod | NFR, ops |

Gate : [00-PROGRESS.md](00-PROGRESS.md) · Règle : pas de WP phase N+1 avant gate P1 ✅.

**Alignement spec ↔ code :** [mobile-map.md](mobile-map.md) (P1). Les champs `status` sur les `*.screen.md` décrivent la **maturité du document** ; l’implémentation mobile est dans `00-PROGRESS` / `mobile-map` (`implStatus` optionnel sur les écrans mobile-only).

---

## Registre des zones (dossiers `screens/`)

Les sous-dossiers de `screens/<zoneId>/` sont **propres à Layali** (pas imposés à Beauty).

| zoneId | Audience | Auth | Dossier screens |
|--------|----------|------|-----------------|
| `discovery` | CUSTOMER, public | public | `screens/discovery/` |
| `booking` | CUSTOMER | optional → required | `screens/booking/` |
| `ticket` | CUSTOMER | optional → required | `screens/ticket/` |
| `account` | CUSTOMER | required (sauf login/register) | `screens/account/` |
| `pro` | OWNER, ADMIN, HOST, BAR_MANAGER | required | `screens/pro/` |
| `admin` | PLATFORM_ADMIN | required | `screens/admin/` |

Layout `fullscreen` (door check-in) : variante **pro**, pas un dossier screens séparé.

---

## P1 — Client Walkthrough

### Objectif

App **mobile** navigable : discovery, booking (table / guest list / comptoir), tickets, compte, pro, admin stub — **fixtures locales uniquement**.

### Specs actives P1

| Brique | Fichier |
|--------|---------|
| Vision | [app.md](app.md) |
| Zones + routes | [navigation.md](navigation.md) |
| Parcours | [flows/](flows/) |
| Écrans | [screens/](screens/) |
| Fixtures | [fixtures.md](fixtures.md) |

### Hors P1

| Brique | Phase |
|--------|-------|
| [api/](api/) | P3 (`draft`) |
| [mock-api.md](mock-api.md) | P2/P3 |
| wp-01 (web + platform realtime/QR) | P2 |
| wp-07 venue-catalog | P3 |

### Flows P1 (gate)

| Flow | Fichier |
|------|---------|
| Réservation table | [customer-table-booking.flow.md](flows/customer-table-booking.flow.md) |
| Guest list | [customer-guest-list-booking.flow.md](flows/customer-guest-list-booking.flow.md) |
| Comptoir | [customer-counter-booking.flow.md](flows/customer-counter-booking.flow.md) |
| Achat billet | [customer-ticket-purchase.flow.md](flows/customer-ticket-purchase.flow.md) |
| Accès pro | [pro-access.flow.md](flows/pro-access.flow.md) |
| Demande adhésion | [pro-membership-request.flow.md](flows/pro-membership-request.flow.md) |
| Revue adhésion | [pro-membership-review.flow.md](flows/pro-membership-review.flow.md) |
| Parcours pro (gate) | [pro-walkthrough.flow.md](flows/pro-walkthrough.flow.md) |
| Admin stub (gate) | [admin-walkthrough.flow.md](flows/admin-walkthrough.flow.md) |

### Inventaire écrans P1 (43 specs)

Convention : [screens/README.md](screens/README.md) · Booking unifié : [screens/booking/README.md](screens/booking/README.md) · [mobile-map.md](mobile-map.md)

| zone | screenId | p1MobileId | p1Impl |
|------|----------|------------|--------|
| account | entry | entry | mock |
| discovery | home | home | mock |
| discovery | venue-search | venue-search | mock |
| discovery | venue-detail | venue-detail | mock |
| discovery | event-list | event-list | mock |
| discovery | event-detail | event-detail | mock |
| booking | table-booking-create | booking-create | mock |
| booking | table-booking-payment | booking-payment | mock |
| booking | table-booking-confirm | booking-confirm | mock |
| booking | guest-list-booking-create | booking-create | mock |
| booking | guest-list-booking-review | booking-review | mock |
| booking | guest-list-booking-confirm | booking-confirm | mock |
| booking | counter-booking-create | booking-create | mock |
| booking | counter-booking-review | booking-review | mock |
| booking | counter-booking-confirm | booking-confirm | mock |
| ticket | ticket-buy | ticket-buy | mock |
| ticket | ticket-payment | ticket-payment | mock |
| ticket | ticket-confirm | ticket-confirm | mock |
| account | login | login | mock |
| account | register | register | mock |
| account | customer-profile | customer-profile | mock |
| account | customer-bookings | bookings-list | mock |
| account | customer-booking-detail | booking-detail | mock |
| account | my-accesses | my-accesses | mock |
| account | customer-tickets | customer-tickets | mock |
| pro | pro-login | pro-login | mock |
| pro | pro-dashboard | pro-dashboard | mock |
| pro | pro-no-access | pro-no-access | mock |
| pro | pro-access-request | pro-access-request | mock |
| pro | pro-access-requests | pro-access-requests | mock |
| pro | pro-tenant-suspended | pro-tenant-suspended | mock |
| pro | pro-venue-settings | pro-venue-settings | mock |
| pro | pro-events-list | pro-events-list | mock |
| pro | pro-event-edit | pro-event-edit | mock |
| pro | pro-tables | pro-tables | mock |
| pro | pro-bookings-list | pro-bookings-list | mock |
| pro | pro-booking-detail | pro-booking-detail | mock |
| pro | pro-tickets-list | pro-tickets-list | mock |
| pro | pro-door-checkin | pro-door-checkin | mock |
| pro | pro-reviews | pro-reviews | mock |
| admin | admin-overview | admin-overview | mock |
| admin | admin-tenants | admin-tenants | mock |
| admin | admin-tenant-detail | admin-tenant-detail | mock |

### Work packages P1

| WP | Titre |
|----|-------|
| [wp-p1-01](work-packages/wp-p1-01-booking-variants-mock.wp.md) | Booking table / guest list / comptoir (écrans dédiés ou parcours clairs) |
| [wp-p1-02](work-packages/wp-p1-02-ticket-account-mock.wp.md) | Tickets compte + flows membership client si manquants |
| [wp-p1-03](work-packages/wp-p1-03-pro-walkthrough.wp.md) | Écrans pro manquants (reviews, booking detail, tickets list, settings…) |
| [wp-p1-04](work-packages/wp-p1-04-admin-walkthrough.wp.md) | Admin stub (3 écrans) |

### Critères de sortie P1

- [ ] Les 7 flows P1 jouables en mock
- [ ] Tous les écrans [00-PROGRESS.md](00-PROGRESS.md) au moins `mock` ou `partial` explicite
- [ ] Admin stub navigable
- [ ] `npm run build` vert sur `mobile/`
- [ ] Démo walkthrough 20 min documentée

---

## P2 — Skeleton

[wp-01-platform-skeleton.wp.md](work-packages/wp-01-platform-skeleton.wp.md) — web Angular, auth mock, `:platform:integrations:realtime`, `:platform:integrations:qr`.

## P3 — Wire API

wp-02 … wp-06, wp-07 venue-catalog, détail [api/](api/).

## P4 — Ship

Hors scope actuel.
