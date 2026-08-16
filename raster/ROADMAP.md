# ROADMAP — Raster

> L'ordre des lots. **Écrite à la main**, hors `raster-src/`, **non indexée** par Raster.
> Ce qui est **au-dessus de la borne** est ouvert à l'orchestrateur ; en dessous, non.
> Déplacer la borne = planifier. Contrat : [`AGENTS.md`](AGENTS.md) §7.

## Ouvert

1. **cadre** — `CH-01-EVOL-orchestration-autonome`
   Porter les huit décisions du 16/08 dans le CADRE. `gate: me` : rien n'avance sans toi ici.

<!-- borne -->

## Pas encore

2. **work** — commandes d'écriture de `t.mjs` (`new` · `promote` · `sprint` · `status`) et readiness dérivée.
   Dépend du cadre : c'est lui qui dit si l'orchestration reste dans `work`.

3. **orchestration** *(BC à créer — le CADRE décidera s'il en est un)*
   Lecture de la roadmap et de la borne, spawn de l'orchestrateur de lot, skill `orchestration` + agents `exec` / `spec` / `qa`.

4. **socle** — l'UI. Readiness affichée, vue exécution (ce qui tourne), rapports de livraison lisibles,
   serveur repassé par `t.mjs`, briefs morts retirés. Revue du 16/08, 8 constats.

---

**Amorce.** `RAS-78` est écrite à la main : la commande qui la créerait est dans le lot 2.
C'est la seule exception à `AGENTS.md` §0.1-9, et elle se referme d'elle-même.
