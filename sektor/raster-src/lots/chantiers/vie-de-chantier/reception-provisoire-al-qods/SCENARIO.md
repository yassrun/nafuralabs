# Acte 4 — Livraison (réception provisoire)

Reprise de [`../SCENARIO.md`](../SCENARIO.md) § Acte 4.

## Précondition

Chantier Al Qods `EN_COURS` avec OS démarré (graphe 226 ou setup minimal identique).

## Séquence

1. **Document** — déposer un PV « réception provisoire » (`type: PV`, chantier, sans nœud obligatoire).
2. **Geste métier** — `POST /api/v1/chantiers/{id}/reception-provisoire` (conducteur ou owner).
3. **Statut** — `RECEPTIONNE_PROVISOIRE` ; `/clore` reste refusé (réception définitive requise).
4. **Cockpit** — flux mensuel non actionnable ; plus d’actions avancement, DA, BL, attachement, situation.

## Hors scope

Réception définitive, levée de réserves, RG — vague finance ultérieure.
