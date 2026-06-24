---
specVersion: 1
kind: work-package
appId: beauty
wpId: wp-09-mobile-service-taxonomy-and-booking-rules
title: Mobile services model — beauty taxonomy + booking minimum rules
status: draft
wave: 4
dependsOn: [wp-03-booking-customer]
filesAllowed:
  - beauty/mobile/src/prototypeData.ts
  - beauty/mobile/src/App.tsx
  - beauty/mobile/src/ManagerScreens.tsx
  - beauty/mobile/src/index.css
filesForbidden:
  - naf/src/spec/**
  - aispecs/**
  - infra/**
abstractionsRequired: []
abstractionsMissing: []
---

# Agent 3: Mobile services model — beauty taxonomy + booking minimum rules

## Scope

Formaliser le catalogue de services beauté V1 et les règles de réservation minimales pour améliorer la cohérence entre découverte client et gestion manager. Inclut manucure, pédicure, cire, soins visage, coiffure et hammam.

## Agent role

Agent 3 est responsable du modèle de services, du catalogue métier et des règles de réservation minimales côté manager et côté client. Il n’intervient pas sur le feed d’accueil ni sur les écrans de profil sauf si une donnée de service doit y être affichée.

## Inputs

- Specs IA :
  - [app](../app.md)
  - [bookings API](../api/bookings.api.md)
  - [services API](../api/services.api.md)
- Code source actuel (prototype) :
  - beauty/mobile/src/prototypeData.ts
  - beauty/mobile/src/ManagerScreens.tsx
  - beauty/mobile/src/App.tsx

## Outputs attendus

- Fichiers créés ou modifiés (chemins) :
  - beauty/mobile/src/prototypeData.ts
  - beauty/mobile/src/ManagerScreens.tsx
  - beauty/mobile/src/App.tsx
- Tests :
  - Contrôle manager création service avec min réservation
  - Contrôle client affichage min réservation sur service
- Mock fixtures à charger :
  - Templates services beauté complets
  - Exemples de services personnalisés manager

## Étapes proposées

1. Définir taxonomie V1 des services beauté avec catégories cohérentes.
2. Ajouter dictionnaire templates métiers (nom, durée, prix d’appel, min réservation).
3. Encadrer la règle min réservation: min 15 min, max durée service.
4. Assurer affichage de la règle côté client et manager.
5. Ajouter guardrails de saisie manager (validation + messages).

## Critères d'acceptation

- [ ] La liste des services inclut explicitement manucure, pédicure, cire.
- [ ] Le manager peut ajouter un service avec min réservation valide.
- [ ] Les valeurs invalides sont normalisées ou refusées.
- [ ] Les informations min réservation sont visibles au client.
- [ ] Le modèle de données reste cohérent entre écrans client et manager.

## Test plan

- Créer service manager: durée 45, min 30 -> accepté.
- Créer service manager: durée 30, min 60 -> correction automatique à 30.
- Créer service manager: min 5 -> correction automatique à 15.
- Vérifier affichage en détail salon et en liste manager.

## Out of scope

- Gestion des packs multi-services.
- Mapping automatique staff disponibilité par compétence.
- Pricing dynamique selon horaire.

## Open questions

- Faut-il exposer min réservation au client final ou seulement en contrainte système.
- Prix d’appel affiché TTC ou hors taxes dans le prototype.
