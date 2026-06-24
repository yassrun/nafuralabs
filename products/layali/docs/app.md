---
specVersion: 1
kind: app
appId: layali
name: Layali
status: review
language: fr
tenancy: multi
targetPlatforms: [mobile, web]
businessCode:
  backendRoot: products/layali/backend
  webRoot: products/layali/web
  mobileRoot: products/layali/mobile
abstractions:
  required:
    - :platform:core:tenancy
    - :platform:core:authorization
    - :platform:core:identity
    - "@platform/core/components"
    - "@platform/core/i18n"
  missing:
    - :platform:integrations:realtime
    - :platform:integrations:qr
    - "@platform/core/realtime"
sourceDocs:
  - brief: docs/briefs/layali-v1.md
---

# Layali

## 1. Vision

Layali est la plateforme marocaine multi-tenant de découverte et de réservation pour les sorties nightlife et social dining : pub, resto à ambiance, night club, cabaret. Côté client : trouver une bonne soirée, comprendre les conditions d'accès, réserver une table, une entrée, un comptoir ou acheter un billet, payer en ligne si requis, puis présenter un QR ou être retrouvé rapidement à l'entrée. Côté professionnel : gérer un lieu, ses soirées spéciales, ses règles d'accès, sa billetterie et son contrôle d'accès.

## 2. Personas

### 2.1 Client (CUSTOMER)
- Profil : majeur (18+), francophone ou arabophone, urbain, sortie hebdomadaire ou ponctuelle (anniversaires, soirées entre amis, dîner festif).
- Contexte d'usage : mobile principalement, en planification (ce soir, ce week-end) ou en groupe.
- Attentes : voir l'ambiance avant de s'engager, comprendre les règles d'accès du soir, payer en ligne en MAD si nécessaire, recevoir une confirmation claire, retrouver ses bookings/tickets facilement.

### 2.2 Propriétaire (OWNER)
- Profil : exploitant d'un ou plusieurs venues (pub, resto à ambiance, club, cabaret).
- Contexte d'usage : web desktop pour configuration, mobile pour suivi soirée.
- Attentes : configurer son lieu, ses soirées spéciales, ses règles d'accès, fixer prix et capacités, suivre le CA en temps réel.

### 2.3 Manager (ADMIN)
- Profil : responsable opérationnel d'une soirée pour un venue donné.
- Contexte d'usage : back-office venue, jour J et veille.
- Attentes : valider/refuser des bookings, gérer la guest list, gérer les invitations VIP, fermer la billetterie en cas de sold-out, agir sur l'état d'une soirée.

### 2.4 Hôte/Hôtesse (HOST)
- Profil : personnel à l'entrée du lieu pendant la soirée.
- Contexte d'usage : tablette ou téléphone, plein écran, parfois en connexion instable.
- Attentes : scanner un QR très rapidement, rechercher par nom ou téléphone si besoin, voir un retour visuel clair (vert/rouge), pouvoir continuer en mode dégradé.

### 2.5 Bar Manager (BAR_MANAGER)
- Profil : responsable bar / service, lié à une table.
- Contexte d'usage : V2 prévu (commandes liées aux tables). V1 : lecture seule des bookings table et comptoir.
- Attentes : voir les accès confirmés, les tables occupées et les minima de consommation.

### 2.6 Admin plateforme Nafura (PLATFORM_ADMIN)
- Profil : équipe Nafura.
- Contexte d'usage : back-office plateforme transverse.
- Attentes : approuver/suspendre des venues, voir des stats globales, intervenir sur incidents.

## 3. Rôles applicatifs

| Rôle | Description | Périmètre | Permissions principales |
|---|---|---|---|
| CUSTOMER | Client final | utilisateur | `venue.read`, `event.read`, `booking.create-self`, `booking.read-self`, `ticket.create-self`, `ticket.read-self`, `review.create-self` |
| OWNER | Propriétaire d'un venue | tenant (venue) | `venue.*`, `event.*`, `table.*`, `booking.read-tenant`, `booking.refund`, `ticket.read-tenant`, `ticket.refund`, `review.moderate`, `payment.read-tenant`, `membership.read-tenant`, `membership.approve-tenant`, `membership.reject-tenant` |
| ADMIN | Manager opérationnel | tenant (venue) | `event.*`, `table.read`, `booking.read-tenant`, `booking.update`, `ticket.read-tenant`, `checkin.*`, `review.moderate`, `membership.read-tenant` |
| HOST | Hôte à l'entrée | tenant (venue) | `checkin.read`, `checkin.scan` |
| BAR_MANAGER | Bar / service | tenant (venue) | `booking.read-tenant`, `table.read` |
| PLATFORM_ADMIN | Admin Nafura | plateforme | `tenant.*`, `venue.read-all`, `payment.read-all`, `event.read-all`, `membership.read-all`, `membership.approve-all`, `membership.reject-all` |

