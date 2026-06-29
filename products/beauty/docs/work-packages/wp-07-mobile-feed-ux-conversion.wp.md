---
specVersion: 1
kind: work-package
appId: beauty
wpId: wp-07-mobile-feed-ux-conversion
title: Mobile feed UX — discovery first + conversion booking
status: draft
phase: P1
wave: 4
dependsOn: [wp-03-booking-customer]
filesAllowed:
  - beauty/mobile/src/App.tsx
  - beauty/mobile/src/App.css
  - beauty/mobile/src/index.css
  - beauty/mobile/src/prototypeData.ts
filesForbidden:
  - naf/src/spec/**
  - aispecs/**
  - infra/**
abstractionsRequired: []
abstractionsMissing: []
---

# Agent 1: Mobile feed UX — discovery first + conversion booking

## Scope

Refondre la première page client du prototype mobile Beauty pour maximiser la découverte et la conversion vers la réservation. Le feed doit prioriser la recherche, les filtres et la disponibilité, et reléguer les actions compte au second plan.

## Agent role

Agent 1 se concentre uniquement sur le feed d’accueil et les points d’entrée vers la réservation. Il ne modifie pas les écrans de profil ni le modèle de services au-delà des données strictement nécessaires pour afficher les cartes.

## Inputs

- Specs IA :
  - [app](../app.md)
  - [navigation](../navigation.md)
  - [customer-booking flow](../flows/customer-booking.flow.md)
- Code source actuel (prototype) :
  - beauty/mobile/src/App.tsx
  - beauty/mobile/src/prototypeData.ts

## Outputs attendus

- Fichiers créés ou modifiés (chemins) :
  - beauty/mobile/src/App.tsx
  - beauty/mobile/src/index.css
  - beauty/mobile/src/prototypeData.ts (si données mock additionnelles nécessaires)
- Tests :
  - Validation manuelle du parcours home -> salon -> service -> booking
  - Vérification responsive mobile (petit écran et écran moyen)
- Mock fixtures à charger :
  - Créneaux disponibles simulés par salon
  - Prix d’appel par salon

## Étapes proposées

1. Recomposer le hero home avec recherche principale (service, ville) + CTA Rechercher.
2. Ajouter filtres rapides: Aujourd’hui, Manucure/Pédicure, Cire, Petit budget.
3. Enrichir les cartes salons: prix à partir de, prochain créneau, distance estimée.
4. Ajouter CTA direct Réserver sur chaque carte sans entrer dans le détail complet.
5. Déplacer Mes réservations et Mon profil dans une section secondaire basse.
6. Vérifier ordre visuel: objectif booking visible dans la première hauteur d’écran.

## Critères d'acceptation

- [ ] La première action visible pousse vers la découverte/réservation et non vers le compte.
- [ ] Un bloc recherche est présent dans la zone haute.
- [ ] Les filtres rapides modifient visuellement la liste.
- [ ] Chaque carte salon expose au minimum note, prix d’appel, prochain créneau.
- [ ] Le CTA Réserver est disponible depuis le feed.
- [ ] Les raccourcis compte existent mais ne sont plus primaires.

## Test plan

- Ouvrir Home: vérifier que la recherche est au-dessus de la liste.
- Activer filtre Cire: la liste se réduit aux salons pertinents.
- Appuyer Réserver depuis une carte: navigation vers l’étape de booking correcte.
- Vérifier lisibilité sur largeur 360px.

## Out of scope

- Géolocalisation réelle GPS.
- Ranking intelligent IA.
- Persistance serveur des préférences de filtres.

## Open questions

- Filtres quick chips en mode multi-sélection ou mono-sélection pour V1.
- CTA carte: ouverture directe du wizard ou passage par détail salon.
