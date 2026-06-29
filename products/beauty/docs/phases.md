---
specVersion: 1
kind: phase-plan
appId: beauty
status: ready
language: fr
---

# Beauty — Plan de phases

Modèle de delivery : **specs as code** par phase. Chaque phase a sa profondeur de spec et son livrable code.

| Phase | Nom | Livrable code | Profondeur spec |
|-------|-----|---------------|-----------------|
| **P1** | Client Walkthrough | `mobile/` (Ionic React + fixtures locales) | `navigation`, `flows`, `screens`, `fixtures.md` — **pas** de détail API |
| **P2** | Skeleton technique | `web/` + mock server structuré | `mock-api.md`, layouts, i18n — toujours sans backend réel |
| **P3** | Wire API | `backend/` + branchement HTTP | `api/*.api.md`, `technical-spec` |
| **P4** | Ship | deploy K8s, paiement/SMS réels | NFR, ops |

**Règle :** aucun WP de phase N+1 ne démarre tant que la gate de phase N n’est pas ✅ dans [00-PROGRESS.md](00-PROGRESS.md).

**Alignement spec ↔ code :** [mobile-map.md](mobile-map.md) (P1). `status` sur un screen spec ≠ implémenté ; voir colonne Impl dans `mobile-map` et `00-PROGRESS`.

---

## P1 — Client Walkthrough (livraison en cours)

### Objectif

Application **mobile** parcourant **tous les flows et écrans prioritaires** avec des **fixtures locales** (`mobile/src/prototypeData.ts`). Donner une vision fidèle du produit — sans API réelle, sans backend.

### Surface P1

- **Mobile client** : Ionic React — `products/beauty/mobile/`
- **Web / backend** : hors P1 (P2/P3)

### Specs actives en P1

| Brique | Dossier | Rôle |
|--------|---------|------|
| Vision | [app.md](app.md) | North star |
| Routes cliquables | [navigation.md](navigation.md) | Sitemap walkthrough |
| Parcours | [flows/](flows/) | Scripts de démo |
| Écrans | [screens/](screens/) | Intent + états UI (pas de mapping DTO) |
| Données mock | [fixtures.md](fixtures.md) | Jeu de données crédible |

### Specs reportées (hors P1)

| Brique | Phase | Note |
|--------|-------|------|
| [api/](api/) | P3 | Brouillons `draft` — ne pas bloquer le walkthrough |
| [mock-api.md](mock-api.md) | P2/P3 | Conventions HTTP avant wire |
| `technical-spec` | P3 | Backend Spring |

### Flows P1 (gate)

| Flow | Fichier | Gate |
|------|---------|------|
| Réservation client | [customer-booking.flow.md](flows/customer-booking.flow.md) | ☐ |
| Inscription / connexion | [customer-onboarding.flow.md](flows/customer-onboarding.flow.md) | ☐ |
| Parcours pro | [pro-walkthrough.flow.md](flows/pro-walkthrough.flow.md) | ☐ |
| Admin stub | [admin-walkthrough.flow.md](flows/admin-walkthrough.flow.md) | ☐ |

### Inventaire écrans P1 (28 specs)

Convention : [screens/README.md](screens/README.md) · Cartographie : [mobile-map.md](mobile-map.md)

| zone | screenId | p1MobileId | p1Impl |
|------|----------|------------|--------|
| account | entry | entry | mock |
| discovery | home | home | mock |
| discovery | salon-search | salon-search | mock |
| discovery | salon-detail | salon-detail | mock |
| discovery | service-list | service-list | mock |
| booking | booking-create | booking-select-time | mock |
| booking | booking-payment | booking-payment | mock |
| booking | booking-confirm | booking-confirm | mock |
| account | login | login | mock |
| account | register | register | mock |
| account | customer-profile | customer-profile | mock |
| account | customer-bookings | bookings-list | mock |
| account | customer-booking-detail | booking-detail | mock |
| account | customer-loyalty | customer-loyalty | mock |
| pro | pro-login | manager-login | mock |
| pro | pro-dashboard | manager-dashboard | mock |
| pro | pro-agenda | manager-agenda | mock |
| pro | pro-bookings-list | manager-bookings-list | mock |
| pro | pro-booking-detail | manager-booking-detail | mock |
| pro | pro-services | manager-services | mock |
| pro | pro-staff | manager-staff | mock |
| pro | pro-customers | manager-customers | mock |
| pro | pro-reviews | manager-reviews | mock |
| pro | pro-loyalty | manager-loyalty | mock |
| pro | pro-settings | manager-settings | mock |
| admin | admin-overview | admin-overview | mock |
| admin | admin-tenants | admin-tenants | mock |
| admin | admin-tenant-detail | admin-tenant-detail | mock |

### Work packages P1

| WP | Titre | Dépend de |
|----|-------|-----------|
| [wp-p1-01](work-packages/wp-p1-01-auth-booking-mock.wp.md) | Auth mock + booking complet (payment mock) | — |
| [wp-p1-02](work-packages/wp-p1-02-discovery-account.wp.md) | Discovery + compte (loyalty, search) | wp-p1-01 |
| [wp-p1-03](work-packages/wp-p1-03-pro-walkthrough.wp.md) | Écrans pro manquants | — |
| [wp-p1-04](work-packages/wp-p1-04-admin-walkthrough.wp.md) | Admin stub (3 écrans) | — |
| wp-07, wp-08, wp-09 | Enrichissements UX mobile (optionnel P1) | selon WP |

### Critères de sortie P1

- [ ] Tous les écrans listés dans [00-PROGRESS.md](00-PROGRESS.md) sont **navigables** depuis `mobile/`
- [ ] Les 2 flows P1 sont jouables bout en bout (mock)
- [ ] Aucune dépendance à une API HTTP réelle
- [ ] Walkthrough documenté : démo 15 min client + pro + admin stub
- [ ] `npm run build` vert sur `products/beauty/mobile`

---

## P2 — Skeleton technique

Work packages existants : **wp-01** (squelette web Angular, auth mock, i18n, mock server).

Gate : `npm run start:beauty` (web), intercepteurs, RTL — **API toujours mockée**.

---

## P3 — Wire API

Détailler et implémenter [api/](api/), modules Gradle, remplacement progressif mock → HTTP.

Work packages : wp-02 à wp-06 (web), nouveaux `wp-p3-*` wire par domaine.

---

## P4 — Ship

Staging K8s, Keycloak prod, CMI/SMS — hors scope actuel.
