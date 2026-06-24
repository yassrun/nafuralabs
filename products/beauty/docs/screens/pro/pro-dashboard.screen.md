---
specVersion: 1
kind: screen
appId: beauty
screenId: pro-dashboard
name: Tableau de bord (pro)
status: stable
route: /pro
layout: pro-layout
zone: pro
roles: [OWNER, ADMIN, STAFF]
auth: required
flowRefs: []
apiRefs:
  - ../../api/bookings.api.md
  - ../../api/salons.api.md
  - ../../api/reviews.api.md
abstractions:
  components:
    - "@platform/core/i18n"
---

# Tableau de bord (pro)

## Intent

Vue d'accueil du back-office salon : KPIs du jour, RDV imminents, alertes, raccourcis vers les sections principales. Adapté au rôle (OWNER/ADMIN voient tout, STAFF voit ses RDV).

## Route et accès

- Route : `/pro`
- Layout : `pro-layout`
- Auth : required
- Rôles : OWNER, ADMIN (full), STAFF (vue restreinte ses RDV)
- Tenant requis : oui

## Données nécessaires

| Donnée | Source | Quand chargée | Mise en cache |
|---|---|---|---|
| Agenda du jour | [GET /api/v1/pro/bookings/agenda?view=DAY&date=today](../../api/bookings.api.md#GET-/api/v1/pro/bookings/agenda) | onInit | mémoire 60s |
| Stats du jour (CA, RDV, no-show) | [GET /api/v1/salons/:id/metrics?period=today](../../api/salons.api.md) | onInit | mémoire 60s |
| Avis non lus | [GET /api/v1/reviews?salonId=&unread=true&pageSize=5](../../api/reviews.api.md) | onInit | mémoire 60s |

## Mock API consommée

- `GET /api/v1/pro/bookings/agenda?view=DAY&date=today`
- `GET /api/v1/salons/:id/metrics?period=today`
- `GET /api/v1/reviews?salonId=&unread=true&pageSize=5`

## États

### loading
- Skeleton 4 KPI + liste agenda.

### empty
- Aucun RDV aujourd'hui : illustration neutre + lien "Voir l'agenda".

### error
- 401 → login pro. 503 → bouton retry.

### success
- Bandeau date + nom salon + bouton "Aujourd'hui".
- 4 KPI cards : RDV du jour, CA estimé, No-shows, Taux de remplissage.
- Section "Prochains RDV" : 5 prochains, avec heure, service, client, staff (clic → détail).
- Section "Avis récents" : 3 derniers avis non lus, étoiles, lien "Voir tout".
- Section "Alertes" : staff absent, salon non publié, paiement provider down.
- Raccourcis : grille 4 icônes (Agenda, Services, Staff, Paramètres).

## Actions utilisateur

| Action | Déclencheur | Résultat |
|---|---|---|
| Voir agenda | clic ou raccourci | nav `/pro/agenda` |
| Détail RDV | clic ligne | nav `/pro/bookings/:bookingId` |
| Voir avis | clic | nav `/pro/reviews` |
| Raccourcis | clic | nav section |
| Refresh manuel | bouton | refetch toutes les sections |

## Composants utilisés

| Composant | Source | Rôle |
|---|---|---|
| layout-pro | `@platform/core/layouts/pro` | sidebar + topbar |

## Composants internes (non réutilisables)

- `<KpiCard>` : carte KPI avec valeur, label, sparkline optionnelle.
- `<UpcomingBookingItem>` : ligne RDV compacte.
- `<ProShortcutGrid>` : grille raccourcis.

## Validations et règles métier

- STAFF : agenda et "Prochains RDV" filtrés sur ses propres RDV ; KPIs et avis cachés.
- CA estimé : somme `serviceSnapshot.priceMinor` des bookings `PENDING_PAYMENT|CONFIRMED|ARRIVED|COMPLETED` du jour.
- Taux remplissage : `(nbBookings * avgDuration) / heuresOuvertures`.
- Polling 60s sur agenda + KPIs (cohérence avec liste pro).

## i18n

- Clés : `beauty.proDashboard.title`, `beauty.proDashboard.kpi.bookings`, `beauty.proDashboard.kpi.revenue`, `beauty.proDashboard.kpi.noShows`, `beauty.proDashboard.kpi.occupancy`, `beauty.proDashboard.upcoming`, `beauty.proDashboard.reviews.recent`, `beauty.proDashboard.alerts`, `beauty.proDashboard.shortcuts`.

## Critères d'acceptation

- [ ] L'écran rend les 4 états.
- [ ] STAFF voit uniquement son périmètre (vérifié par guard et UI).
- [ ] Le bouton "Aujourd'hui" recale sur la date du jour si on a navigué ailleurs.
- [ ] Une 423 `tenant_suspended` affiche bannière + désactive raccourcis mutateurs.
- [ ] Polling 60s fonctionne sans casser le scroll.
- [ ] Aucun appel direct à un endpoint hors `apiRefs`.

## Open questions

- Graphique CA 7 jours : V2.
- Customisation du dashboard (réorganiser sections) : V2.
- Push notifications à l'arrivée d'un nouveau RDV : V2.
