# ROADMAP — Raster

> L'ordre des lots. **Écrite à la main**, hors `raster-src/`, **non indexée** par Raster.
> Ce qui est **au-dessus de la borne** est ouvert à l'orchestrateur ; en dessous, non.
> Déplacer la borne = planifier. Contrat : [`AGENTS.md`](AGENTS.md) §7.

## Ouvert

1. **cadre** — `CH-01-EVOL-orchestration-autonome` — **fait** (RAS-78, balayée)

2. **work** — `CH-02-EVOL-ecriture-et-readiness`
   Commandes d'écriture de `t.mjs` (`new` · `promote` · `sprint` · `status` · `approve`) et readiness dérivée.
   Ferme le problème d'origine : plus aucun agent n'écrit de frontmatter à la main.

3. **orchestration** — `CH-00-INIT-conduite`
   Le BC qui porte la conduite. SPEC, lecture de la roadmap et de la borne, skill `orchestration` + agents.
   Dépend de la readiness (RAS-85 ← RAS-81) : première dépendance croisée entre sous-lots.

4. **socle** — `CH-01-EVOL-panneau-decision`
   L'UI. Vue Toi, question et rapport affichés, readiness dans l'arbre, serveur repassé par `t.mjs`.
   Revue du 16/08, 8 constats. Wireframe : [`pact/socle/ux/decision-wireframe.canvas.tsx`](pact/socle/ux/decision-wireframe.canvas.tsx).

5. **orchestration** — `CH-01-EVOL-spawn-worktree`
   Le spawn réel et les worktrees. C'est la seule chose qui **exécute** quelque chose : la commande
   d'agent et sa clé vivent hors du dépôt, et Raster refuse de démarrer plutôt que de les stocker.
   `gate: me` sur le spawn — tu vois le rapport avant que ça puisse lancer.

6. **work** — `CH-03-CORRECTION-sweep-blocked-by`
   Le balayage du 16/08 a orphelin des `blocked_by`. Une dépendance satisfaite devenait
   une dépendance inconnue, donc bloquante — `SEKTOR-97` s'est retrouvé inlançable.

<!-- borne -->

## Pas encore

Rien. Le chantier est ouvert jusqu'au bout.

---

**Amorce.** `RAS-78`, puis `RAS-79` → `RAS-87`, ont été écrites à la main : la commande qui les créerait est
justement `RAS-79`. C'est la seule exception à `AGENTS.md` §0.1-9, et elle se referme à la fin du lot 2.
