# ROADMAP — Sektor

> Ordre des lots. **Écrite à la main**, hors `raster-src/`, non indexée.
> Au-dessus de la borne : ouvert à l’orchestrateur.

## Ouvert

1. **lookups** — combobox FK (client, fournisseur, …) : recherche serveur, pas de dump ; œil = fiche si id, liste si vide. Enum = select natif. Article = picker déjà gelé. Gel 23/08.
2. **consultation** — objet Achats · overlay étude = liste liées (pas formulaire) · devis = import magique · flag CONSULTÉ si liée (gel 22/08 + overlay 23/08)
3. **etudes** — Extraire + parcours QA livrés · ancien panneau consultation **à remplacer** par le lot `consultation`

4. **chantiers** — raffinement du BC : arbre vendu / interne, avancement en quantité, situation cumulative, budget par nœud, continuité Étude–Devis–Chantier et cockpit décisionnel. 14 gels du 23/08 dans [`raster-src/DECISIONS-PRODUIT-CHANTIER.md`](raster-src/DECISIONS-PRODUIT-CHANTIER.md) · découpe dans [`raster-src/lots/chantiers/LOT.md`](raster-src/lots/chantiers/LOT.md).
   Contrainte qui prime : **le palier 1 marche sans planning** — un chantier converti est facturable le jour même. Le planning (paliers 2 et 3) est la vague 2, pas encore coupée.

<!-- borne -->

> Borne déplacée le 23/08/2026 pour ouvrir `chantiers` — **acte humain délégué** à l'orchestrateur ce jour-là, pas une initiative d'agent (`AGENTS.md` §7 : « déplacer la borne est ton acte de planification »).

5. **qa-mode-b** — contrat agents Mode B (auto-login owner) — docs, pas la fenêtre produit
6. **plier-archi** — Études consomme Catalogue via `api` (déjà PLAN, tasks balayées)
7. **stabiliser-sources** / **aligner-arbre** / **monter-angular-*** — lots d’arbre, pas ce cycle
