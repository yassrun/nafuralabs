# Inventaire des divergences — phase 0/1

**Établi le 2026-07-19** par `diff -rq` sur les deux paires d'arbres.

---

## Résumé

| Paire | Seulement côté mort | Seulement côté vivant | Fichiers différents |
|---|---|---|---|
| `products/sektor-btp/web/app` (mort) ↔ `web/app/applications/erp` (vivant) | 2 | 6 | 46 |
| `platform/web` (mort) ↔ `web/app/platform` (vivant) | 1 | 4 | ~20 |

**Conclusion : le vivant est en avance partout.** Un seul fichier a été récupéré ; le reste
côté mort est soit obsolète, soit supplanté.

---

## Décisions

### Fichiers présents uniquement côté MORT

| Fichier | Décision | Motif |
|---|---|---|
| `platform/web/.../doc-extractor/services/document-validation.service.spec.ts` | ✅ **récupéré** → `web/app/platform/.../services/` | Le service existe côté vivant, seul son test manquait |
| `products/.../pages/chantiers/utils/bpde-lot-import.util.ts` | ❌ **abandonné** | **Supplanté.** Parseur XLSX maison (192 l.) remplacé côté vivant par le framework `smart-import` (`SmartImportTriggerComponent` + `LotChantierImportService`). Voir ci-dessous |
| `products/.../pages/etudes/consultation/` | ❌ **abandonné** | Module supprimé par le lot 8 de l'epic étude de prix |

### Fichiers présents uniquement côté VIVANT — tous conservés

| Fichier / répertoire | Nature |
|---|---|
| `applications/erp/invitations/` | fonctionnalité |
| `applications/erp/pages/chantiers/components/chantier-equipe-tab/` | fonctionnalité |
| `applications/erp/pages/chantiers/documents/utils/` | utilitaires |
| `applications/erp/pages/chantiers/services/chantier-affectation-api.service.ts` | service |
| `applications/erp/shared/extraction-schemas/` | **schémas d'extraction IA** |
| `applications/erp/shared/smart-import/` | **handlers d'import** |
| `platform/core/config/public-web-origin.ts` | config |
| `platform/core/security/guards/unauthenticated-redirect.ts` | garde |
| `platform/features/documents/smart-import/` | **framework d'import** |
| `platform/lib/anatomy/.../tree-table/tree-table.component.spec.ts` | test |

### Fichiers différents des deux côtés

**Le vivant fait foi**, sans exception. Contrôle effectué : 8 fichiers seulement ont plus de
lignes côté mort, et l'écart s'explique à chaque fois par une régression du mort, pas par une
perte du vivant.

Le cas le plus important, vérifié en détail :

| `chantier-lots-tab.component.ts` | mort : +283 lignes |
|---|---|
| Côté **mort** | parsing XLSX en dur (`isBpdeWorkbook`, `parseBpdeWorkbook`, types `BpdeParsed*`, `LotImportIssue`, `BpdeImportStats`…) |
| Côté **vivant** | `SmartImportTriggerComponent` + `LotChantierImportService` + `ConfirmDialogService` |

Le vivant a **remplacé** une implémentation ad hoc par le framework générique. Les 283 lignes
supplémentaires côté mort sont l'ancienne approche, pas une fonctionnalité perdue.

Les autres écarts (`chantier-edit` +19, `chantier-detail` +16, `reception-detail` +14,
`etudes.routes` +7, `erp-nav.generated` +7, `chantier.mapper` +7, `erp-doc-scan.service` +5)
sont du même ordre, dont deux expliqués par la suppression du module `consultation` (lot 8).

---

## Découverte : `smart-import` existe déjà et est branché IA

Ce que l'inventaire a mis au jour, au-delà de son objet :

```
web/app/platform/features/documents/smart-import/
  components/   trigger, review-dialog, edit-dialog, data-table, tree-table, record-table
  services/     smart-import-orchestrator.service
  models/       smart-import.model, smart-import.errors

web/app/applications/erp/shared/extraction-schemas/
  article · client · employe · fournisseur · lot-chantier · ouvrage · reception-bl

web/app/applications/erp/shared/smart-import/handlers/
  un service d'import par domaine, avec dedupeKey et persistance
```

Chaque schéma porte ses **`instructions` LLM** — l'extraction IA est déjà en place, pas à
construire.

**Impact sur l'epic étude de prix** : les specs des lots 3 et 4 ont été corrigées pour s'appuyer
dessus au lieu d'écrire un parseur. `ouvrage.schema.ts` importe déjà les ouvrages, mais
« header only » : le lot 4 doit l'étendre aux composants et rendements, pas créer un second
chemin.

---

## Reste à faire (phase 1 close)

Les arbres morts peuvent être supprimés sans perte à la phase 3. Aucune récupération
supplémentaire n'est nécessaire.
