---
specVersion: 1
kind: work-package
appId: beauty
wpId: wp-08-mobile-customer-profile-options
title: Mobile account UX — profile options and account flows
status: draft
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

# Agent 2: Mobile account UX — profile options and account flows

## Scope

Structurer la section profil client en options exploitables avec écrans dédiés de niveau V1 (placeholder fonctionnel). Le but est de rendre le compte utile sans nuire à la conversion booking.

## Agent role

Agent 2 prend en charge tout ce qui concerne le profil client, les options de compte et les écrans secondaires associés. Il n’altère pas le feed principal ni la taxonomie des services sauf si un petit ajustement de libellé est indispensable pour la cohérence.

## Inputs

- Specs IA :
  - [app](../app.md)
  - [navigation](../navigation.md)
  - [customer-onboarding flow](../flows/customer-onboarding.flow.md)
- Code source actuel (prototype) :
  - beauty/mobile/src/App.tsx

## Outputs attendus

- Fichiers créés ou modifiés (chemins) :
  - beauty/mobile/src/App.tsx
  - beauty/mobile/src/index.css
- Tests :
  - Navigation home -> profil -> option -> retour
  - Contrôle cohérence des actions principales (bookings, paiement, notifications)
- Mock fixtures à charger :
  - Méthodes de paiement mock
  - Préférences notifications mock

## Étapes proposées

1. Définir les options compte prioritaires V1: bookings, paiement, adresses, notifications.
2. Créer un écran léger par option avec état vide + état mock.
3. Normaliser les patterns UI (titre, bouton retour, action primaire).
4. Ajouter microcopie claire pour ce qui est non disponible en V1.
5. Vérifier qu’aucun bouton Déconnexion n’apparaît en home/profil client si non désiré.

## Critères d'acceptation

- [ ] Chaque option de profil ouvre une destination dédiée (pas seulement une ligne statique).
- [ ] Les destinations ont au minimum un état vide clair et une action primaire.
- [ ] Le retour vers home et bookings est cohérent.
- [ ] La section compte reste secondaire dans le parcours global.

## Test plan

- Ouvrir profil, entrer dans 3 options, revenir sans perte d’état.
- Vérifier que Mes réservations reste accessible en un clic depuis profil.
- Vérifier lisibilité et spacing sur mobile.

## Out of scope

- Edition réelle du profil via backend.
- Paiement réel.
- Consentements légaux avancés.

## Open questions

- Faut-il garder un accès Déconnexion uniquement dans paramètres avancés.
- Option historique fidélité dans profil ou écran dédié Wallet.
