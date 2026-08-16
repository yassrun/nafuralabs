# CH-06-TECHNICAL — un seau documents

**Type :** `EVOL` (forme `TECHNICAL` — même comportement, un nom de seau)
**Cible :** BC `documents`
**Qualification :** le contrat dit un seau `documents` + préfixe tenant. L'ops a encore `nafura-erp` / `nafura-documents`.

## Pourquoi

Un seau par produit ferait de documents le disque de Sektor. Isolation = tenant. Hygiène d'hébergement.

## Aujourd'hui

Originaux : `documents.minio.bucket=documents`. Pièces S3 : `app.storage.s3.bucket` (autre nom possible). Ops crée `nafura-erp` et `nafura-documents`.

## Attendu

Les deux formes de **ce** BC écrivent dans le seau `documents`. L'init MinIO crée `documents`. Pas de seau provisionné par un produit pour ce BC. Un produit peut garder un seau **à lui** pour du média qui ne passe pas par documents (hors contrat).

## Critères d'acceptation (gelés)

- **AC-1** Config pièces et originaux nomment le seau `documents`.
- **AC-2** L'init ops crée `documents` pour ce BC (plus comme seau requis `nafura-erp` / `nafura-documents` pour documents).

## Preuves attendues

| Scénario | État initial | AC |
|----------|--------------|----|
| `documents-seau-config` | sources config + init MinIO | AC-1, AC-2 |

Même comportement métier. Après `CH-05`.

## Hors périmètre

Seau par tenant · seau par produit pour documents · média catalogue Venue · unifier pièce/original → `CH-07`
