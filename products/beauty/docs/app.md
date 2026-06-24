---
specVersion: 1
kind: app
appId: beauty
name: Beauty
status: stable
language: fr
tenancy: multi
targetPlatforms: [mobile, web]
businessCode:
  backendRoot: products/beauty/backend
  webRoot: products/beauty/web
  mobileRoot: products/beauty/mobile
abstractions:
  required:
    - :platform:core:tenancy
    - :platform:core:authorization
    - :platform:core:identity
    - "@platform/core/i18n"
  missing:
    - "@platform/core/components/time-slot-picker"
    - "@platform/core/components/rating-stars"
    - "@platform/core/components/photo-gallery"
    - "@platform/core/components/phone-otp-form"
    - "@platform/core/components/address-with-map"
    - "@platform/core/forms/business-hours-editor"
sourceDocs:
  - aispecs/README.md
---

# Beauty

## 1. Vision

Beauty est une plateforme marocaine multi-tenant qui connecte les clients à des salons de beauté (coiffure femme/homme, esthétique, ongles, hammam/spa, barbier) via une expérience de découverte et de réservation en ligne, et qui équipe chaque salon d'un back-office opérationnel (agenda, services, staff, clients, avis, fidélité).

## 2. Personas

### 2.1 Cliente / Client (CUSTOMER)
- Profil : 18-55 ans, urbain, smartphone first, francophone ou arabophone, sensible au prix et à la note.
- Contexte d'usage : cherche un créneau le jour même ou à 1-3 jours, souvent en mobilité, depuis un smartphone.
- Attentes : trouver vite un salon proche disponible, voir les vrais prix, réserver en moins de 60 secondes, recevoir un rappel SMS, cumuler des points.

### 2.2 Propriétaire de salon (OWNER)
- Profil : gérant indépendant ou propriétaire de 1-3 salons, peu technique, suréquipé en téléphone, souvent sur tablette à l'accueil.
- Contexte d'usage : configure son salon une fois, puis consulte agenda et chiffre d'affaires plusieurs fois par jour.
- Attentes : voir son CA, son agenda, ses staffs, ses avis, sans complexité. Reprendre la main en cas d'absence d'un staff.

### 2.3 Manager (ADMIN)
- Profil : main droite du propriétaire, gère le jour-à-jour quand le propriétaire est absent.
- Contexte d'usage : tablette accueil, ordinateur back-office.
- Attentes : tout sauf paramétrage facturation et suppression d'un staff propriétaire.

### 2.4 Staff (STAFF)
- Profil : coiffeur·euse, esthéticien·ne, masseur·euse, barbier.
- Contexte d'usage : smartphone en mobilité, consulte son agenda du jour entre deux clients.
- Attentes : voir uniquement ses propres RDV, marquer un RDV terminé ou no-show, sans accès aux données financières.

### 2.5 Admin plateforme Nafura (PLATFORM_ADMIN)
- Profil : équipe Nafura, support et opérations.
- Contexte d'usage : ordinateur, depuis un domaine d'administration séparé.
- Attentes : voir tous les tenants, onboarder un nouveau salon, suspendre un compte litigieux, suivre les KPIs plateforme.

## 3. Rôles applicatifs

| Rôle | Description | Périmètre | Permissions principales |
|---|---|---|---|
| CUSTOMER | Client final qui réserve | self (pas de tenant scope strict côté lecture publique) | `booking.create-self`, `booking.read-self`, `booking.cancel-self`, `review.create-self`, `loyalty.read-self` |
| OWNER | Propriétaire du tenant salon | tenant | `*` sur le tenant (salon, catalog, staff, booking, customer, payment, review, loyalty, settings, billing) |
| ADMIN | Manager du salon | tenant | tout sauf `billing.*`, `tenant.delete`, `staff.delete-owner` |
| STAFF | Praticien | tenant, filtré sur soi | `booking.read-assigned`, `booking.mark-arrived`, `booking.mark-completed`, `booking.mark-no-show`, `customer.read-assigned` |
| PLATFORM_ADMIN | Admin Nafura | global | `tenant.read`, `tenant.suspend`, `tenant.activate`, `platform.metrics.read` |

> Les permissions complètes seront déclarées dans le manifest runtime `naf/src/spec/applications/beauty/`. Cette section sert d'intention.

## 4. Tenancy et identité

