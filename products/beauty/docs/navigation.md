---
specVersion: 1
kind: navigation
appId: beauty
status: stable
---

# Beauty — Navigation

## 1. Vue d'ensemble

Trois sitemaps distincts, chacun servi par un layout dédié :
- **Web client** (public + compte) : domaine principal `beauty.nafura.ma`.
- **Web pro** (back-office salon) : sous-domaine tenant `<salon-slug>.beauty.nafura.ma` OU chemin `/pro` sur le domaine principal (à arbitrer, voir Open questions). Hypothèse de travail V1 : **chemin `/pro` sur le domaine principal**, avec résolution tenant via le contexte utilisateur connecté.
- **Web admin Nafura** : domaine séparé `admin.beauty.nafura.ma` (ou chemin `/admin` protégé, idem à arbitrer ; hypothèse V1 : chemin `/admin` sur le domaine principal).

## 2. Sitemap — Web client

```
/                                  → home (discovery)
/search                            → salon-search (résultats + filtres)
/salons/:slug                      → salon-detail
/salons/:slug/services             → service-list
/salons/:slug/book                 → booking-create (étape 1)
/booking/:bookingId/payment        → booking-payment (étape 2 optionnelle)
/booking/:bookingId/confirm        → booking-confirm (étape 3)
/me                                → customer-profile
/me/bookings                       → customer-bookings
/me/bookings/:bookingId            → customer-booking-detail
/me/loyalty                        → customer-loyalty
/login                             → login
/register                          → register
```

### Layouts client
- `public-layout` : header avec logo, barre de recherche compacte, bouton "Mon compte" ; footer pleine largeur. Utilisé pour `/`, `/search`, `/salons/*`, `/login`, `/register`.
- `booking-layout` : header minimaliste avec stepper 1-2-3 (créneau → paiement → confirmation), pas de footer. Utilisé pour `/salons/:slug/book`, `/booking/*`.
- `account-layout` : header standard + sidebar verticale (mobile : drawer) avec menu Compte / Mes RDV / Fidélité / Déconnexion. Utilisé pour `/me/*`.

### Menu principal client
- Logo Beauty (→ `/`)
- Recherche (saisie ville, dropdown services populaires)
- "Mes RDV" (visible si auth, sinon "Connexion")
- Sélecteur de langue (fr / ar / en)

### Breadcrumb client
- Discovery : `Accueil > Recherche > <Nom du salon>`
- Compte : `Mon compte > Mes RDV > <date> chez <salon>`

## 3. Sitemap — Web pro

```
/pro                               → pro-dashboard (default)
/pro/agenda                        → pro-agenda
/pro/bookings                      → pro-bookings-list
/pro/bookings/:bookingId           → pro-booking-detail
/pro/services                      → pro-services
/pro/staff                         → pro-staff
/pro/customers                     → pro-customers
/pro/customers/:customerId         → pro-customers (fiche modale ou détail in-page)
/pro/reviews                       → pro-reviews
/pro/loyalty                       → pro-loyalty
/pro/settings                      → pro-settings
```

### Layouts pro
- `pro-layout` : sidebar gauche fixe (logo salon, menu vertical), topbar (sélecteur langue, switch staff, profil), main content. Sidebar collapsible sur tablette, drawer sur mobile. Utilisé pour toutes les routes `/pro/*`.

### Menu principal pro (sidebar)
1. Dashboard
2. Agenda
3. Réservations
4. Clients
5. Services
6. Staff
7. Avis
8. Fidélité
9. Paramètres

Le menu est filtré par rôle :
- OWNER : tout visible.
- ADMIN : tout sauf "Paramètres > Facturation" et "Paramètres > Suppression du salon".
- STAFF : uniquement Dashboard (vue restreinte à ses RDV), Agenda (vue jour, ses RDV uniquement), Réservations (uniquement les siennes).

### Breadcrumb pro
- `Dashboard > <Section> > <Détail>` (ex : `Dashboard > Réservations > #BK-00123`).

## 4. Sitemap — Admin Nafura

