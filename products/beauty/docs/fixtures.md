---
specVersion: 1
kind: fixtures
appId: beauty
status: ready
phase: P1
language: fr
sourceFile: products/beauty/mobile/src/prototypeData.ts
---

# Beauty — Fixtures walkthrough (P1)

Spécification **données mock** pour la phase Client Walkthrough.  
Pas de contrats REST — le code lit ces fixtures en local.

> Implémentation actuelle : `mobile/src/prototypeData.ts` (renommage optionnel → `mockFixtures.ts` en P2).

---

## 1. Objectif

Jeu de données **racontable** pour une démo 15 min : 2–3 salons Casablanca, clients et manager crédibles, RDV passés et à venir.

---

## 2. Entités minimales

| Entité | Quantité cible | IDs exemples |
|--------|----------------|--------------|
| Salon | 3 | `salon-01` Silhouette Beauty, … |
| Service / salon | 4–8 | coiffure, ongles, … |
| Staff / salon | 2–4 | |
| Customer profile | 1 | `mockCustomerProfile` |
| Customer bookings | 3+ | passé, confirmé, annulé |
| Manager session | 1 | `fatima@silhouettebeauty.ma` |
| Manager bookings | 5+ | agenda du jour |
| Reviews | par salon | pour écrans avis |
| Loyalty | 1 profil | points affichables home + `/me/loyalty` |

---

## 3. Scénarios de démo (flows)

### customer-booking

1. Home → salon `salon-01` → service → staff (ou indifférent) → créneau → auth mock si besoin → paiement mock (cash ou carte fake) → confirm avec ref `BK-XXXX`
2. Home → recherche « ongles » → résultats filtrés

### customer-onboarding

1. Login OTP mock : téléphone `+212612345678`, code `123456`
2. Register : nouveau numéro → OTP → redirect vers booking ou home

### Pro

1. Login `fatima@silhouettebeauty.ma` / any password → dashboard → agenda, réservations, clients stub

### Admin (P1 stub)

1. Entry → Admin → overview → liste tenants → détail tenant

Fixtures tenants :

| tenantId | Salon | Statut |
|----------|-------|--------|
| tenant-silhouette | Silhouette Beauty | ACTIVE |
| tenant-glam | Glam Studio | ACTIVE |
| tenant-pause | Pause Coiffure | SUSPENDED |

Inventaire complet : [phases.md](phases.md) § Inventaire écrans P1.

---

## 4. Règles P1

- Dates : fuseau `Africa/Casablanca`, formats affichage `dd/MM/yyyy HH:mm`
- Devise affichée : `DH` ou `MAD`
- Pas d’appel réseau : toute « API » = lecture/écriture en mémoire ou `sessionStorage` optionnel
- Nouvelle réservation walkthrough : ajouter à `mockCustomerBookings` en mémoire à la confirm

---

## 5. Évolution

| Phase | Fixtures |
|-------|----------|
| P1 | `prototypeData.ts` monolithique |
| P2 | MSW / interceptor sert les mêmes shapes depuis `fixtures/` JSON |
| P3 | Remplacement progressif par réponses HTTP ; specs dans `api/*.md` |
