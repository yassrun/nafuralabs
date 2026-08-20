# Décisions figées — Sektor (code)

> Jusqu’au CADRE. Le CADRE § Vocabulaire reprendra ces termes ; jusque-là c’est la loi des dossiers.
> Pas dans `PACT_BLUEPRINT.md` (méthode, pas le produit).
>
> Produit études (cycle poste / articles / ouvrages, chrome) : [`DECISIONS-PRODUIT.md`](DECISIONS-PRODUIT.md) — avant SPEC.

Gelé 14/08/2026.

**Web suit le backend.** `sources/web/app/<nom>` = `sources/backend/<nom>`. Pas de `modules/`, pas de `business-context/`. Pas de dossier web sans jar, pas de jar sans dossier web. `app/` backend = boot Spring seulement.

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
| Études | dossiers (étude = AO), devis | bibliothèque, `/catalogue` G2, mètres, listing AO legacy |
| Catalogue | articles, familles, UoM, stock, mouvements, ouvrages, matériel | |
| Achats | demandes, AO, commandes, fournisseurs | |
| Marchés | contrats, avenants, cautions… | clients / factures ventes |
| Ventes | clients, offres, factures | |

Routes inchangées dans cette passe (`/inventory/…`, `/etudes/bibliotheque-prix`). Seulement le chrome.
