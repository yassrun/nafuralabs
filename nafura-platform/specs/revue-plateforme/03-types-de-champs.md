# 03 — Types de champs unifiés

> Revue 2026-10-07, doublon D3. Taille **S** (front). Aucune dépendance.

## Objectif

Un seul jeu de types de champs : `FormFieldType`, rendu par `nf-form`, utilisable dans `RecordPageConfig` et dans les formulaires d'action (`PageForm`). Les champs marocains deviennent disponibles pour les BCs.

## Besoin

- `FormFieldType` (fiche host, `PageForm`) : `text`, `textarea`, `number`, `email`, `password`, `date`, `datetime`, `select`, `multiselect`, `checkbox`, `radio`, `file`, `autocomplete`, `richtext`, `custom`.
- `DetailFieldType` (ancienne fiche `nf-entity-detail`) a en plus : `url`, `tel`, `currency`, `toggle`, `time`, `daterange`, `image`, `ice`, `rib`, `phone-ma`, `money-ma`.
- Les atomes existent (`nf-ice-input`, `nf-rib-input`, `nf-phone-ma-input`, `nf-money-input`, `nf-ville-ma-select`), mais un BC ne peut pas les utiliser dans une fiche. Sektor (fournisseurs, clients) en aura besoin dès sa reconstruction sur le host.
- Le descripteur du record connaît `money` (+ `currency`), mais aucun champ de saisie ne lui correspond.
- `custom` figure dans `FormFieldType` sans contrat visible côté `RecordPageConfig` (pas de gabarit fourni) : il faut le définir ou le retirer.

## Existant

- Types : `lib/anatomy/types/index.ts` (l. 510 `FormFieldType`, l. 530 `FormFieldConfig`, `DetailFieldType` juste après).
- Rendu de la fiche host : `platform/record/record-page.component.ts` → `nf-form`.
- Rendu des types marocains : `lib/anatomy/components/organisms/entity-detail/entity-detail.component.ts`.

## Contrat

### Lot 1 — Types ajoutés à `FormFieldType`

| Type | Atome | Valeur stockée | Remarque |
|---|---|---|---|
| `money` | `nf-money-input` | nombre | `currency` sur le champ, sinon celle de la propriété (`/properties`), sinon MAD |
| `ice` | `nf-ice-input` | chaîne de 15 chiffres | contrôle de la clé |
| `rib` | `nf-rib-input` | chaîne de 24 chiffres | contrôle de la clé |
| `phone-ma` | `nf-phone-ma-input` | E.164 | |
| `city-ma` | `nf-ville-ma-select` | code ville | |
| `switch` | `nf-switch` | booléen | Alias visuel de `checkbox`. Ne l'ajouter que si un écran en a besoin. |

- `money-ma` et `currency` ne sont **pas** repris : `money` avec `currency` les couvre.
- `url`, `tel`, `time`, `daterange` et `image` ne sont repris que si un écran de la plateforme ou d'un BC les utilise (à vérifier pendant [02](02-fiche-unique.md)).

### Lot 2 — Type déduit du descripteur

- Quand la fiche connaît les propriétés du record (`/properties`), un champ sans `type` prend le type de la propriété : `money` → `money`, `date` → `date`, `select` → `select` avec ses options, `relation` → `select` sur l'API `/options` de la cible.
- Si le champ déclare un `type` explicite, c'est lui qui s'applique.

### Lot 3 — `custom`

- Le retirer de `FormFieldType` s'il n'a aucun utilisateur. Sinon, documenter son contrat dans UI.md. Le besoin d'un bloc libre passe par la section d'écran ([07](07-section-ecran.md)), pas par un champ.

### Lot 4 — Suppression de `DetailFieldType`

- Après [02](02-fiche-unique.md), si Sektor n'importe plus `DetailFieldType`. Sinon, le marquer `@deprecated` ([04](04-heritage-sektor.md)).

## Règles

- Validation côté serveur aussi : une annotation Bean Validation par format (`@Ice`, `@Rib`, `@PhoneMa`) dans `core/framework`, que le BC pose sur l'entité. Le contrôle web ne remplace pas le contrôle serveur.
- Les libellés d'erreur sont en français, dans `platform/host/i18n/fr.json`.

## Vérification

1. `node platform-host/ops/run.mjs check`.
2. BC démo : ajouter `ice`, `rib` et `phone` au fournisseur (descripteur, migration, seed, `suppliers.ts`). Saisir un ICE faux : erreur sur le champ, et 400 si on force l'API.
3. Montant d'une demande d'achat en `money` : séparateurs fr-MA et devise affichée.

## Critères d'acceptation

- [x] Les 5 types marocains et `money` sont utilisables dans `RecordPageConfig` et dans `PageForm`.
- [x] Le BC démo en utilise au moins trois (règle 11 d'ARCHITECTURE.md).
- [x] Annotations serveur `@Ice`, `@Rib`, `@PhoneMa` testées.
- [x] `custom` est documenté ou retiré.

## Documentation

- `docs/UI.md` § Champs, colonnes, filtres : liste des types à jour.
- `docs/PLATFORM.md` § Le descripteur du record : correspondance entre type de propriété et type de champ.
