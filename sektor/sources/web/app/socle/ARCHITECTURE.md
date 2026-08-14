# Web workspace (Sektor)

Point d’entrée Angular pour **Sektor BTP**. Le métier vit sous `app/<domaine>/` ; le kernel sous `app/socle/`.

| Rôle | Emplacement |
|------|-------------|
| Bootstrap (`main.ts`) | `sektor/sources/web/src/main.ts` → `app/socle/app.component` + `app/socle/app.config` |
| Socle (shell, config, onboarding) | `sektor/sources/web/app/socle/` → alias `@app/socle/*` |
| Domaines ERP | `app/{catalogue,etudes,chantiers,marches,achats,ventes,finance,rh,hse}/` — pas `inventory/` ; approbations/analytics/pilotage* vivent dans `socle/` |
| Platform / anatomy | `nafura-platform/sources/web/` → alias `@platform/*` |

Guide : [NAFURALABS.md](../../../../../NAFURALABS.md).
