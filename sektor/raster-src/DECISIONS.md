# Décisions figées — Sektor (code)

> Jusqu’au CADRE. Le CADRE § Vocabulaire reprendra ces termes ; jusque-là c’est la loi des dossiers.
> Ce fichier porte les décisions produit, pas les règles du moteur Raster.
>
> Produit études (cycle poste / articles / ouvrages, chrome) : [`DECISIONS-PRODUIT.md`](DECISIONS-PRODUIT.md) — avant SPEC.
> Produit chantier (arbre du chantier, planning, ressources) : [`DECISIONS-PRODUIT-CHANTIER.md`](DECISIONS-PRODUIT-CHANTIER.md) — avant SPEC.

Gelé 14/08/2026. Coupe platform / app / lots Raster : gel 27/08/2026.

**Web suit le backend.** `sources/web/app/<nom>` = `sources/backend/<nom>`. Pas de `modules/`, pas de `business-context/`. Pas de dossier web sans jar, pas de jar sans dossier web. `app/` backend = boot Spring seulement.

## Coupe — Pact (platform, app, socle, BC)

**Pact** décrit cette coupe. Raster organise le travail. Canon : [`ARCHI_BLUEPRINT.md`](../../ARCHI_BLUEPRINT.md).

```text
nafura-platform          ← projet platform (SDK, identité, docs, mail, infra partagée)
        ↓ consommée
sektor                   ← l’app
        ├── socle        ← transverse de CETTE app (pas un BC métier)
        ├── catalogue
        ├── etudes
        ├── chantiers
        └── …            ← un dossier = un BC (même nom back et web)
```

- **Platform** n’est pas un dossier dans Sektor. Travail platform → `nafura-platform/raster-src/`.
- **Socle** : capacités, politiques, chrome d’app. Pas d’objets métier (étude, chantier, article).
- **BC** : livre sans un autre BC ; seule dépendance dure = socle. Parole à un pair = son `api` seulement.

## Raster — un BC = un lot permanent

Convention Sektor, pas une règle du moteur Raster.

| Objet Pact | Objet Raster |
|---|---|
| BC d’app (`etudes`, `chantiers`, `catalogue`, …) | lot **permanent** `sektor/raster-src/lots/<bc>/` |
| Vague / tranche livrable dans ce BC | sous-lot + `00-PLAN.md` |
| Bug / dette du BC | task dans le sous-lot concerné (si le lot a des sous-lots : **pas** `lots/<bc>/tasks/`) |
| Socle / chrome transversal | autre lot (`lookups`, …), pas un faux BC |
| Platform | lots dans `nafura-platform/`, jamais un lot Sektor |

Le dossier du lot BC reste. La ROADMAP ouvre ou referme le chapitre avec la borne. On ne recrée pas un lot à chaque cycle.

Exceptions déjà dans l’arbre : `consultation` (objet Achats avec sa propre borne), `lookups` (geste chrome), `plier-archi` / `aligner-arbre` / `monter-angular-*` (arbre, pas métier).

## Arbre cible (identique)

```text
socle/            kernel app · ICE/RC (type) · approbations · analytics/pilotage
catalogue/        articles · UoM · stock · mouvements · ouvrages / bibliothèque-prix
etudes/           dossiers · devis · AO clients  — pas la bibliothèque · mètres à sortir (voir DECISIONS-PRODUIT)
chantiers/
marches/
achats/           + fournisseurs
ventes/           + clients
finance/          + devises / taux  (ex-currency)
rh/
hse/
```

## catalogue

Un seul dossier, des deux côtés. Référentiel de ce qu’on connaît et de ce que ça coûte : **articles + UoM + stock + ouvrages / prix**. Nom de produit (Batiprix marocain).

Interdit : `inventory/`, `stocks/`, un second `catalogue-btp/`. `etudes/bibliotheque-prix` **rejoint catalogue**. etudes consomme, il ne possède plus.

Noms morts → `catalogue/` : `item/`, `stock/`, web `inventory/`, le `catalogue/` web actuel (console) fusionne dans celui-là.

## partner

**Supprimé.** Fournisseurs → `achats/`. Clients → `ventes/`. Pas d’annuaire. Même boîte des deux côtés = ICE/RC au socle, deux fiches.

## ICE / RC

Socle : un type / identifiant légal. Pas une table « tiers ».

## finance

Devises et taux (`currency/` backend, `finance/devises` web) → **finance**, pas catalogue.

## Sidebar (chrome)

Gelé 20/08/2026. **Un item de premier niveau = un BC.** Labels métier, pas le mot « BC ». Pas de zones Fiori `operations / business / people`.

Ordre = cycle : Études → Catalogue → Achats → Chantiers → Marchés → Ventes → Finance → RH → HSE. Socle = tableau de bord + pilotage / analytics.

| Item | Contient | Hors item |
|------|----------|-----------|
| Études | dossiers (étude = AO), devis **client** | bibliothèque, `/catalogue` G2, mètres, listing AO legacy, **consultations** |
| Catalogue | articles, familles, UoM, stock, mouvements, ouvrages, matériel | |
| Achats | demandes, AO, **consultations**, commandes, fournisseurs | |
| Marchés | contrats, avenants, cautions… | clients / factures ventes |
| Ventes | clients, offres, factures | |

Routes inchangées dans cette passe (`/inventory/…`, `/etudes/bibliotheque-prix`). Seulement le chrome.
