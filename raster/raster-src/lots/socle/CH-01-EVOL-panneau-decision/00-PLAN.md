# Panneau de décision

> L'app cesse d'être un miroir de pilotage et devient un tableau d'arbitrage.

**Écrit après coup.** `check` l'exige (≥ 2 tasks exec) et il documente l'ordre réel, mais il n'a pas servi à décider : le découpage venait du wireframe et des huit constats de la revue. Un PLAN écrit après est un compte rendu, pas un plan — à ne pas prendre comme précédent.

## Verdict

Le moteur savait déjà répondre (`ready`, `window`, `approve`) ; l'app ne savait pas encore demander. C'est le seul lot qui rend visible tout ce qui a été construit aujourd'hui.

## Constat

- `raster-api.ts` écrivait les tasks en direct et réimplémentait l'allocation d'id — deuxième chemin d'écriture, contre §0.1-9
- L'app lisait le frontmatter et **jetait le corps** : le rapport de livraison n'était jamais affiché
- `blocked_by` affiché en gris, jamais croisé avec l'état des bloqueurs
- Les briefs pointaient vers `nafura-spec` / `nafura-exec` / `nafura-qa`, inexistants

## Approche technique

Le serveur d'abord : sans `question`, `rapport`, `attend` et `ready` dans l'API, le front n'a rien à afficher. Puis le front, qui n'est qu'un rendu de ces champs.

Contrainte découverte en route : esbuild refuse le shebang des `.mjs` quand il les inline dans la config Vite. Les quatre modules importés par le plugin l'ont perdu.

## Tasks

| # | Task | blocked_by | // OK |
|---|------|------------|-------|
| 1 | RAS-91 serveur — API et délégation au CLI | — | non |
| 2 | RAS-92 front — vue Toi et panneau | 1 | non |
| 3 | RAS-93 consolider `socle/SPEC.md` | 1, 2 | non |
| 4 | RAS-94 QA | 3 | non |

Aucune parallélisation : le front dépend du contrat d'API, la SPEC dépend des deux.

## Couverture

Couvre `AC-1` → `AC-6` de [`CH.md`](../../../../pact/socle/CH-01-EVOL-panneau-decision/CH.md).
Hors périmètre : la vue « ce qui tourne » — elle suppose un état d'exécution, donc le spawn, qui est sous la borne.

## Décisions ouvertes

Aucune — le CH est fermé.
