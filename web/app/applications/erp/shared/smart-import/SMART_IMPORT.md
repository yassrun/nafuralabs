# Smart Import — brancher un nouvel écran (3 étapes)

1. **Seed doc type** — Ajouter un `doc_type_definition` avec `jsonSchema` (array + `required`) et `uiSchema` (`importPolicy`, `arrays`).
2. **Handler** — Enregistrer un `ImportHandler` via `ImportHandlerRegistry` (`entityKey`, `arrayPath`, `mapRowToPayload`, `create`, `dedupeKey`).
3. **UI** — Monter `<erp-smart-import-button entityKey="..." (importComplete)="refresh()" />` sur le listing.

Pipeline : **1 appel IA / fichier** → validation schéma → import auto des lignes valides → popup dynamique scopé si `required` manquant.
