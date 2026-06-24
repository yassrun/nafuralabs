# Discovery Wireframes (Mobile)

## 1) home

```
+------------------------------------------------+
| Status bar                                     |
| Header: logo Layali + icon search + profile    |
|------------------------------------------------|
| Hero title: Trouver votre acces ce soir        |
| Chips: Tonight | Guest list | Comptoir         |
|------------------------------------------------|
| Section Access modes                           |
| [Table] [Guest list] [Comptoir] [Ticket nights]|
|------------------------------------------------|
| Section Venues populaires                      |
| [Card venue] image | name | tags access        |
| mini CTA: table | guest list | comptoir        |
| [Card venue] image | name | tags access        |
|------------------------------------------------|
| Section Events a venir                         |
| [Event card] poster | access tags | CTA stack  |
| [Event card] poster | access tags | CTA stack  |
|------------------------------------------------|
| Bottom nav: Home | Venues | Events | Account   |
+------------------------------------------------+
```

Actions:
- Tap card venue -> venue-detail
- Tap card event -> event-detail
- Tap chips -> filtered search
- Tap access mode chip -> prefiltered search by access mode

States:
- loading skeleton list
- empty (no venue/event)
- error retry
- success

## 2) venue-search

```
+------------------------------------------------+
| Header back + Search input                     |
| Filters row: city | mood | access | budget     |
|------------------------------------------------|
| Result count                                   |
| [Venue card] cover + rating + access chips     |
| mini CTA: table | guest list | comptoir        |
| [Venue card] cover + rating + featured night   |
|------------------------------------------------|
| Sticky CTA map/list toggle                     |
+------------------------------------------------+
```

Actions:
- Change filters
- Open venue-detail
- Toggle map/list

## 3) venue-detail

```
+------------------------------------------------+
| Header back + share                            |
| Gallery hero image                             |
| Venue title + tags + address                   |
|------------------------------------------------|
| Access chips: table | guest list | comptoir    |
| Tonight rules card: QR or lookup | dress code  |
|------------------------------------------------|
| Tabs: Events | Tables | Reviews                |
|------------------------------------------------|
| Events tab default:
| [Event card] title + access modes + price from |
| [Event card] title + access modes + price from |
|------------------------------------------------|
| Table preview + minimum spend hint             |
| Counter preview + sunset spots                 |
|------------------------------------------------|
| Sticky CTA primary: mode prioritaire du soir   |
| CTA secondary: Guest list                      |
| CTA tertiary: Comptoir / Ticket                |
+------------------------------------------------+
```

Actions:
- CTA booking table -> table-booking-create
- CTA ticket -> event-detail or ticket-buy
- Tab switch

## 4) event-list

```
+------------------------------------------------+
| Header title Events + search                   |
| Chips: tonight | ticket | table | guest list   |
|------------------------------------------------|
| [Event card] poster + date + venue             |
| access chips + special night badge             |
| mini CTA: ticket | table | guest list          |
| [Event card] poster + ticket required badge    |
|------------------------------------------------|
| Infinite scroll loader                          |
+------------------------------------------------+
```

Actions:
- Tap event card -> event-detail
- Filter chips

## 5) event-detail

```
+------------------------------------------------+
| Header back + share                            |
| Event poster                                   |
| Event title + date + venue + age 18+           |
|------------------------------------------------|
| Info blocks:
| - lineup / schedule                            |
| - entry policy (ticket required? lookup?)      |
| - access modes enabled tonight                 |
| - ticket categories with remaining             |
| - map link                                     |
|------------------------------------------------|
| Sticky CTA primary: access prioritaire         |
| CTA secondary: autres modes du soir            |
+------------------------------------------------+
```

Actions:
- Buy ticket -> ticket-buy
- Book table -> table-booking-create

States common to all discovery screens:
- loading skeleton
- empty no data
- error with retry
- success
