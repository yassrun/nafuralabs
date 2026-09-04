# ROADMAP — Sektor

> Ordre des lots. **Écrite à la main**, hors `raster-src/`, non indexée.
> Au-dessus de la borne : ouvert à l’orchestrateur.

## Ouvert

1. **homogenisation-ux** — unifier actions (retour / save / create / delete), filtres listing et `nf-*` sur **Études · Achats · Catalogue · Chantiers** · contrat [`raster-src/lots/homogenisation-ux/CONTRAT.md`](raster-src/lots/homogenisation-ux/CONTRAT.md) · [`LOT.md`](raster-src/lots/homogenisation-ux/LOT.md)
2. **raffinement-ux-pro** — **bouclé 28/08** · combobox FK, picker article, consultations, fournisseur/BC, cockpit, ops chantiers, catalogue lignes/parc · [`raster-src/lots/raffinement-ux-pro/LOT.md`](raster-src/lots/raffinement-ux-pro/LOT.md)
3. **consultation** — métier + UX chrome + RFQ destinataires **bouclés** · **ouvert** sous-lot `destinataires-brouillon-cc` (brouillon + Enregistrer, N contacts To+CC, onglet Contacts + onglet Contrats sur la fiche fournisseur). Write-through **cassé**.
4. **etudes** — finition-parcours bouclé · picker-article bouclé (28/08)

5. **chantiers** — raffinement du BC : arbre vendu / interne, avancement en quantité, situation cumulative, budget par nœud, continuité Étude–Devis–Chantier et cockpit décisionnel. 14 gels du 23/08 dans [`raster-src/DECISIONS-PRODUIT-CHANTIER.md`](raster-src/DECISIONS-PRODUIT-CHANTIER.md) · découpe dans [`raster-src/lots/chantiers/LOT.md`](raster-src/lots/chantiers/LOT.md).
   Contrainte qui prime : **le palier 1 marche sans planning** — un chantier converti est facturable le jour même. Le planning (paliers 2 et 3) est la vague 2, pas encore coupée.
   **Maintenant :** palier 1 chantiers + planning 176–184 + budget 248 + qa-mode-b 189 + raffinement 210 **bouclés** · **finition-parcours 214–219 bouclé** (28/08) · **raffinement-ux-pro bouclé** (28/08).

<!-- borne -->

> Borne déplacée le 23/08/2026 pour ouvrir `chantiers` — **acte humain délégué** à l'orchestrateur ce jour-là, pas une initiative d'agent (`AGENTS.md` §7 : « déplacer la borne est ton acte de planification »).

5. **qa-mode-b** — contrat agents Mode B (auto-login owner) — docs, pas la fenêtre produit
6. **plier-archi** — Études consomme Catalogue via `api` (déjà PLAN, tasks balayées)
7. **lookups** — absorbé par **`raffinement-ux-pro/socle-lookups-combobox`** · archive [`raster-src/lots/_archive/lookups/`](raster-src/lots/_archive/lookups/)
8. **stabiliser-sources** / **aligner-arbre** / **monter-angular-*** — lots d’arbre, pas ce cycle
