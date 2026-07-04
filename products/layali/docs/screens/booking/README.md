# Zone booking — specs web vs mobile P1

## Cible web (P2/P3)

Neuf écrans distincts par mode d’accès :

| Mode | Create | Review | Confirm |
|------|--------|--------|---------|
| TABLE | [table-booking-create](table-booking-create.screen.md) | — (payment) | [table-booking-confirm](table-booking-confirm.screen.md) |
| GUEST_LIST | [guest-list-booking-create](guest-list-booking-create.screen.md) | [guest-list-booking-review](guest-list-booking-review.screen.md) | [guest-list-booking-confirm](guest-list-booking-confirm.screen.md) |
| COUNTER | [counter-booking-create](counter-booking-create.screen.md) | [counter-booking-review](counter-booking-review.screen.md) | [counter-booking-confirm](counter-booking-confirm.screen.md) |

Paiement table : [table-booking-payment](table-booking-payment.screen.md).

Routes : [navigation.md](../../navigation.md) §3.

## Implémentation mobile P1 (décision actuelle)

**Trois écrans unifiés** pilotés par `booking.accessMode` (`TABLE` | `GUEST_LIST` | `COUNTER`) :

| Mobile `Screen` | Rôle | Specs web couverts |
|-----------------|------|-------------------|
| `booking-create` | étape 1 — formulaire | `*-booking-create` |
| `booking-payment` | étape 2 — paiement mock | `table-booking-payment` (+ paiement guest list si applicable) |
| `booking-confirm` | étape 3 — confirmation | `*-booking-confirm` |

**Écarts connus (wp-p1-01)** :

- Pas d’écran `guest-list-booking-review` dédié avant confirm si approval `MANUAL`
- Pas d’écran `counter-booking-review`

Cartographie détaillée : [mobile-map.md](../../mobile-map.md).
