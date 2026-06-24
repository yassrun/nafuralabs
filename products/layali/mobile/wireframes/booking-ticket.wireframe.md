# Booking / Ticket Wireframes (Mobile)

Layali mobile supports multiple access modes in V1:
- table booking
- guest list / entry request
- counter / bar spot booking
- ticketed special nights

The mobile booking flow is shared structurally, with content adapting to the chosen access mode.

## 1) access-booking-create

```
+------------------------------------------------+
| Header back + stepper 1/3                      |
| Venue/Event context bar                         |
|------------------------------------------------|
| Section Arrival:
| date picker | time picker | group size stepper |
|------------------------------------------------|
| Access selector card                            |
| [Table] [Guest list] [Comptoir] [Ticketed]     |
|------------------------------------------------|
| Context module (changes by mode):               |
| Table -> floor map + table cards                |
| Guest list -> rules + approval notice           |
| Comptoir -> counter spots / quota               |
|------------------------------------------------|
| Summary card:
| selected access | capacity | min spend / rules |
| occasion selector (birthday, standard, other)  |
| celebrant name if birthday                      |
| notes textarea                                 |
|------------------------------------------------|
| Sticky CTA: Continuer                          |
+------------------------------------------------+
```

Validation notes:
- group size <= selected access capacity when applicable
- no availability -> empty message + change date
- 409 access unavailable -> keep form, reset selected resource
- birthday must stay visible in summary and downstream screens

## 2) access-booking-payment / review

```
+------------------------------------------------+
| Header back + stepper 2/3                      |
| Draft countdown (TTL 15 min)                   |
|------------------------------------------------|
| Booking recap:
| access mode, date/time, group size, rules      |
| birthday / occasion badge if applicable        |
|------------------------------------------------|
| Conditional block:
| payment required -> [CMI] [Stripe]             |
| approval required -> waiting notice            |
| no payment -> immediate confirmation notice    |
|------------------------------------------------|
| Terms checkbox                                 |
|------------------------------------------------|
| Sticky CTA: dynamic                            |
| - Payer l'acompte                              |
| - Envoyer ma demande                           |
| - Confirmer l'acces                            |
+------------------------------------------------+
```

States:
- provider down -> inline error + retry
- payment failed -> return to this screen
- approval pending -> keep going to confirmation with pending state

## 3) access-booking-confirm

```
+------------------------------------------------+
| Header close                                   |
| Success or pending icon                        |
| Title: Acces confirme / En attente             |
| Ref: LAY-xxxx                                  |
|------------------------------------------------|
| QR block (large) if confirmed                  |
| pending panel if manual review                 |
|------------------------------------------------|
| Booking recap                                  |
| access mode + birthday badge + entry hint      |
| email/sms confirmation hint                    |
|------------------------------------------------|
| CTA primary: Mes reservations                  |
| CTA secondary: Retour accueil                  |
+------------------------------------------------+
```

States:
- pending polling -> payment pending panel
- pending approval -> QR hidden, awaiting validation message
- confirmed -> QR visible

## 4) ticket-buy

```
+------------------------------------------------+
| Header back + stepper 1/3                      |
| Event context bar                               |
|------------------------------------------------|
| Ticket categories                               |
| [Standard] [VIP] [Dinner pass]                  |
|------------------------------------------------|
| Quantity stepper                                |
|------------------------------------------------|
| Summary card: category | qty | total            |
|------------------------------------------------|
| Sticky CTA: Continuer                           |
+------------------------------------------------+
```

## 5) ticket-payment

```
+------------------------------------------------+
| Header back + stepper 2/3                      |
| Draft countdown                                 |
|------------------------------------------------|
| Ticket recap                                    |
|------------------------------------------------|
| Payment providers [CMI] [Stripe]               |
|------------------------------------------------|
| Sticky CTA: Payer                               |
+------------------------------------------------+
```

## 6) ticket-confirm

```
+------------------------------------------------+
| Header close                                    |
| Success icon                                    |
| Title: Billets confirmes                        |
| Ref: TKT-xxxx                                   |
|------------------------------------------------|
| QR block / pass block                           |
|------------------------------------------------|
| Ticket recap                                    |
|------------------------------------------------|
| CTA primary: Retour aux evenements              |
| CTA secondary: Accueil                          |
+------------------------------------------------+
```
