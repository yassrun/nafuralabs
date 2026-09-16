# Sandbox web

Mini-app Angular pour exposer les **archétypes d’écran** et le catalogue **Components** (`nf-*`).

## Lancer (recommandé)

Back H2 + front en une commande :

```powershell
cd sandbox
.\showroom-up.ps1          # → http://127.0.0.1:4300 + API :8082
.\showroom-up.ps1 stop
.\showroom-up.ps1 status
```

Scripts : [`../../showroom-up.ps1`](../../showroom-up.ps1) (Windows) · [`../../showroom-up.sh`](../../showroom-up.sh) (bash).  
Front seul (si le back tourne déjà) : `npm start` → `http://127.0.0.1:4300`.

Premier clone : `npm install --legacy-peer-deps` dans ce dossier.  
Ne pas confondre avec Mode B Sektor (`:4200`).

Products → API showroom H2 (`http://127.0.0.1:8082`) · pas d’auth.

## Navigation

| Menu | Source |
|---|---|
| Sidebar | `src/app/nav/showroom-nav.config.ts` |
| Catalog registry | `src/app/catalog/showroom-catalog.ts` |

Menus : **Archetypes** · **Components** (Atoms / Molecules / Organisms).

Status badges : `live` (matrices d’options) · `partial` · `stub` (deps lourdes / prochain tranche).

## Canon V1 (archétypes)

| Route | Pattern |
|---|---|
| `/archetypes/listing` | listing |
| `/archetypes/details/:id` | detail |
| `/archetypes/details-1n/:id` | details1n |
| `/archetypes/master-slave` | masterSlave |
| `/archetypes/tree` | tree |
| stubs | wizard · settings · dashboard · document-workspace |
