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

<!-- borne -->

## Pas encore

5. **orchestration** — le spawn réel et les worktrees.
   Suppose un processus et une clé de modèle. Reste sous la borne **exprès** : c'est la seule chose
   qui exécute quelque chose, et le CADRE dit « le dépôt suffit à lire, pas à exécuter ».

---

**Amorce.** `RAS-78`, puis `RAS-79` → `RAS-87`, ont été écrites à la main : la commande qui les créerait est
justement `RAS-79`. C'est la seule exception à `AGENTS.md` §0.1-9, et elle se referme à la fin du lot 2.
