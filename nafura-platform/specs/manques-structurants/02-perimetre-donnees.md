# 2 — Périmètre de données

## Décision (2026-10-08)

Un rôle d’appartenance couvre toute l’organisation. Pour limiter un rôle à un dossier, un chantier, une agence ou un portefeuille :

- le descripteur du record déclare `"scope": { "node": true, "parent": "<champ UUID>" }` ou `"scope": { "of": "<entité nœud>", "field": "<champ UUID>" }` ;
- un grant (`scope_grants`, record `platform.scope-grant`) associe un utilisateur, un rôle déclaré et un nœud ;
- les permissions de ce rôle valent pour le nœud et ses descendants (via `parent`, et pour les records qui pointent le nœud) ;
- qui a déjà la permission sur l’organisation n’est pas réduit.

Pas de second mécanisme par BC (`DossierIntervenant`, `ChantierAffectation`).

## État

Livré. API `POST /api/v1/platform/admin/scope-grants`, écran Administration → Périmètres. Démo : catégories (nœud) et articles (`of`). Sonde host-tests : groupes et enregistrements.
