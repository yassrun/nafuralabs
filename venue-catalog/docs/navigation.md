---
specVersion: 1
kind: navigation
appId: venue-catalog
status: draft
language: fr
---

# Venue Catalog - Navigation et routes

## 1. Hotes et entrees applicatives

| Audience | Hote | Description |
|---|---|---|
| Back-office catalogue | `catalog.nafura.ma` | Revue et publication des lieux partages. Auth requise. |
| Service consumer | pas d'UI | Pull API interne securisee par token machine-to-machine. |

En mode mock/dev, un hote unique `localhost` suffit avec les routes `/catalog/*`.

## 2. Layouts

| Layout | Audience | Composants |
|---|---|---|
| `admin-shell` | ops catalogue | sidebar gauche, header avec filtres pays/app |
| `split-review` | revue detail | liste a gauche, detail editable a droite |

## 3. Sitemap back-office

```
/catalog/search                    catalog-search.screen
/catalog/places/:placeId          catalog-place-review.screen
/catalog/mappings/:mappingId      catalog-mapping-review.screen
/catalog/jobs/:jobId              catalog-search.screen (drawer job detail)
```

Guards :
- toutes les routes exigent auth.
- `/catalog/search` : roles `PLATFORM_ADMIN`, `CATALOG_OPERATOR`, `APP_EDITOR`.
- `/catalog/places/:placeId` : roles `PLATFORM_ADMIN`, `CATALOG_OPERATOR`.
- `/catalog/mappings/:mappingId` : roles `PLATFORM_ADMIN`, `APP_EDITOR`.

## 4. Menus principaux

### 4.1 Sidebar admin
- Recherche et imports -> `/catalog/search`
- Jobs -> drawer/filtre depuis `/catalog/search`
- Mappings -> via liens contextuels depuis un lieu ou un filtre app cible

## 5. Conventions de breadcrumb

Format : `Catalog > Section > Detail`.

Exemples :
- `Catalog > Search > Cafe del Mar Rabat`
- `Catalog > Mappings > Layali / sky31-casablanca`

## 6. Redirections et fallbacks

- `404` global : composant standard not-found, retour `/catalog/search`.
- `403` global : message permission manquante, sans proposer de route publique.
- job introuvable : toast d'erreur + retour sur les resultats de recherche.

## 7. Open questions

- Une liste dediee `/catalog/mappings` est-elle necessaire en V1 ou l'acces contextuel depuis la fiche lieu suffit-il ? Decision provisoire : acces contextuel suffit.
