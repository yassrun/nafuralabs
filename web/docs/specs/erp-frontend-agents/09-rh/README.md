# Module Ressources Humaines — Brief Module

> Gestion du personnel BTP Maroc : employés, pointage chantier, planning équipes, congés, paie. Spécificité forte : pointage **par chantier** + paie multi-chantier (pour répartition analytique des coûts MO).

## Routes nav

| Route | Sub-spec |
|-------|----------|
| `/rh/employes` | [01-rh-employes.md](01-rh-employes.md) |
| `/rh/pointage` | [02-rh-pointage-planning.md](02-rh-pointage-planning.md) |
| `/rh/planning-equipes` | [02-rh-pointage-planning.md](02-rh-pointage-planning.md) |
| `/rh/conges` | [03-rh-conges.md](03-rh-conges.md) |
| `/rh/paie` | [04-rh-paie.md](04-rh-paie.md) |

## Découpage

- **01-rh-employes** : référentiel employés + dossiers individuels + contrats.
- **02-rh-pointage-planning** : planning équipes par chantier + saisie pointage quotidien.
- **03-rh-conges** : demandes congés, soldes, calendrier équipe.
- **04-rh-paie** : génération paie mensuelle + bulletins + déclarations.

## Permissions

```
rh.employe.read|create|update|delete|consulterDossier
rh.contrat.read|create|update|terminer
rh.pointage.read|saisir|valider
rh.planning.read|create|modifier
rh.conge.read|demander|approuver|rejeter
rh.paie.read|preparer|valider|cloturer
rh.bulletin.read|generer|envoyer
```

## Routes module

```ts
// applications/erp/rh/rh.routes.ts
export const RH_ROUTES: Routes = [
  { path: 'rh/employes', loadChildren: () => import('../pages/rh/employes/employes.routes').then(m => m.EMPLOYES_ROUTES) },
  { path: 'rh/pointage', loadComponent: () => import('../pages/rh/pointage/pointage.page').then(m => m.PointagePage) },
  { path: 'rh/planning-equipes', loadComponent: () => import('../pages/rh/planning-equipes/planning-equipes.page').then(m => m.PlanningEquipesPage) },
  { path: 'rh/conges', loadChildren: () => import('../pages/rh/conges/conges.routes').then(m => m.CONGES_ROUTES) },
  { path: 'rh/paie', loadChildren: () => import('../pages/rh/paie/paie.routes').then(m => m.PAIE_ROUTES) },
];
```

## Volumétrie cible

- 40 employés (cf. [00-MOCK-DATA-STRATEGY §Employés](../00-MOCK-DATA-STRATEGY.md)).
- 40 contrats (1 par employé).
- 6 mois de pointages (~5000 saisies — 40 employés × 22 jours × 6 mois).
- 30+ demandes congés.
- 6 paies mensuelles validées.
- Soldes congés à jour.

## Spécificités Maroc

- **CNSS** : code à 9 chiffres, plafond 6000 MAD/mois pour cotisations.
- **AMO** : Assurance Maladie Obligatoire (taux 4% côté employeur, 2.26% salarié).
- **IGR** : Impôt général sur le revenu — barème progressif tranches.
- **CIMR** : retraite complémentaire optionnelle.
- **SMIG BTP** : 17,28 MAD/heure (révision périodique).
- **Indemnité prime de fin d'année** : usage BTP, ~1 mois de salaire.
- **Heures sup** : majoration 25% jour ouvrable, 50% nuit, 100% dimanche/fériés.

## DoD module

- [ ] 4 sub-specs livrées.
- [ ] Mock service unique `RhMockService` cohérent.
- [ ] Calculs paie BTP Maroc corrects (CNSS, AMO, IGR, charges patronales).
- [ ] Pointage par chantier alimente coûts analytiques chantier.
- [ ] `rh.routes.ts` injecté dans erp.routes.generated.ts.
- [ ] Lookup `employees` partagé via `shared/mock/global-lookups.service.ts`.
