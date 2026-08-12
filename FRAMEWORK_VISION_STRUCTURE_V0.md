# Vision structure — framework agentique Nafura

**Statut :** brouillon de discussion (en cours)  
**Lié à :** [`FRAMEWORK_DEVELOPPEMENT_AGENTIQUE_SPEC_DRIVEN_V1.md`](FRAMEWORK_DEVELOPPEMENT_AGENTIQUE_SPEC_DRIVEN_V1.md)  
**Date :** 2026-08-12

---

## 1. Décisions figées (session)

1. Aucun code sans spécification de changement approuvée.
2. **Lot Cadrage** = premier lot obligatoire de toute application (type `FRAMING`).
3. **Lot Socle** = deuxième lot obligatoire (type `FOUNDATION`, capacités transverses).
4. Puis lots métier = bounded contexts (`BUSINESS`).
5. Le Cadrage est un **lot vivant** : il subit des changements (`INITIALIZATION`, `EVOLUTION`, …).
6. Ajouter un BC (ex. HSE) = d’abord `EVOLUTION` du Cadrage, puis `INITIALIZATION` du lot métier.
7. Le Cadrage **n’a pas** à connaître tous les BC dès V1 — carte partielle + `TBD` OK.
8. **Éviter** le modèle actuel : produits qui consomment la platform via SDK monorepo in-process (`project(":platform:…")` / path aliases TS couplés).
9. **`nafura-platform` devient un produit pair**, au même niveau que Sektor et les autres apps.
10. Chaque produit possède son propre **`raster-src`** (specs / changements / tasks).

---

## 2. Structure cible (vision)

```text
nafuralabs/
├── nafura-platform/              # produit pair (plus un SDK in-process)
├── sektor/
│   └── raster-src/
│       ├── lot-cadrage/
│       │   ├── CHG-CAD-001 INITIALIZATION
│       │   └── CHG-CAD-002 EVOLUTION - <title>
│       │         ├── PLAN
│       │         ├── ARCHI
│       │         └── TASKS/
│       │               └── SEKT-001-001-001-<title>.md
│       └── lot-etude/
│           └── sous-lot-chiffrage/
│               └── CHG-… INITIALIZATION - <title>
├── venue-catalogue/
│   └── raster-src/
├── raster/                       # Raster est aussi un produit
│   └── raster-src/
├── ops/
├── compta/
└── perso/
```

### Ordre structurel d’une app (ex. Sektor)

```text
1. Lot Cadrage     [FRAMING]      ← premier requis
2. Lot Socle       [FOUNDATION]   ← transverse
3. Lots métier     [BUSINESS]     ← bounded contexts (+ sous-lots optionnels)
```

### Ordre temporel d’init

```text
CHG Cadrage INITIALIZATION
→ CHG Socle INITIALIZATION
→ CHG Lot métier 1 INITIALIZATION
→ …
```

---

## 3. Contenu normalisé du lot Cadrage

Optimisé pour être **lu par les agents de spec**, qui dérivent ensuite Socle + lots métier.

### Obligatoire

| Bloc | Rôle |
| --- | --- |
| Identité | `application_id`, nom, domaine, version cadrage |
| Finalité | ce que l’app doit permettre |
| Hors-scope | garde-fou anti-dérive |
| Acteurs | rôles principaux |
| Carte des lots | Socle + BC **connus** (`PLANNED` \| `ACTIVE` \| `TBD`) |
| Frontières connues | `owns` / `not_owns` par lot listé |
| Socle attendu | capacités + mode `LOCAL` \| `PLATFORM` \| `EXTERNAL` |
| Invariants applicatifs | règles cross-lots |
| Intégration inter-lots | style de contrats |
| Contraintes héritées | entreprise / solution / conformité |
| Ordre d’init | séquence de démarrage |
| Open questions | ambiguïtés ; bloquantes = pas d’APPROVED |

### Recommandé

Vocabulaire global · Décisions solution · Sources · Risques

### Interdit dans le Cadrage

Screens / wireframes détaillés · découpage BE/FE/DB · specs profondes d’un BC · stack/SQL · BC inventés

### Critère « Cadrage suffisant »

L’agent de spec peut, sans inventer :

1. produire l’`INITIALIZATION` du Socle ;
2. produire l’`INITIALIZATION` des BC déjà `PLANNED` ;
3. bloquer proprement si `TBD` ou open question critique.

---

## 4. Platform — intention (à préciser)

**Aujourd’hui (à éviter) :**

- Backend : Gradle `implementation project(":platform:…")`
- Frontend : aliases `@platform/*` → `platform/web/`
- Infra partagée OK (Keycloak, Postgres, …) mais SDK in-process couplé

**Cible (vision) :**

- `nafura-platform` = produit autonome avec son propre `raster-src`
- Les autres produits consomment la platform **sans** couplage monorepo in-process
- Mode de conso exact (**API distante / packages versionnés / autre**) : **à trancher**

Dans le Cadrage / Socle d’un produit, une capacité platform se déclare typiquement :

```yaml
foundation_capabilities:
  - { id: authn, mode: PLATFORM_CONSUMED }  # contrat local dans le Socle app
```

---

## 5. Sektor — notes d’alignement menu ERP

Source menu : `products/sektor-btp/web/app/shell/erp-nav.generated.ts`

Zones : work · operations · business · people · pilotage

Modules menu : Dashboard · Chantiers · Achats · Stock · Matériel · Études · Marchés & facturation · Finance · RH · HSE · Pilotage · Analytics

**Rappel :** menu ≠ lots. Le Cadrage décide les BC.

Écart Raster actuel (`etude`, `marche`, `chantier`, `appro`, `finance`) vs menu : Matériel, RH, HSE, Pilotage absents ou non formalisés ; Achats/Stock séparés au menu mais fondus dans `appro`.

Open questions Sektor :

- Stock = BC séparé ou sous-lot d’Appro ?
- Pilotage/Analytics = BC ou vues en lecture ?
- Facturation client = Marché ou Finance ?

---

## 6. Suite à discuter

- [ ] Mode de consommation `nafura-platform` (remplace le SDK in-process)
- [ ] Schéma exact `raster-src` (PLAN / ARCHI / TASKS sous chaque CHG)
- [ ] Convention d’IDs (`SEKT-001-001-001`, `CHG-CAD-00x`)
- [ ] Place du Socle dans l’arbre (`lot-socle` vs capacités dans platform)
- [ ] Migration depuis `products/sektor-btp/docs/specs/lots/` actuel
- [ ] Figer le template YAML du lot Cadrage dans le framework V1 (amendement)

---

*Document de travail — continuer la discussion ici.*
