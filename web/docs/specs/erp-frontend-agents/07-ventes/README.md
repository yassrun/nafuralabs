# Module Ventes & Facturation — Brief Module

> Cycle commercial aval : offre → BC client → exécution chantier → situations → facturation → encaissement → retenues garanties.

## Routes nav

| Route | Sub-spec |
|-------|----------|
| `/ventes/offres` | [01-ventes-cycle.md](01-ventes-cycle.md) — Cycle client (offres + BC + situations) |
| `/ventes/commandes` | [01-ventes-cycle.md](01-ventes-cycle.md) |
| `/ventes/situations` | [01-ventes-cycle.md](01-ventes-cycle.md) — partage avec module chantiers |
| `/ventes/factures` | [02-ventes-facturation.md](02-ventes-facturation.md) — Factures clients |
| `/ventes/avoirs` | [02-ventes-facturation.md](02-ventes-facturation.md) |
| `/ventes/retenues-garantie` | [02-ventes-facturation.md](02-ventes-facturation.md) |
| `/ventes/clients` | [03-ventes-clients.md](03-ventes-clients.md) — Référentiel clients |

## Découpage

- **01-ventes-cycle** : offres commerciales (= devis approuvés ou directs), bon de commande client, lien situations.
- **02-ventes-facturation** : factures, avoirs, retenues garantie (suivi caution 7%).
- **03-ventes-clients** : référentiel clients + historique commercial.

## Modèle partagé

Voir chaque sub-spec — modèles complets dans chaque doc.

## Permissions

```
ventes.offre.read|create|update|emettre|annuler
ventes.commandeClient.read|create|update|valider
ventes.facture.read|create|emettre|cloturer|avoir
ventes.avoir.read|create|emettre
ventes.retenueGarantie.read|liberer
ventes.client.read|create|update|delete
```

## Routes module

```ts
// applications/erp/ventes/ventes.routes.ts
export const VENTES_ROUTES: Routes = [
  { path: 'ventes/offres', loadChildren: () => import('../pages/ventes/offres/offres.routes').then(m => m.OFFRES_ROUTES) },
  { path: 'ventes/commandes', loadChildren: () => import('../pages/ventes/commandes/cmd-clients.routes').then(m => m.CMD_CLIENTS_ROUTES) },
  { path: 'ventes/situations', loadChildren: () => import('../pages/chantiers/situations/situations.routes').then(m => m.SITUATIONS_ROUTES) },  // proxy
  { path: 'ventes/factures', loadChildren: () => import('../pages/ventes/factures/factures.routes').then(m => m.FACTURES_ROUTES) },
  { path: 'ventes/avoirs', loadChildren: () => import('../pages/ventes/avoirs/avoirs.routes').then(m => m.AVOIRS_ROUTES) },
  { path: 'ventes/retenues-garantie', loadComponent: () => import('../pages/ventes/retenues-garantie/retenues-garantie.page').then(m => m.RetenuesGarantiePage) },
  { path: 'ventes/clients', loadChildren: () => import('../pages/ventes/clients/clients.routes').then(m => m.CLIENTS_ROUTES) },
];
```

## Volumétrie cible

- 25 factures clients réparties 6 mois.
- 15 avoirs.
- 12 retenues garanties (1 par chantier livré ou en cours).
- 10 clients (déjà dans MOCK-DATA).
- 15 offres commerciales mix EN_COURS / GAGNEES / PERDUES.
- 12 BC clients actifs.

## DoD module

- [ ] 3 sub-specs livrées.
- [ ] Mock service unique `VentesMockService` cohérent.
- [ ] Lien bidirectionnel : facture ↔ situation, avoir ↔ facture.
- [ ] Calculs HT/TVA/TTC corrects partout.
- [ ] Branche `ventes.routes.ts` injectée dans erp.routes.generated.ts.