Les permissions complètes sont déclarées dans le manifest runtime Nafura (`naf/src/spec/applications/layali/layali.application.json`). Cette section sert d'intention pour les agents.

## 4. Tenancy et identité

- Mode tenancy : multi-tenant.
- Définition d'un tenant : un tenant = un `venue`. Une chaîne possédant plusieurs venues a un tenant par venue. Les rôles `OWNER` peuvent être attachés à plusieurs tenants via un compte propriétaire racine résolu par `:platform:core:identity`.
- Résolution du tenant côté web pro : sous-domaine `<venue-slug>.pro.layali.ma` ou header `X-Tenant-Id` (slug) en mode mock.
- Résolution du tenant côté web client : non requis pour la découverte publique (`auth: optional`). Pour les actions personnelles (mes bookings, mes tickets), le tenant pertinent est implicite (venue de la ressource).
- Auth : Keycloak realm `nafura` ; clients `layali-web-customer`, `layali-web-pro`, `layali-web-admin`, `layali-backend`.
- OTP téléphone (canal SMS) en plus du login email/mot de passe pour les clients.

## 5. Zones et navigation globale

Zones :
- `discovery` : public ou semi-public (home, recherche, fiches venue/event).
- `booking` : réservation d'accès (table, guest list, comptoir, hybride ; auth requise au moment de payer ou confirmer selon le cas).
- `ticket` : achat billet événement (auth requise au moment de payer).
- `account` : compte client (mes bookings, mes tickets, profil).
- `pro` : back-office venue (OWNER, ADMIN, HOST, BAR_MANAGER).
- `admin` : back-office plateforme (PLATFORM_ADMIN).

Routes principales : voir [navigation.md](navigation.md).

## 6. Conventions globales

- Locales supportées : `fr` (default), `ar` (RTL), `en`.
- Devise : `MAD` (Dirham marocain), affichage avec espace insécable, ex. `350 MAD`.
- Fuseau horaire : `Africa/Casablanca` côté serveur et affichage utilisateur (pas de DST).
- Format des dates : `dd/MM/yyyy HH:mm` en `fr`, `MM/dd/yyyy hh:mm a` en `en`, format arabe ISO en `ar`.
- Numérotation téléphone : E.164, focus `+212`.
- Mock API : voir [mock-api.md](mock-api.md).
- Préfixes i18n : `layali.<screen>.*` ou `layali.common.*`.
- Tenant context côté API : header `X-Tenant-Id: <venue-slug>` (obligatoire sur les routes pro et sur certaines routes client liées à un venue).
- Identité visuelle : palette et tokens dans [brand.md](brand.md) ; implémentation CSS dans `layali/mobile/src/brand/tokens.css`.

## 7. Domaines métier (modules backend)

| Domaine | Responsabilité | Module Gradle |
|---|---|---|
| venue | Fiche lieu, photos, ambiance, horaires, statut public | `:domains:layali:venue` |
| event | Événements ou soirées spéciales, publication, capacités, règles de la nuit | `:domains:layali:event` |
| table | Plan de salle, tables, capacités, minimum spend, état | `:domains:layali:table` |
| booking | Réservation d'accès, créneau d'arrivée, validation, acompte, occasion client | `:domains:layali:booking` |
| ticket | Billet événement, catégories, QR, refund | `:domains:layali:ticket` |
| customer | Profil client, préférences, historique | `:domains:layali:customer` |
| payment | Orchestration paiement (adapters CMI/Stripe via plateforme) | `:domains:layali:payment` |
| checkin | Vérification QR à la porte, anti-double-scan, broadcast | `:domains:layali:checkin` |
| review | Avis post-soirée, modération | `:domains:layali:review` |

## 8. Abstractions et libs Nafura à utiliser

### Existantes (à utiliser tel quel)
- `:platform:core:tenancy` : résolution tenant, scoping JPA.
- `:platform:core:authorization` : guards de permission `<domain>.<verb>`.
- `:platform:core:identity` : Keycloak realm, refresh token, current user.
- `:platform:integrations:payment` : adapters CMI (par défaut), Stripe (fallback), interface `PaymentInitiation` + webhook `PaymentEvent`.
- `:platform:integrations:sms` : envoi SMS transactionnel (rappel J-0, OTP).
- `:platform:integrations:email` : envoi email transactionnel (confirmation booking/ticket, ICS).
- `:platform:integrations:storage` : MinIO (photos venue, photos event, plans de salle).
- `@platform/core/components` : composants Angular standardisés (form, table, dialog, pagination cursor).
- `@platform/core/i18n` : i18n FR/AR/EN avec RTL.

