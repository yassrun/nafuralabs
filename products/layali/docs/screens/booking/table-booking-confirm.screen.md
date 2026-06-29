---
specVersion: 1
kind: screen
appId: layali
screenId: table-booking-confirm
name: Confirmation réservation
status: stable
phase: P1
p1MobileId: booking-confirm
p1Impl: mock
route: /venues/:venueSlug/book/confirm/:bookingId
layout: public-shell
zone: booking
roles: [CUSTOMER]
auth: required
flowRefs:
  - customer-table-booking
apiRefs:
  - bookings#GET-/bookings/:id
abstractions:
  components:
    - "@platform/core/components/qr-display"
    - "@platform/core/components/summary-card"
    - "@platform/core/components/ics-download"
  patterns:
    - "booking/confirmation"
---

# Confirmation réservation

## P1 - Client Walkthrough

| Champ | Valeur |
|-------|--------|
| Mobile `Screen` | `booking-confirm` |
| Impl | mock |
| Fixtures | [fixtures.md](../../fixtures.md) |
| Cartographie | [mobile-map.md](../../mobile-map.md) |

> En P1 : **ne pas** utiliser `apiRefs` / composants `@platform/` comme brief agent - mock local uniquement.


## Intent

Étape 3 finale du flow : afficher le récap et le QR de la réservation, proposer ajout au calendrier (ICS) et accès à `Mes réservations`.

## Route et accès

- Route : `/venues/:venueSlug/book/confirm/:bookingId`
- Layout : public-shell
- Auth : required
- Rôles autorisés : CUSTOMER (et le propriétaire du booking)
- Tenant requis : non

## Données nécessaires

| Donnée | Source | Quand chargée | Mise en cache |
|---|---|---|---|
| Booking confirmé | [bookings API](../../api/bookings.api.md) `GET /bookings/:id` | onInit | session 1 min |

## Mock API consommée

- `GET /api/v1/bookings/:id` (retourne `status`, `qrPayload`, `qrSignedUrl`, `arrivalAt`, `tableLabel`, `minimumSpend`)

## États

### loading
- Skeleton récap + placeholder QR.

### empty
- Cas improbable (booking non trouvé après paiement) : message "Récap indisponible, contacter le support".

### error
- 403 si booking d'un autre utilisateur : message + redirection `/me/bookings`.
- 404 : page d'erreur.

### success
- Bannière succès + QR.
- Récap complet (venue, adresse, créneau, table, minimum spend, acompte payé, reste à payer sur place).
- Boutons : "Ajouter au calendrier" (ICS), "Voir mes réservations".

## Actions utilisateur

| Action | Déclencheur | Résultat |
|---|---|---|
| Télécharger ICS | bouton | génère fichier `.ics` côté client |
| Voir mes réservations | bouton | navigation `/me/bookings` |
| Retour accueil | lien | navigation `/` |

## Composants utilisés

| Composant | Source | Rôle dans l'écran |
|---|---|---|
| qr-display | `@platform/core/components/qr-display` | rendu QR signé |
| summary-card | `@platform/core/components/summary-card` | récap |
| ics-download | `@platform/core/components/ics-download` | génération ICS |

## Composants internes (non réutilisables)

- `<NextStepsCard>` : "Présentez ce QR à l'entrée. Le solde sera réglé sur place."

## Validations et règles métier

- Le booking doit être en statut `confirmed` ou `partial-paid`. Sinon, redirection appropriée.
- Le QR `qrPayload` est signé HMAC par `:platform:integrations:qr`. Ne jamais l'altérer côté client.
- L'email de confirmation est envoyé serveur-side ; l'écran indique "Email envoyé à xxx@xxx.com".
- L'utilisateur courant doit être propriétaire du booking (vérif côté backend, vérif simple côté UI via `customerId`).

## Topics realtime

Aucun.

## i18n

- `layali.booking.confirm.title`
- `layali.booking.confirm.next-steps`
- `layali.booking.confirm.cta.calendar`
- `layali.booking.confirm.cta.mybookings`
- `layali.booking.confirm.email-sent`

## Critères d'acceptation

- [ ] Les 4 états sont rendus.
- [ ] Auth requise. Une tentative d'accès en non-authentifié déclenche `/login?returnTo=`.
- [ ] Aucun appel hors `apiRefs`.
- [ ] Un booking appartenant à un autre utilisateur retourne 403 et redirige vers `/me/bookings` sans exposer de détails.
- [ ] Le QR affiché est lisible et conforme au payload signé retourné par l'API (pas de génération côté client à partir d'une URL non signée).
- [ ] Le bouton ICS télécharge un `.ics` valide avec heure locale `Africa/Casablanca`.

## Open questions

- Faut-il proposer un partage WhatsApp du QR ? Décision provisoire : oui via lien `https://wa.me/?text=` (V1).