- Mode tenancy : **multi-tenant**, un tenant = un salon (ou un mini-réseau de 2-3 salons d'un même propriétaire, modélisés comme un seul tenant avec plusieurs `salon` enfants — à confirmer V2).
- Définition d'un tenant : entité juridique propriétaire d'un ou plusieurs salons physiques, identifiée par un `tenantId` UUID v4.
- Résolution du tenant côté web pro : sous-domaine `<salon-slug>.beauty.nafura.ma` ou header `X-Tenant-Id` injecté par le tenant resolver (`:platform:core:tenancy`).
- Résolution côté web client public : pas de tenant scope strict pour la découverte ; le tenant cible est inféré au moment de la réservation à partir du salon choisi.
- Auth : Keycloak realm `nafura` ; clients `beauty-web` et `beauty-backend`.
- OTP téléphone : flux dédié pour les clients (pas de mot de passe obligatoire à l'inscription).

## 5. Zones et navigation globale

Zones de l'application :
- `discovery` (public) : home, recherche, fiche salon, catalogue de services.
- `booking` (auth optionnelle, requise pour valider) : création RDV, paiement, confirmation.
- `account` (CUSTOMER) : mes réservations, profil, fidélité.
- `pro` (OWNER / ADMIN / STAFF) : back-office salon.
- `admin` (PLATFORM_ADMIN) : administration plateforme Nafura.

Routes principales : voir [navigation.md](navigation.md).

## 6. Conventions globales

- Locales supportées : `fr` (default), `ar` (RTL), `en`.
- Devise : MAD (dirham marocain), affichée `xxx,xx MAD`.
- Fuseau horaire : `Africa/Casablanca` (UTC+1, pas d'heure d'été depuis 2018).
- Format des dates : `dd/MM/yyyy` (fr), `dd/MM/yyyy` (ar), `MM/dd/yyyy` (en) ; heures `HH:mm`.
- Terminologie : on dit **booking** côté code et API, **RDV** côté UI. Pas de synonymes (`appointment`, `reservation` interdits).
- Mock API : voir [mock-api.md](mock-api.md).
- Médias : photos en jpeg/webp, taille max 5 Mo, redimensionnement serveur ; stockage MinIO.

## 7. Domaines métier (modules backend)

| Domaine | Responsabilité | Module Gradle |
|---|---|---|
| Salon | Fiche salon, photos, horaires d'ouverture, géolocalisation | `:domains:beauty:salon` |
| Catalog | Services, catégories, durées, prix, photos | `:domains:beauty:catalog` |
| Staff | Praticiens, horaires de travail, congés, affectation aux services | `:domains:beauty:staff` |
| Booking | Réservations, créneaux, statuts, cycle de vie | `:domains:beauty:booking` |
| Customer | Clients du salon, historique, profils consolidés | `:domains:beauty:customer` |
| Payment | Paiements en ligne (CMI/Stripe), cash, remboursements | `:domains:beauty:payment` |
| Review | Avis et notes post-RDV, réponses du salon | `:domains:beauty:review` |
| Loyalty | Programme de fidélité (cumul points, conversion) | `:domains:beauty:loyalty` |

## 8. Abstractions et libs Nafura à utiliser

### Existantes (à utiliser tel quel)
- `:platform:core:tenancy` — résolution tenant, propagation header `X-Tenant-Id`, scoping JPA.
- `:platform:core:authorization` — décodage JWT Keycloak, contrôle de rôles et permissions.
- `:platform:core:identity` — modèle utilisateur, lien Keycloak ↔ utilisateur applicatif.
- `@platform/core/i18n` — chargement clés i18n, RTL toggle, formatage devise/date.

### Manquantes (à créer avant ou pendant le développement)
- `:platform:integrations:payment` — abstraction paiement avec adapters `cmi` (par défaut MA) et `stripe` (alternatif). À créer si absente.
- `:platform:integrations:sms` — abstraction SMS (rappels J-1 et OTP) avec provider à brancher plus tard.
- `:platform:integrations:email` — emails transactionnels (confirmation RDV, reset mot de passe optionnel).
- `:platform:integrations:storage` — wrapper MinIO pour upload de photos.
- `@platform/core/components/calendar-week` — composant agenda jour/semaine avec drag pour replanifier.
- `@platform/core/components/time-slot-picker` — sélecteur de créneaux disponibles.
- `@platform/core/components/rating-stars` — étoiles lecture + saisie.
- `@platform/core/components/photo-gallery` — galerie photos avec lightbox, support upload.
- `@platform/core/components/phone-otp-form` — formulaire téléphone + OTP générique.
- `@platform/core/components/address-with-map` — affichage adresse + carte (Google Maps ou OpenStreetMap, à arbitrer).
- `@platform/core/forms/business-hours-editor` — éditeur d'horaires d'ouverture / horaires de travail staff (récurrent, exceptions).

> Hypothèse : tout est `missing` par défaut, sauf les abstractions évidentes du noyau plateforme (tenancy, authorization, identity, i18n). L'agent devra vérifier l'existence réelle avant de réinventer.

## 9. Intégrations externes

- Paiement : CMI (par défaut, redirect 3DS), Stripe (alternatif pour test/dev et cartes internationales). Cash sur place toujours possible (réservation sans pré-paiement = paiement à l'arrivée).
- SMS : abstraction Nafura, provider à brancher (probablement un agrégateur SMS MA type IntelCom, à arbitrer). Usage : OTP login, rappel J-1, confirmation après-RDV avec demande d'avis.
- Email : abstraction Nafura, provider à brancher (probablement Mailgun ou Postal). Usage : confirmation RDV, reset password optionnel.
- Maps : OpenStreetMap (default, gratuit) ou Google Maps (paywall si on a la clé). À arbitrer ; en attendant, on stocke `lat`/`lng` et on affiche une carte légère via `address-with-map`.
- Storage : MinIO (photos salons, photos services, photos staff). URL signées pour lecture publique. Bucket par tenant.
- Calendrier : export `.ics` côté client (généré côté front depuis le détail RDV, pas d'intégration directe Google Calendar V1).

## 10. Données sensibles et conformité

- PII : nom, téléphone, email, langue, photo de profil optionnelle, historique RDV, préférences.
- RGPD / loi 09-08 : déclaration CNDP à prévoir. Droit à l'effacement = soft delete avec anonymisation des bookings (le salon conserve un compteur statistique mais perd l'identité).
- Rétention : bookings et avis 5 ans, données paiement 7 ans (obligation comptable MA), logs accès 1 an.
- Chiffrement : TLS en transit, PII chiffrée au repos via mécanisme plateforme (à confirmer dans `:platform:core:identity`).

## 11. Non-fonctionnel

- Disponibilité cible : 99,5% (heures ouvrées 8h-22h Africa/Casablanca), 99,0% globale.
- Latence cible : P95 < 400 ms pour la recherche, < 800 ms pour la création de booking.
- Scale attendu V1 : 500 tenants, 50 000 clients actifs/mois, 200 000 bookings/an.
- Réseau : optimisation pour 3G/4G Maroc, payload JSON < 200 Ko par écran, images responsive.

## 12. Découpage agent

Voir `work-packages/` pour la liste détaillée. Vue d'ensemble :

| Vague | Périmètre | Dépendances |
|---|---|---|
| 1 | [wp-01-platform-skeleton](work-packages/wp-01-platform-skeleton.wp.md) — squelette web app, auth, i18n, tenant resolver | — |
| 2 | [wp-02-discovery](work-packages/wp-02-discovery.wp.md) — home, search, salon-detail, service-list | wp-01 |
| 3 | [wp-03-booking-customer](work-packages/wp-03-booking-customer.wp.md) — parcours réservation client + compte client | wp-01, wp-02 |
| 4 | [wp-04-pro-core](work-packages/wp-04-pro-core.wp.md) — dashboard, agenda, bookings pro | wp-01, wp-03 |
| 5 | [wp-05-pro-config](work-packages/wp-05-pro-config.wp.md) — services, staff, settings, loyalty | wp-01, wp-04 |
| 6 | [wp-06-admin](work-packages/wp-06-admin.wp.md) — admin Nafura (tenants, overview) | wp-01 |

## 13. Open questions

- Mini-réseau de salons (2-3 salons sous un même propriétaire) : un seul tenant avec entités `salon` enfants, ou un tenant par salon ? Décision V1 retenue : **un tenant = un seul salon physique** ; multi-salon repoussé en V2. À confirmer avec produit.
- Provider SMS MA : aucune décision contractuelle prise ; on suppose abstraction prête. À arbitrer avant la mise en prod du flux rappel J-1.
- Maps : OSM vs Google. Décision provisoire : OSM via Leaflet pour V1, fallback géocodage manuel (le salon saisit lat/lng à l'inscription si l'auto-géocodage échoue).
- Paiement CMI : sandbox disponible ? Modalités de réversibilité (capture vs autorisation) ? À clarifier avec l'équipe finance Nafura.
- Programme de fidélité : règles communes plateforme ou personnalisables par salon ? Hypothèse V1 : règle simple = 1 point par 10 MAD dépensés et marqués honorés, conversion à la main du salon (pas d'auto-application en V1). À confirmer.
- Multi-staff par RDV (ex : couleur + brushing par 2 personnes) : repoussé V2. V1 = 1 staff par booking.
- Annulation gratuite : fenêtre par défaut 4h avant le RDV (modifiable par le salon dans ses paramètres). À valider.
