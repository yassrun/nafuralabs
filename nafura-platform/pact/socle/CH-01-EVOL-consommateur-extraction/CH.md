# CH-01-EVOL — consommateur document-extraction

**Type :** `EVOL`
**Cible :** socle `nafura-platform`
**Qualification :** le CADRE renomme le contexte ; le socle pointait encore `lecture` et `P-LECTURE-*`.

## Pourquoi

Une capacité sans consommateur nommé juste est une capacité à jeter. Les IDs d'action doivent suivre le contexte.

## Aujourd'hui

Consommateur `lecture`. Actions `P-LECTURE-LANCER` · `P-LECTURE-REVOIR`.

## Attendu

Consommateur `document-extraction`. Actions `P-EXTRACTION-LANCER` · `P-EXTRACTION-REVOIR`.

## Critères d'acceptation (gelés)

- **AC-1** Aucune capacité ne nomme `lecture` comme consommateur.
- **AC-2** La matrice n'expose plus `P-LECTURE-*`.
- **AC-3** `P-EXTRACTION-LANCER` et `P-EXTRACTION-REVOIR` ciblent le BC `document-extraction`.

## Preuves attendues

Revue du `SPEC.md` socle contre le CADRE à jour.
