# 15 — Mobile / Terrain (App PWA, offline, géoloc, scanner, signature)

> **Sévérité** : P0 (M-MOB-01 + M-MOB-02 bloquent usage terrain réel)
> **Estimation** : 1.5 sprint (S5–S6)
> **Dépendances** : Round 1 13.6 PWA (ngsw + démo offline), `02-chantiers` (avancements mobile), `09-rh` (pointage)

## Findings traités

- [ ] **M-MOB-01** App mobile / PWA terrain installable **P0**
- [ ] **M-MOB-02** Mode offline IndexedDB/SQLite + sync différée **P0**
- [ ] **M-MOB-03** Géolocalisation / géofencing
- [ ] **M-MOB-04** Capture photo native + compression + géotag EXIF
- [ ] **M-MOB-05** Scanner QR / code-barres (BL, matériel, articles)
- [ ] **M-MOB-06** Signature digitale canvas (PV, attachements)
- [ ] **M-MOB-07** Notifications push FCM/APNs (P2)
- [ ] **M-MOB-08** Mode très basse bande passante (P2)

## Goal

Construire la **vraie app terrain** : PWA installable (ou native RN/Flutter en option future) dédiée chef chantier, avec **mode offline robuste** (IndexedDB + sync différée), géolocalisation/géofencing, capture photo géotaggée, scanner QR/code-barres, signature digitale. Cible : un chef chantier doit pouvoir gérer sa journée sans connexion fiable.

## Context to read first

```
src/ngsw-config.json                                              # Round 1 13.6 PWA
src/manifest.webmanifest                                          # Round 1 PWA manifest
app/applications/erp/pages/rh/pointage/                          # Round 1 13.1 photo IndexedDB
docs/specs/erp-audit-roadmap/PWA-CACHE-PROD.md                    # Round 1 doc PWA
public/assets/i18n/                                                # traductions
```

---

## Architecture cible

```
PWA installable
├── /m/* (routes mobile dédiées)
│   ├── /m/dashboard           # tableau de bord chef chantier (3 cartes max)
│   ├── /m/chantiers/:id        # fiche chantier mobile (lecture seule + actions)
│   ├── /m/pointage             # M-RH-01 pointage équipe
│   ├── /m/avancement/:chantierId  # saisie avancement (M-CHA-11)
│   ├── /m/journal/:chantierId    # journal chantier (météo + intempérie + visites)
│   ├── /m/attachement/:chantierId  # carnet d'attachement
│   ├── /m/photo/:chantierId      # capture photo géotaggée
│   ├── /m/scan/:context          # scanner QR (réception, sortie, inventaire) — §04
│   ├── /m/materiel/pointage     # M-MAT-06 heures engin
│   ├── /m/hse/incident          # déclarer incident
│   ├── /m/hse/causerie          # causerie 1/4 h
│   ├── /m/caisse/:caisseId       # caisse chantier (M-FIN-09)
│   └── /m/approuver/:token       # M-APR-07 approbation 1-clic
└── Layers
    ├── IndexedDB (Dexie.js ou idb-keyval)
    ├── Service Worker (ngsw + custom strategy)
    ├── Sync Queue (offline → ligne quand connexion)
    └── Conflict Resolver (fingerprint + last-write-wins ou interactive)
```

---

## Task 15.1 — App PWA terrain installable (M-MOB-01) **P0**

