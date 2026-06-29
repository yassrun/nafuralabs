---
specVersion: 1
kind: screen
appId: beauty
screenId: booking-create
name: Réserver un RDV
status: stable
phase: P1
p1MobileId: booking-select-time
p1Impl: mock
route: /salons/:slug/book
layout: booking-layout
zone: booking
roles: [CUSTOMER]
auth: optional
flowRefs:
  - ../../flows/customer-booking.flow.md
apiRefs:
  - ../../api/salons.api.md
  - ../../api/services.api.md
  - ../../api/staff.api.md
  - ../../api/bookings.api.md
abstractions:
  components:
    - "@platform/core/components/time-slot-picker"
    - "@platform/core/components/calendar-week"
    - "@platform/core/components/photo-gallery"
    - "@platform/core/i18n"
---

# Réserver un RDV

## P1 - Client Walkthrough

| Champ | Valeur |
|-------|--------|
| Mobile `Screen` | `booking-select-time` |
| Impl | partial |
| Fixtures | [fixtures.md](../../fixtures.md) |
| Cartographie | [mobile-map.md](../../mobile-map.md) |

> En P1 : **ne pas** utiliser `apiRefs` / composants `@platform/` comme brief agent - mock local uniquement. *(staff/paiement incomplets)*

## Intent

Wizard mobile-first pour réserver un RDV : choisir un service, un staff (ou "Indifférent"), une date, un créneau. Stepper 1/3 visible.

## Route et accès

- Route : `/salons/:slug/book`
- Layout : `booking-layout` (stepper 1-2-3, pas de footer)
- Auth : optional (forcée au submit)
- Rôles autorisés : tous (CUSTOMER au submit)
- Tenant requis : non (résolu par slug)
- Query params optionnels : `serviceId`, `staffId`

## Données nécessaires

| Donnée | Source | Quand chargée | Mise en cache |
|---|---|---|---|
| Fiche salon | [GET /api/v1/salons/:slug](../../api/salons.api.md#GET-/api/v1/salons/:slug) | onInit | session 5 min |
| Catalogue services | [GET /api/v1/salons/:slug/services](../../api/services.api.md#GET-/api/v1/salons/:slug/services) | onInit | session |
| Liste staff | [GET /api/v1/salons/:slug/staff](../../api/staff.api.md#GET-/api/v1/salons/:slug/staff) | lazy au step 2 | session |
| Créneaux disponibles | [GET /api/v1/salons/:slug/availability](../../api/bookings.api.md#GET-/api/v1/salons/:slug/availability) | au step 3, refetch sur changement service/staff/date | mémoire (clé = service+staff+date) |

## Mock API consommée

- `GET /api/v1/salons/:slug`
- `GET /api/v1/salons/:slug/services`
- `GET /api/v1/salons/:slug/staff`
- `GET /api/v1/salons/:slug/availability?serviceId=&staffId=&date=&daysAhead=7`
- `POST /api/v1/bookings` (au submit final)

## États

### loading
- Step 1 : skeleton catégories + services.
- Step 2 : skeleton staffs.
- Step 3 : skeleton créneaux 7 jours.

### empty
- Aucun service publié : "Ce salon n'accepte pas encore de réservation en ligne".
- Aucun créneau dispo dans les 14 prochains jours : "Pas de disponibilité, contactez le salon" + bouton tel.

### error
- Erreur réseau : message + bouton "Réessayer" en gardant la sélection.
- 409 au submit (créneau pris pendant que l'utilisateur saisissait) : message + retour step 3 avec créneaux refreshés.

### success
- Step 1 (Service) : groupes par catégorie, click → sélectionné, bouton "Continuer" actif.
- Step 2 (Staff) : grille avec avatars staff filtrés sur le service, ou option "Indifférent" (premier dispo).
- Step 3 (Créneau) : calendrier 7 jours horizontal scrollable, grille créneaux pour la date sélectionnée. Sticky CTA bas "Continuer".
- Pré-sélection auto via `serviceId` et `staffId` en query params (skip step si tous fournis).

## Actions utilisateur

| Action | Déclencheur | Résultat |
|---|---|---|
| Choisir service | tap card | sélection + auto-advance step 2 |
| Choisir staff | tap avatar | sélection + auto-advance step 3 |
| Choisir une date | scroll horizontal | refetch availability |
| Choisir un créneau | tap créneau | sélection + CTA actif |
| Retour | bouton chevron header | step précédent (conserve sélection) |
| Continuer | bouton sticky | nav `/booking/:bookingId/payment` (après POST /bookings PENDING_PAYMENT) ou `/booking/:bookingId/confirm` (si cash) |
| Connexion forcée | au tap "Continuer" si non auth | dialog "Connectez-vous pour réserver" → `/login?redirect=...` |
| Changer mode paiement | toggle | `NONE_CASH_ON_SITE` / `ONLINE_CMI` / `ONLINE_STRIPE` |

## Composants utilisés

| Composant | Source | Rôle dans l'écran |
|---|---|---|
| time-slot-picker | `@platform/core/components/time-slot-picker` | grille créneaux disponibles |
| calendar-week | `@platform/core/components/calendar-week` | calendrier horizontal 7-14 jours |
| photo-gallery (mini) | `@platform/core/components/photo-gallery` | mini photos service |

## Composants internes (non réutilisables)

- `<BookingStepper>` : 3 étapes avec ligne progress.
- `<ServicePickerCard>` : card service compacte.
- `<StaffAvatarChoice>` : avatar + nom + option "Indifférent".
- `<PaymentModeToggle>` : segmented control 3 modes.

## Validations et règles métier

- Date min : aujourd'hui. Date max : aujourd'hui + 30 jours.
- Staff "Indifférent" → première dispo trouvée par le backend ; `staffId` non envoyé au POST.
- Créneau réservé doit appartenir aux horaires d'ouverture salon + horaires de travail staff.
- Buffer après service appliqué pour le calcul `endAt` (visible si > 0).
- Pré-paiement obligatoire si `salon.requireOnlinePayment=true` (toggle désactivé sur `NONE_CASH_ON_SITE`).
- Submit `POST /bookings` avec `Idempotency-Key` pour éviter double-clic.

## i18n

- Clés : `beauty.book.step1.title`, `beauty.book.step2.title`, `beauty.book.step3.title`, `beauty.book.staff.any`, `beauty.book.payment.cash`, `beauty.book.payment.onlineCmi`, `beauty.book.payment.onlineStripe`, `beauty.book.cta.continue`, `beauty.book.empty.noSlots`, `beauty.book.error.slotTaken`, `beauty.book.auth.required`.

## Critères d'acceptation

- [ ] L'écran rend correctement chacun des 4 états sur les 3 steps.
- [ ] La pré-sélection via `serviceId`/`staffId` en query saute les steps correspondants.
- [ ] Le retour entre steps préserve la sélection.
- [ ] L'auth est demandée uniquement au submit final, pas à l'arrivée.
- [ ] Un 409 au POST relance le step 3 avec la liste de créneaux mise à jour.
- [ ] Aucun appel direct à un endpoint hors `apiRefs`.
- [ ] L'option "Indifférent" pour le staff fonctionne (le backend choisit).

## Open questions

- Multi-services (couleur + brushing) : V2 ; en V1 on ne propose pas le combo.
- Préférence langue staff (FR/AR) à filtrer : V2.
- Display "Première fois ici ?" → message d'accueil personnalisé : V2.
