# Sandbox web

Mini-app Angular pour exposer les **archétypes d’écran** et le catalogue **Components** (`nf-*`).

## Lancer

```powershell
$env:Path = 'C:\Users\karkafiy\bin\node22\node-v22.17.1-win-x64;' + $env:Path
npm start
```

Le backend doit tourner séparément sur `http://127.0.0.1:8082`.

Premier clone : `npm install --legacy-peer-deps` dans ce dossier.  
Ne pas confondre avec Mode B Sektor (`:4200`).

Products → API Sandbox H2 (`http://127.0.0.1:8082`) · pas d’auth.

## Navigation

| Menu | Source |
|---|---|
| Sidebar | `src/app/nav/sandbox-nav.config.ts` |
| Catalog registry | `src/app/catalog/sandbox-catalog.ts` |

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
