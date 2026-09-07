# Anatomy Showroom (sandbox-web)

Mini-app Angular pour exposer les **archétypes d’écran** et le catalogue **Components** (`nf-*`).

```bash
cd nafura-platform/sources/sandbox-web
npm install --legacy-peer-deps
npm start
# → http://127.0.0.1:4300
```

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

Mocks in-memory · pas d’auth · consomme Anatomy via `@platform/*`.
