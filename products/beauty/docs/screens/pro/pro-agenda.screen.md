---
specVersion: 1
kind: screen
appId: beauty
screenId: pro-agenda
name: Agenda (pro)
status: stable
phase: P1
p1MobileId: manager-agenda
p1Impl: mock
route: /pro/agenda
layout: pro-layout
zone: pro
roles: [OWNER, ADMIN, STAFF]
auth: required
flowRefs: []
apiRefs:
  - ../../api/bookings.api.md
  - ../../api/staff.api.md
abstractions:
  components:
    - "@platform/core/components/calendar-week"
    - "@platform/core/i18n"
---

# Agenda (pro)

## P1 - Client Walkthrough

| Champ | Valeur |
|-------|--------|
| Mobile `Screen` | `â€”` |
| Impl | none |
| Fixtures | [fixtures.md](../../fixtures.md) |
| Cartographie | [mobile-map.md](../../mobile-map.md) |

> En P1 : **ne pas** utiliser `apiRefs` / composants `@platform/` comme brief agent - mock local uniquement. *(wp-p1-03 stub)*

## Intent

Vue agenda jour/semaine multi-staffs avec drag-replan, création rapide de RDV interne (walk-in), changement de statut depuis l'agenda.

## Route et accès

- Route : `/pro/agenda`
- Layout : `pro-layout`
- Auth : required
- Rôles : OWNER, ADMIN (full), STAFF (filtré sur soi)
- Tenant requis : oui
- Query : `view` (`DAY`/`WEEK`), `date` (yyyy-MM-dd), `staffIds` (csv)

## Données nécessaires

| Donnée | Source | Quand chargée | Mise en cache |
|---|---|---|---|
| Agenda | [GET /api/v1/pro/bookings/agenda](../../api/bookings.api.md#GET-/api/v1/pro/bookings/agenda) | onInit + onDateChange + onViewChange | mémoire 30s |
| Liste staff | [GET /api/v1/staff](../../api/staff.api.md) | onInit | session 5 min |

## Mock API consommée

- `GET /api/v1/pro/bookings/agenda?view=&date=&staffIds=`
- `PATCH /api/v1/pro/bookings/:bookingId` (drag-replan staffId/startAt)
- `PATCH /api/v1/pro/bookings/:bookingId/status` (mark arrived/completed/no-show)
- `POST /api/v1/bookings` (walk-in interne)

## États

### loading
- Skeleton grille horaire.

### empty
- "Aucun RDV ce jour" + bouton "Nouveau RDV" walk-in.

### error
- 401 → login. 503 → retry.

### success
- Header : sélecteur date, switch DAY/WEEK, filtres staff (chips), bouton "+ Nouveau RDV".
- Grille : colonnes = staffs, lignes = heures (15 min). Blocs RDV positionnés sur leur range.
- Légende : couleurs par statut (PENDING_PAYMENT=jaune, CONFIRMED=bleu, ARRIVED=vert, COMPLETED=gris, CANCELLED=rouge tracé, NO_SHOW=orange).
- Zones travail staff teintées ; zones congé hachurées non-cliquables.
- Drag : glisser un RDV pour replanifier (autre staff ou autre heure).

## Actions utilisateur

| Action | Déclencheur | Résultat |
|---|---|---|
| Cliquer un RDV | tap | drawer détail avec actions |
| Drag-replan | drag end | `PATCH /bookings/:id` avec confirmation dialog |
| Mark arrived/completed | bouton dans drawer | `PATCH /status` |
| Walk-in | bouton "+" | dialog création RDV (customer ad-hoc) |
| Changer date | sélecteur | refetch |
| Changer vue | switch | refetch (range différent) |
| Filtrer staff | chips | re-render sans refetch |

## Composants utilisés

| Composant | Source | Rôle |
|---|---|---|
| calendar-week | `@platform/core/components/calendar-week` | grille horaire multi-colonne |

## Composants internes (non réutilisables)

- `<AgendaBookingBlock>` : bloc RDV avec drag.
- `<AgendaToolbar>` : date picker + view switch + filtres.
- `<WalkInDialog>` : création walk-in (téléphone customer + service + staff + créneau).

## Validations et règles métier

- Drag-replan : vérifie dispo côté backend (`PATCH /bookings/:id` valide chevauchements et horaires staff).
- Walk-in : crée un booking en `CONFIRMED` (paiement cash assumé sauf option pré-payée).
- STAFF : ne peut drag que ses propres RDV ; pas de filtre staff visible.
- Vue DAY : grille fine 15 min. Vue WEEK : grille agrégée 1h.
- Conflits visuels (chevauchement même staff) : bordure rouge en attendant résolution.

## i18n

- Clés : `beauty.proAgenda.title`, `beauty.proAgenda.view.day`, `beauty.proAgenda.view.week`, `beauty.proAgenda.filter.staff`, `beauty.proAgenda.cta.walkin`, `beauty.proAgenda.status.<status>`, `beauty.proAgenda.dialog.replan.title`, `beauty.proAgenda.dialog.walkin.title`.

## Critères d'acceptation

- [ ] L'écran rend les 4 états.
- [ ] Le drag-replan met à jour côté backend et UI sans flicker.
- [ ] Un conflit (créneau pris) au PATCH retourne 409 et restaure visuellement le bloc.
- [ ] STAFF ne voit que ses propres RDV (test guard).
- [ ] La grille reste fluide à 100+ RDV par jour.
- [ ] Aucun appel direct à un endpoint hors `apiRefs`.

## Open questions

- Multi-sélection pour bulk actions (annuler 5 RDV) : V2.
- Print de l'agenda du jour : V2.
- Couleurs personnalisables par staff : V2.
