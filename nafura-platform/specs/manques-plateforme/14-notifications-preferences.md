# 14 — Notifications : préférences et inbox

## Objectif

Brancher les écrans sur l’API déjà livrée (`NotificationRouter`, `GET|PUT …/notification-preferences`). L’utilisateur coupe ce que l’organisation garde ; l’organisation borne les canaux. L’inbox filtre par événement déclaré. Pas de second modèle, pas de digest, pas de SMS.

## Besoin

- Mes paramètres → Notifications enregistre encore `emailNotifications` / `inAppNotifications` / `digestFrequency` via `/api/v1/user-settings/notifications`. Rien ne les lit. Le routeur ignore ces champs.
- Aucun écran pour `GET|PUT /api/v1/platform/collaboration/notification-preferences` ni `…/organisation`.
- Inbox : vues Non lues / Toutes / Lues livrées ; pas de filtre `source` ; les onglets Material occupent toute la largeur.

## Existant

- Backend : `NotificationPreferenceController`, `NotificationPreferences` (défaut manifeste → organisation → utilisateur ; `mandatory` ignore l’utilisateur). Canaux déclarés : `in_app`, `email`, `sms`. Implémentés : `in_app`, `email`.
- Permission org : `administration.notifications.configure` (`OWNER` `*`, `ORG_ADMIN` `administration.*`).
- Web : `platform/notifications` (inbox, cloche) ; section morte `features/user-settings/sections/notifications` ; Paramètres organisation (`features/app-settings`) : Général / Localisation / Apparence.
- Événements : manifeste BC + `META-INF/nafura/platform/notifications.json`.

## Contrat

Trois lots, chacun livrable seul.

### Lot 1 — Préférences utilisateur

- Remplacer le contenu de Mes paramètres → Notifications par une matrice événement × canal (`in_app`, `email`), alimentée par `GET …/notification-preferences`.
- Un interrupteur = un `PUT` `{ event, channel, enabled }`, puis rechargement de la liste.
- Événement `mandatory` : interrupteurs allumés et verrouillés.
- Canal absent de `organisation` : interrupteur éteint et verrouillé (l’utilisateur n’ajoute jamais).
- Digest, SMS, `/api/v1/user-settings/notifications` : plus d’UI. L’endpoint user-settings peut rester.

### Lot 2 — Préférences organisation

- Nouvel onglet Notifications dans Paramètres organisation (`/organization/settings?section=notifications`).
- Même matrice, couche organisation : `GET|PUT …/notification-preferences/organisation`.
- Onglet seulement si `administration.notifications.configure`.
- L’organisation peut couper ou ajouter `in_app` / `email` (pas `sms`).

### Lot 3 — Inbox

- Filtre « Événement » (`nf-select`) : Toutes + les `id`/`label` de `GET …/notification-preferences`. Query API déjà `source`.
- Onglets Non lues / Toutes / Lues collés à gauche, pas étirés.

Hors chantier (ROADMAP) : SMS et numéro, digest (`EmailDigestJob`), modèles par canal, lien e-mail absolu, temps réel, `AlertRule` / `Broadcast` / `Escalation`, `platform.legacy.transition`.

## Comportement

- Un seul composant de matrice dans `platform/notifications`, composé par les deux écrans de réglages. Pas de copie.
- Textes français. Aucune nouvelle permission. Aucun nouvel archétype.
- Couper un canal à l’organisation retire le canal effectif de tous les utilisateurs (déjà le contrat du routeur).

## Vérification

1. `node platform-host/ops/run.mjs check`
2. Lab : relancer après modification plateforme (`lab` ne recharge pas les sources `nafura-platform`).
3. `admin@host.local` / Organisation A :
   - Mes paramètres → Notifications : liste des événements (plateforme + démo) ; couper e-mail d’un événement non obligatoire ; Actualiser : l’état tient ; un événement obligatoire reste verrouillé.
   - Paramètres organisation → Notifications : couper `in_app` d’un événement ; revenir en Mes paramètres : l’interrupteur utilisateur est éteint et verrouillé.
4. Soumettre une demande d’achat > 10 000 MAD ; `lead@host.local` voit l’approbation. Couper l’in-app org de `platform.approval.requested` : plus de ligne inbox (e-mail hors preuve UI).
5. Inbox : filtre événement, onglets à gauche, clic fiche.

## Critères d’acceptation

- [ ] Les interrupteurs Mes paramètres écrivent `…/notification-preferences`, plus `user-settings/notifications`.
- [ ] L’onglet organisation n’apparaît qu’avec `administration.notifications.configure`.
- [ ] `mandatory` et « l’utilisateur n’ajoute jamais » visibles (verrouillage).
- [ ] Inbox filtre par `source` ; onglets non étirés.
- [ ] `docs/PLATFORM.md`, `docs/UI.md`, `ROADMAP.md` à jour.

## Documentation

- `PLATFORM.md` : les deux écrans, plus seulement l’API.
- `UI.md` : ligne Notifications (préférences) dans le tableau des archétypes.
- `ROADMAP.md` : retirer les écrans une fois livrés ; laisser SMS / digest / modèles.
- Ce fichier : le garder tant que SMS / digest ne sont pas tranchés ; marquer les lots livrés dans l’État.

## État

Lots 1–3 livrés dans ce chantier. Hors chantier : SMS, digest, modèles, temps réel.
