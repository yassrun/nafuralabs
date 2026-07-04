---
specVersion: 1
kind: fixtures
appId: layali
status: ready
phase: P1
language: fr
sourceFile: products/layali/mobile/src/prototypeData.ts
---

# Layali — Fixtures walkthrough (P1)

Données mock pour le Client Walkthrough. Pas de contrats REST en P1.

Source code : `mobile/src/prototypeData.ts` · Inventaire écrans : [phases.md](phases.md) § Inventaire.

---

## Entités minimales

| Entité | Cible | Écrans / flows |
|--------|-------|----------------|
| Venue | 3–5 | discovery, booking |
| Event | 4+ | discovery, ticket |
| Table / plan | par venue | booking TABLE, `pro-tables` |
| Counter spots | par venue | booking COUNTER |
| Guest list rules | par venue | booking GUEST_LIST, review |
| Booking client | historique + draft | booking-*, `bookings-list`, `my-accesses` |
| Ticket orders | 2+ refs | ticket-*, `my-accesses` |
| Customer profile | 1 | `mockUserProfile`, login/register |
| Manager session | 1 owner | pro-login → pro-* |
| Access requests | 2+ PENDING | `pro-access-requests`, membership flows |
| Membership requests | 1 draft | wp-p1-02 `pro-no-access`, `pro-access-request` |
| Pro tickets sold | liste stub | wp-p1-03 `pro-tickets-list` |
| Reviews à modérer | 2–3 | wp-p1-03 `pro-reviews` |
| Venue settings draft | 1 venue | wp-p1-03 `pro-venue-settings` |
| Admin tenants | 2–3 | wp-p1-04 admin-* |

---

## Scénarios démo (flows gate)

### customer-table-booking

Home → venue → TABLE → `booking-create` → payment → confirm → `bookings-list` / `#/me/accesses`

### customer-guest-list-booking

Venue → GUEST_LIST → create → **review** (MANUAL venue) → confirm — wp-p1-01 si review absent

### customer-counter-booking

Venue → COUNTER → create → **review** → confirm — wp-p1-01

### customer-ticket-purchase

`#/events` → detail → buy → payment → confirm → entrée ticket dans `my-accesses`

### pro-walkthrough

entry → pro-login → dashboard → bookings → door → tables → events → access-requests

### pro-membership-request / review

Utilisateur sans tenant → no-access → access-request → OWNER approuve dans access-requests

### admin-walkthrough

entry (Admin) → overview → tenants → tenant-detail — fixtures ci-dessous

---

## Données stub à ajouter (wp-p1-02 … wp-p1-04)

### Admin tenants (wp-p1-04)

| tenantId | Nom | Statut | Ville |
|----------|-----|--------|-------|
| tenant-sky31 | Sky31 Casablanca | ACTIVE | Casablanca |
| tenant-mirage | Le Mirage Club | ACTIVE | Casablanca |
| tenant-palmeraie | Palmeraie Terrace | SUSPENDED | Casablanca |

### Pro no-access / access-request (wp-p1-02)

- Utilisateur test : `host@example.ma` sans `tenantIds[]`
- Formulaire : rôle HOST, message, téléphone

### Pro ops stub (wp-p1-03)

- Tickets vendus : 5 entrées avec ref `TKT-LAY-*`, statuts PAID / REFUNDED
- Reviews pending : 2 avis 1–2 étoiles sur venue mock
- Venue settings : nom, horaires, photo placeholder URL

---

## Règles P1

- Fuseau `Africa/Casablanca`, devise `MAD`
- Hash routing mock — voir [mobile-map.md](mobile-map.md)
- 18+ disclaimer sur register / achat ticket

---

## Évolution

| Phase | Fixtures |
|-------|----------|
| P1 | `prototypeData.ts` |
| P2 | MSW / interceptor |
| P3 | `api/*.md` + backend |
