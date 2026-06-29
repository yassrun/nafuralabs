---
specVersion: 1
kind: screen
appId: layali
screenId: pro-door-checkin
name: Contrôle d'accès porte
status: review
phase: P1
p1MobileId: pro-door-checkin
p1Impl: mock
route: /pro/door
layout: fullscreen
zone: pro
roles: [HOST, ADMIN, OWNER]
auth: required
flowRefs:
  - ../../flows/pro-access.flow.md
apiRefs:
  - checkins#POST-/checkins/verify
  - checkins#POST-/checkins/lookup
  - checkins#POST-/checkins/accept-manual
  - checkins#POST-/checkins/sync
  - checkins#GET-/checkins/counter
  - events#GET-/events
topicRefs:
  - /topic/event/{eventId}/checkin
abstractions:
  components:
    - "@platform/core/components/qr-scanner"
    - "@platform/core/components/banner"
    - "@platform/core/components/button"
  patterns:
    - "realtime/append-on-message"
    - "offline/queue-and-sync"
---

# Contrôle d'accès porte

## P1 - Client Walkthrough

| Champ | Valeur |
|-------|--------|
| Mobile `Screen` | `pro-door-checkin` |
| Impl | mock |
| Fixtures | [fixtures.md](../../fixtures.md) |
| Cartographie | [mobile-map.md](../../mobile-map.md) |

