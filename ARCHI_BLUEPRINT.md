# Blueprint — Archi

**Statut :** figé (2026-08-14)  
**Archi** = comment on **coupe le code** d’une app Pact (packages, dépendances, APIs).  
Pact dit le contrat : [`PACT_BLUEPRINT.md`](PACT_BLUEPRINT.md). Archi dit la forme du code.  
Ops : [`OPS_BLUEPRINT.md`](OPS_BLUEPRINT.md). Raster : [`RASTER_BLUEPRINT.md`](RASTER_BLUEPRINT.md).

Pas dans le CADRE, pas dans une SPEC, pas dans un `00-PLAN.md`. Arbre **produit** (quels BC) : CADRE + `DECISIONS.md` du projet jusqu’au CADRE.

---

## Topologie d’une app

```text
                 Gateway (in) — assembler `app/` + ingress
            /        |         \         \
        BC1 API   BC2 API   BC3 API   Socle API
           |         |          |          |
          BC1       BC2        BC3       Socle
           |                               |
      adapter (BC-owned)            Platform BCs
           |                               |
      external X                    Keycloak / MinIO / …
```

- **Gateway** = entrée client. Il **fan-out** vers les `BC API` et vers `Socle API` (session, who-am-I, erreurs). Ce n’est pas un contexte Pact.
- **Socle** n’est pas la porte métier. Interdit : `Gateway → Socle API` comme unique entrée, Socle qui route vers les BC.
- **BC API** = surface **publiée** du BC. Pas une chaîne `BC API → BC API → BC API`. Un BC délivre de la valeur sans un autre BC ; seul le socle est une dépendance dure ([Pact — Règle BC](PACT_BLUEPRINT.md#règle-bc)).
- Trait **pointillé** entre deux `BC API` seulement s’il existe un fait publié (id, snapshot, commande). Jamais comme topologie principale.

Surfaces back / front / mobile = **la même app**, le **même** BC. Un module Gradle / package npm n’est pas un BC.

---

## Intérieur d’un BC

```text
<bc>/
  api/            inbound — HTTP / DTOs / ce que les autres ont le droit d’appeler
  domain/         objets, états, INV / R — le BC
  services/       use-cases ; orchestrent, ne portent pas les invariants
    port/
      capability/ → Socle / Platform exécute (LLM, docs, notif, approbation)
      bc/         → autre BC de l’app (cible = son `api` seulement)
  repositories/   persistance (adapter outbound DB)
  adapters/
    capability/   même découpe que `port/` — qui fait le travail
    bc/
    external/     voisin **de ce BC** (Batiprix, banque, EDI) — pas platform
  internal/       helpers privés — dates, mapping. Jamais « socle »
```

Un port et son adapter ne vivent **pas** dans le même dossier. Même nom de sous-dossier des deux côtés (`capability` / `bc` / `external`) pour naviguer. Pas de dossier `socle/` dans un BC — `capability/` = « je consomme une capacité déclarée au socle ». Si **ce** BC exécute (propre DB, seam de test) : laisser à la racine de `port/` / `adapters/`, pas forcer un seau outbound.

**Direction**

```text
api        →  services  →  domain
                ↓    ↓
         repositories  adapters  (et port Socle)
```

- `domain` ne connaît ni HTTP, ni JPA, ni un voisin, ni le Socle.
- `api` n’appelle pas `repositories`.
- `adapters` ne sont pas appelés par un autre BC — seulement les services de **ce** BC.
- Pas de dossier `socle/` dans un BC. Le Socle est un contexte d’app. Helpers locaux → `internal/`. Si plusieurs BC en ont besoin → **Socle d’app**, pas une copie.

Parler **au** Socle = un **port** (comme un adapter), voisin = Socle API, pas Batiprix.

Web : mêmes noms de dossiers que le backend (`sources/web/app/<bc>/` = `sources/backend/<bc>/`). Pages ≈ inbound `api` ; clients HTTP ≈ `adapters`.

---

## Socle

Contexte **transverse**. Même *forme* Pact qu’un BC (SPEC + canvas), job différent : capacités, politiques, rôles — pas d’objets métier / machine d’états.

Un BC **consomme** le Socle (auth, tenant, erreurs, audit, nav, ICE/RC, approbations).  
Capacité déjà là → déclaration dans la SPEC (`Liens: consomme`).  
Capacité neuve → `EVOL` socle **d’abord**, Change du BC ensuite.

Le Socle **contraint** (`POL-*`, matrice allow/deny). Le BC référence les IDs, il ne les recopie pas.

**Anti-obésité :** toute capacité du Socle nomme au moins un BC consommateur. Le Socle ne route pas le métier. Le Socle ne dépend pas d’un BC (sens actuel `socle → catalogue|chantiers|…` = dette).

---

## Externes

Deux boîtes, deux flèches. Le Gateway **inbound** n’est pas l’adapter **outbound**.

| Voisin | Où | Chemin |
|--------|-----|--------|
| **Partagé** (Identity, docs, mail, object storage) | BC **platform** | `BC → Socle API` (`PLATFORM_CONSUMED`) `→ Platform BC → infra` |
| **D’un BC** (Batiprix, CNSS, banque, EDI) | `adapters/` de **ce** BC | `BC API → services → adapter → external` |

Si **deux** BC ont besoin du même externe : ce n’est pas un jar `adapters` partagé. C’est **platform** (infra partagée) ou **le BC qui possède le concept** (l’autre consomme un id / snapshot).

Pas de composant « integrations » / ESB que tous les BC appellent.

---

## Deux BC se parlent

Pas d’HTTP BC → BC. Un process (modulaire monolith) : le consommateur appelle **seulement** le `api` publié du fournisseur.

```text
Études.services
    → Études.adapters          (port du consommateur)
        → Catalogue.api        (id + snapshot + commandes)
            → Catalogue.services → domain
```

| Besoin | Ce qui traverse | Ex. Sektor |
|--------|-----------------|------------|
| Lire un référentiel | **id + snapshot** | Études pose un article Catalogue sur un composant |
| Figer un fait | **copie**, pas un join live | gel de prix sur le DPU |
| Déclencher l’aval | **commande** sur l’API de l’autre BC | devis accepté → `Chantiers.api.create(...)` |

Le consommateur a un `port` + un adapter. L’adapter cible **uniquement** `<voisin>/api`. Jamais `domain` / `repository` / `services` du voisin.

Gradle : `implementation project(':sektor:catalogue')` n’est pas un lien Pact. Cible = dépendre du contrat `api` seulement (jar `*-api` si on veut le rendre checkable). Aujourd’hui les modules injectent encore `ItemRepository`, `ChantierService`, etc. — **dette**, pas le modèle.

Web : `app/etudes/` parle à `/api/etudes/…`. Un libellé article = snapshot déjà dans l’étude, ou appel à **l’API Catalogue**.

---

## Interdits

- Gateway métier qui n’entre que par le Socle
- Chaîne obligatoire `BC API → BC API → BC API`
- Dossier `socle/` (helpers) à l’intérieur d’un BC
- BC qui importe `domain` / `repository` / `services` d’un pair
- HTTP entre BC d’une même app
- Adapter d’externe partagé recopié dans chaque BC (MinIO, SMTP, Keycloak)
- Socle qui connaît le métier d’un BC (router, BFF, jointure)
- Backend / frontend / mobile comme BC distincts

---

## Tenir

Niveau **agent** aujourd’hui. Check Gradle / package (un BC ne compile que contre `socle` + `*:api` des pairs) : **à construire**.

Arbre des dossiers Sektor (catalogue, études, …) : [`sektor/raster-src/DECISIONS.md`](sektor/raster-src/DECISIONS.md) jusqu’au CADRE.