**Action** :
1. Étendre `manifest.webmanifest` : `short_name: "Nafura Terrain"`, icônes 192/512, `display: standalone`, `theme_color`, screenshot
2. Bouton « Installer l'app » sur première visite mobile (event `beforeinstallprompt`)
3. Layout mobile dédié `/m/*` : sidebar compacte ou bottom-nav, gros boutons tactiles ≥ 44 × 44 px
4. Routes mobiles : un sous-ensemble curated (pas tout l'ERP — chef chantier focus)
5. Détection mode mobile : redirect `/` → `/m/dashboard` si screen ≤ 640px ET app installée

**Acceptance criteria** :
- [ ] App installable sur iOS + Android (Lighthouse PWA ≥ 90)
- [ ] Layout dédié `/m/*` distinct du desktop
- [ ] Test Playwright mobile emulation (iPhone 14, Pixel 7)
- [ ] Documentation utilisateur (capture écran installation)

---

## Task 15.2 — Mode offline robuste (M-MOB-02) **P0**

Étendre Round 1 13.6 :

**Stockage** :
- `Dexie.js` (wrapper IndexedDB) avec schéma typé
- Tables : `pointages`, `avancements`, `journaux`, `photos`, `attachements`, `incidents`, `caisses`, `pendingSync`

**Workflow offline** :
1. Lecture : si online → API ; si offline → IndexedDB cache local
2. Écriture : toujours IndexedDB + ligne `pendingSync` avec timestamp
3. Service Worker : background sync quand connexion revient
4. Conflits : si serveur a modifié plus récemment → afficher dialog résolution (« Garder local / Garder serveur / Fusionner »)
5. UI : bandeau orange « Offline (3 changements en attente) » en haut

**Acceptance criteria** :
- [ ] 7 jours d'offline supportés sans crash (test mock)
- [ ] 100+ pointages offline sync sans perte
- [ ] Gestion conflits avec dialog
- [ ] Test e2e Playwright offline (`context.setOffline(true)`)

---

## Task 15.3 — Géolocalisation + géofencing (M-MOB-03) **P1**

Étendre Round 1 (pointage géoloc démo) :
- Géofencing chantier : refus pointage si distance > rayon (200m par défaut)
- Refresh position régulier (toutes les 10 min) avec consommation batterie limitée
- Mode dégradé si GPS indisponible (saisie manuelle approuvée par chef)

**Acceptance criteria** :
- [ ] Configuration rayon par chantier (M-CHA-04 fiche chantier)
- [ ] Refus avec message clair « Vous êtes à 850m du chantier »
- [ ] Override par chef chantier avec motif

---

## Task 15.4 — Capture photo native + EXIF géotag (M-MOB-04) **P1**

Round 1 = compression ~800px démo. Étendre :
- Caméra arrière par défaut sur mobile
- Compression côté client (`browser-image-compression`)
- Préservation EXIF géotag (si autorisation)
- Watermark optionnel (date + chantier + utilisateur)
- Multi-photos avec preview

**Acceptance criteria** :
- [ ] Photo ≤ 200 KB après compression
- [ ] EXIF lat/lng préservée
- [ ] Watermark conforme demande

---

## Task 15.5 — Scanner QR / code-barres (M-MOB-05) **P1**

Cf §04 M-STK-01. Librairie `@zxing/ngx-scanner`. Contextes :
- BL réception (scan QR du BL → ouvre réception préremplie)
- Article (scan QR article → consulte stock)
- Matériel (scan QR engin → pointage heures)

**Acceptance criteria** :
- [ ] Permission caméra OK
- [ ] Détection QR + EAN-13 + Code 128
- [ ] Beep + vibration sur scan réussi

---

## Task 15.6 — Signature digitale canvas (M-MOB-06) **P1**

Round 1 13.4 = signature canvas attachement démo. Étendre :
- Composant `<signature-canvas>` réutilisable
- Embarqué dans PDF (image data URL)
- Validation force minimum (assez d'encre tracé)
- Mode portrait / paysage

**Cas d'usage** :
- Carnet d'attachement (M-CHA-06)
- PV réception (M-MAR-08 / M-CHA-14)
- Bon de matières chantier (M-STK-03)
- Contrat employé (M-RH-02)
- État contradictoire location matériel (M-MAT-04)

---

## Task 15.7 — Notifications push FCM/APNs (M-MOB-07) **P2**

Firebase Cloud Messaging (Android + Web) et Apple Push (iOS).

Cas : approbation à valider, incident HSE déclaré, situation MOA payée.

---

## Task 15.8 — Mode très basse bande passante (M-MOB-08) **P2**

Toggle « Mode économie » :
- Pas de photos (texte uniquement)
- Polling réduit
- Cache agressif
- Sync différée
- UI minimale

Pour chantiers en zones reculées sans 4G.

---

## Testing

```ts
// e2e mobile
test.describe('Mobile terrain', () => {
  test.use({ ...devices['iPhone 14'] });

  test('Installer PWA et pointer en mode offline', async ({ page, context }) => {
    await page.goto('/m/dashboard');
    await expect(page.locator('[data-testid=install-cta]')).toBeVisible();
    
    // Set offline
    await context.setOffline(true);
    await page.goto('/m/pointage');
    await page.fill('[name=heuresJour]', '8');
    await page.click('text=Pointer');
    await expect(page.locator('text=Enregistré localement')).toBeVisible();
    
    // Set online
    await context.setOffline(false);
    await page.waitForTimeout(2000);
    await expect(page.locator('text=Synchronisé')).toBeVisible();
  });
});
```

## Dépendances inverses

- 02-chantiers (avancements + carnet attachement + journal)
- 04-stock (scanner BL/article)
- 05-materiel (pointage heures engin)
- 08-finance (caisse chantier)
- 09-rh (pointage équipe)
- 10-hse (déclaration incident mobile)
- 12-approbations (approbation 1-clic)
- 14-transverse (notifications push)