> En P1 : **ne pas** utiliser `apiRefs` / composants `@platform/` comme brief agent - mock local uniquement. *(#/pro/door)*


## Intent

Mode plein écran pour le personnel d'entrée (HOST principalement). Scanner les QR quand ils sont disponibles, ou retrouver un accès par nom, téléphone ou référence en fallback. Couvre tickets, bookings table, guest list et comptoir. Fonctionne en mode dégradé hors réseau (queue locale + resync).

## Route et accès

- Route : `/pro/door`
- Layout : fullscreen (sans chrome global pro)
- Auth : required
- Rôles autorisés : HOST, ADMIN, OWNER
- Tenant requis : oui
- Wake lock : demande à activer le wake lock pour empêcher la mise en veille

## Données nécessaires

| Donnée | Source | Quand chargée | Mise en cache |
|---|---|---|---|
| Event courant (sélectionné en début de soirée) | [events API](../../api/events.api.md) `GET /events?venueSlug=&from=today&to=today` | onInit | session |
| Compteur entrées | [checkins API](../../api/checkins.api.md) `GET /checkins/counter` | onInit + reconnect | session |
| Queue scans offline | localStorage (clé `layali.door.queue.{eventId}`) | au scan | persistante jusqu'à sync |

## Mock API consommée

- `GET /api/v1/events?venueSlug=&from=today&to=today` (sélecteur event)
- `POST /api/v1/checkins/verify`
- `POST /api/v1/checkins/sync` (resync queue offline)
- `GET /api/v1/checkins/counter`
- Topic : `/topic/event/{eventId}/checkin`

## États

### loading
- Splash avec logo, "Préparation du scanner...".

### empty
- "Aucun event publié pour ce venue aujourd'hui" + lien retour `/pro`.

### error
- Permission caméra refusée : message + bouton "Réessayer" + lien instructions navigateur.
- Erreur signature HMAC backend (clé inconnue) : bannière persistante "Synchronisation requise" + bouton "Recharger".

### success
- Header compact : nom event, compteur `<totalIn> / <capacity>` (badge vert ≤ 80%, orange 80-95%, rouge > 95%).
- Zone scanner : viewfinder caméra plein écran, cadre de visée, overlay rejet/accept.
- Panneau ou drawer de lookup manuel : recherche par nom, téléphone, référence booking/ticket, avec résultats actionnables.
- Bandeau queue offline : nombre de scans en attente de sync (visible si > 0).
- Mode dégradé indicateur (bandeau orange) si pas de réseau ou de socket.

## Actions utilisateur

| Action | Déclencheur | Résultat |
|---|---|---|
| Scanner un QR | caméra détecte un code | `POST /checkins/verify` (ou queue offline) → overlay vert/rouge 1.5s + son |
| Sélectionner l'event de la soirée | dropdown header | rechargement compteur, abonnement topic correspondant |
| Resync manuel | bouton bandeau offline | `POST /checkins/sync` avec batch jusqu'à 50 |
| Activer mode lampe (torch) | bouton | torch on/off via MediaDevices |
| Saisie manuelle code | bouton (fallback) | input code 8 caractères → soumet via verify |
| Rechercher un client | input lookup | `POST /checkins/lookup` |
| Valider une entrée depuis le lookup | clic sur un résultat | `POST /checkins/accept-manual` → overlay vert/rouge + MAJ compteur |
| Fin de service | bouton (OWNER, ADMIN) | déconnexion socket + libère caméra + retour `/pro` |

## Composants utilisés

| Composant | Source | Rôle |
|---|---|---|
| qr-scanner | `@platform/core/components/qr-scanner` | viewfinder + détection |
| banner | `@platform/core/components/banner` | bandeaux offline/error |
| button | `@platform/core/components/button` | actions secondaires |

## Composants internes (non réutilisables)

- `<ScanFeedbackOverlay>` : full-screen overlay 1.5s ACCEPT/REJECT avec son distinct.
- `<OfflineQueueIndicator>` : compteur scans en attente + bouton resync.
- `<ManualCodeDialog>` : fallback saisie manuelle 8 chars.
- `<LookupDrawer>` : panneau de recherche manuelle multi-critères.
- `<CheckinCandidateRow>` : ligne résultat avec type d'accès, occasion, statut et action "Faire entrer".

## Validations et règles métier

- Le scan ne déclenche pas un appel back immédiat : la file locale est toujours utilisée d'abord, vidée au plus vite par worker (1 req à la fois).
- Anti-double-scan local : empreinte SHA1 du payload + timestamp ; ignore les scans identiques en moins de 3s.
- Limite payload longueur (max 256 chars) avant POST.
- Le lookup manuel doit afficher le type d'accès (`TABLE`, `GUEST_LIST`, `COUNTER`, `TICKET`) et l'occasion (`BIRTHDAY`) quand présente.
- Si `fallbackLookup=false` dans la politique de la soirée, le lookup manuel reste visible seulement pour OWNER/ADMIN avec message d'avertissement.
- Si la signature HMAC échoue 5x consécutivement, alerte (clé peut-être périmée).
- Mode offline : si `navigator.onLine=false` ou socket KO 5s, on bascule en queue ; on continue à donner un retour visuel "scan en attente de validation" en gris.

## Topics realtime

- `/topic/event/{eventId}/checkin` : `checkin.recorded` (push depuis autre scanner ou autre device) → MAJ compteur. `checkin.rejected` (autre scanner) → log discret (pas d'overlay).

## i18n

- `layali.pro.door.title`
- `layali.pro.door.counter`
- `layali.pro.door.accept`
- `layali.pro.door.reject.<rejectReason>`
- `layali.pro.door.offline.banner`
- `layali.pro.door.actions.torch`
- `layali.pro.door.actions.manualCode`
- `layali.pro.door.actions.lookup`
- `layali.pro.door.actions.acceptManual`
- `layali.pro.door.actions.endService`
- `layali.pro.door.errors.cameraPermission`

## Critères d'acceptation

- [ ] Les 4 états sont rendus.
- [ ] Le retour visuel vert/rouge apparaît en < 500 ms après détection du QR (mesuré en local).
- [ ] Le mode offline accepte ≥ 50 scans en queue sans crash.
- [ ] Le resync ne dédoublonne pas les check-ins : l'idempotency key empêche les doublons côté backend.
- [ ] La page survit à un sleep/wake téléphone (re-acquire caméra automatiquement).
- [ ] Une 403 (tenant_mismatch) sur le payload affiche "QR d'un autre venue" et ne crashe pas.
- [ ] Le lookup manuel permet de retrouver un booking ou ticket par nom, téléphone ou référence puis de valider l'entrée sans QR.
- [ ] BAR_MANAGER ne peut pas accéder à cette route (guard 403).
- [ ] Aucun appel hors `apiRefs`.

## Open questions

- Multi-scanner par event avec compteur live partagé : OK via topic, mais conflits de signature HMAC à investiguer côté impl.
- Le lookup manuel doit-il rester utilisable hors ligne avec une whitelist locale partielle, ou seulement en ligne en V1 ?
- Son customisable par venue (jingle d'entrée) : V2.
- Mode kiosque borné (interdiction navigation) : V2.
- Photo automatique au scan VIP : V2 (privacy).