```
/admin                             → admin-overview (default)
/admin/tenants                     → admin-tenants
/admin/tenants/:tenantId           → admin-tenant-detail
```

### Layouts admin
- `admin-layout` : topbar Nafura distincte (couleurs neutres, badge "Admin Plateforme"), sidebar minimaliste (Overview, Tenants). Pas de switch tenant (l'admin voit tout).

### Menu principal admin
1. Vue d'ensemble (overview)
2. Tenants (liste salons)

### Breadcrumb admin
- `Admin > Tenants > <Nom du salon>`.

## 5. Guards et redirections

| Route | Auth | Rôles | Redirection sur échec |
|---|---|---|---|
| `/` | public | — | — |
| `/search` | public | — | — |
| `/salons/:slug` | public | — | — |
| `/salons/:slug/services` | public | — | — |
| `/salons/:slug/book` | optional → required à submit | CUSTOMER (forcé à login si non auth) | `/login?redirect=...` |
| `/booking/*` | required | CUSTOMER | `/login?redirect=...` |
| `/me/*` | required | CUSTOMER | `/login?redirect=...` |
| `/pro/*` | required | OWNER, ADMIN, STAFF (filtré côté écran) | `/login?role=pro&redirect=...` |
| `/admin/*` | required | PLATFORM_ADMIN | 403 page |

Guard plateforme attendu : `:platform:core:authorization` expose un `RoleGuard` paramétrable par route. Les guards écrivent dans l'URL le `redirect` pour reprendre le parcours après auth.

## 6. Stratégies de chargement

- Lazy loading par zone Angular : chaque zone (`discovery`, `booking`, `account`, `pro`, `admin`) est un module lazy.
- Préchargement : preload du module `discovery` au login client ; preload de `pro-agenda` au login pro.
- Code splitting : composants lourds (agenda, photo-gallery, time-slot-picker) en chunks séparés.

## 7. États de navigation transverses

- **Tenant non résolu en zone pro** : redirige vers une page d'erreur dédiée invitant à contacter le support Nafura.
- **Tenant suspendu** : zone pro affiche une bannière persistante non dismissible avec lien support ; les mutations API renvoient 423 (Locked) et l'UI bloque les actions d'écriture.
- **Session expirée** : intercepteur HTTP redirige vers `/login?reason=expired&redirect=...`.
- **Langue** : changement via dropdown header ; persistance en `localStorage`, fallback `Accept-Language`. Bascule RTL sur `ar`.

## 8. Open questions

- Sous-domaine tenant pour le pro (`<slug>.beauty.nafura.ma`) vs chemin `/pro` ? Décision provisoire : chemin `/pro` en V1 pour simplifier le DNS et le routing, sous-domaine envisagé V2 pour le SEO et le branding salon.
- Domaine admin séparé (`admin.beauty.nafura.ma`) vs chemin `/admin` ? Idem, V1 = chemin protégé.
- Deep-linking d'une fiche staff (`/salons/:slug/staff/:staffId`) : intéressant pour le SEO mais hors scope V1. À reconsidérer V2.
- Slug salon : généré à l'onboarding ou choisi par le pro ? Hypothèse V1 : généré (kebab-case du nom + suffixe ville si collision).

## 9. Prototype mobile P1 (état interne)

Le Client Walkthrough (`products/beauty/mobile/`) utilise la navigation par **état** (`Screen` dans `App.tsx`), sans URLs hash.

**Cartographie officielle :** [mobile-map.md](mobile-map.md)

Points clés :

| Spec web (`pro-*`) | Code mobile (`manager-*`) |
|--------------------|---------------------------|
| pro-dashboard | `manager-dashboard` |
| pro-bookings-list | `manager-bookings-list` |
| pro-booking-detail | `manager-booking-detail` |
| pro-services | `manager-services` |
| pro-staff | `manager-staff` |
| pro-reviews | `manager-reviews` |

Écrans spec **non branchés** en P1 : `login`, `register`, `booking-payment`, `salon-search` (recherche dans `home`), `pro-agenda`, `pro-customers`, `pro-loyalty`, `pro-settings`, admin (3).

Écran mobile-only : `entry` (choix Client / Manager).