### Manquantes (à créer avant ou pendant le développement)
- `:platform:integrations:realtime` : abstraction WebSocket + STOMP côté backend, gestion topics scoped tenant, broker auth Keycloak. Status `missing` — à créer en `wp-01`.
- `:platform:integrations:qr` : génération QR signé (HMAC + key rotation), parsing, verify. Status `missing` — à créer en `wp-01`.
- `@platform/core/realtime` : client Angular STOMP avec gestion reconnect + topic auto-subscribe. Status `missing` — à créer en `wp-01`.

## 9. Intégrations externes

- Paiement : CMI (banques marocaines, default), Stripe (carte internationale, fallback). Via `:platform:integrations:payment`.
- SMS : opérateur marocain (Maroc Telecom / Orange / Inwi) via gateway plateforme. Rappels J-0 et OTP.
- Email : SMTP plateforme, templates par défaut + override `layali`.
- Venue catalog : service interne partagé `venue-catalog` pour bootstrap et refresh des fiches venues depuis des sources externes, sans coupler Layali à Google Places.
- Maps : aucun moteur cartographique embarqué en V1 ; les venues affichent un lien externe Google Maps stocké en `mapUrl`.
- Storage : MinIO bucket `layali-media` (photos venue/event, plans de salle).
- Autres : pas de marketing automation, pas de programme fidélité V1.

## 10. Données sensibles et conformité

- PII : nom, prénom, email, téléphone, ville. CIN/passeport non collectés en V1.
- RGPD / loi 09-08 : consentement explicite à l'inscription, droit d'accès et de suppression via support. Bannière cookies basique.
- Rétention : bookings/tickets archivés 24 mois ; logs check-in 6 mois ; webhooks paiement 36 mois.
- Carte bancaire : jamais stockée côté Layali — tokenisation chez l'adapter (CMI/Stripe).
- Public 18+ : disclaimer à l'inscription et à l'achat. Pas de vérification d'âge stricte en V1.

## 11. Non-fonctionnel

- Disponibilité cible : 99.5% côté client public, 99.9% sur le scanner door check-in pendant les soirées (window samedi 19h–04h).
- Latence cible : p95 < 250 ms pour les endpoints de découverte ; p95 < 150 ms pour `POST /checkin/verify`.
- Scale attendu V1 : 200 venues, 5 000 événements/an, 100 000 tickets/an, pics samedi 20h–23h.
- Réseau : door check-in doit fonctionner en mode offline minimal (queue locale 50 scans, resync à reconnexion).
- Realtime : broker STOMP unique multi-tenant ; chaque topic scoped par `tenantId`.

## 12. Découpage agent

Voir `work-packages/` pour le détail. Vue d'ensemble :

| Vague | Périmètre | Dépendances |
|---|---|---|
| 1 | wp-01 squelette web + auth + i18n + tenant resolver + WebSocket bootstrap + abstractions QR/realtime manquantes | aucune |
| 1 | wp-07 bootstrap des venues depuis le catalogue partagé | wp-01 + venue-catalog/wp-02 |
| 2 | wp-02 discovery (home, search, venue/event detail) | wp-01 |
| 3 | wp-03 booking customer (table booking + ticket buy + mes bookings/tickets) | wp-01, wp-02 |
| 4 | wp-04 pro core (dashboard, events, tables) | wp-01 |
| 5 | wp-05 pro ops (bookings, tickets list, door check-in, reviews) | wp-03, wp-04 |
| 6 | wp-06 admin Nafura (tenants, overview) | wp-01 |

## 13. Open questions

- Faut-il modéliser un compte propriétaire racine (multi-venues) dès V1 ou attendre V2 ? Décision provisoire : oui, modèle préparé via `:platform:core:identity`, UI simplifiée V1.
- Le bar manager doit-il voir le détail des minima de consommation par table en V1, ou juste l'occupation ? Décision provisoire : lecture seule des bookings + minima visibles.
- La guest list doit-elle être validée manuellement par défaut, ou configurable en auto-confirmation selon le lieu ?
- Le comptoir / bar spot doit-il être modélisé comme une ressource nommée ou un simple quota ?
- Le booking anniversaire doit-il exposer des extras structurés en V1 ou juste une occasion + notes enrichies ?
- Stratégie de refund : automatique (CMI) ou semi-automatique (manuel + ticket de support) ? Décision provisoire : manuel V1 via `pro-tickets-list`.
- Multi-venues par compte propriétaire dans la même UI : sélecteur en haut à droite ou sous-domaines distincts ? Décision provisoire : sous-domaines distincts pour V1 + sélecteur dans la V2.
- Vérification d'âge (18+) : self-declaration ou KYC léger ? Décision provisoire : self-declaration V1.
