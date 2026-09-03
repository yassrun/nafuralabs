# Raster Web

UI locale de l’orchestrateur Raster.

- **Stack** : Vite + React + TypeScript
- **Port** : `http://127.0.0.1:4210`
- **API** : middleware Vite — scan `**/raster-src/lots/**/tasks` — **aucun** chemin legacy. Pas de BDD.

```bash
cd raster/sources/web
npm install
npm run dev
```

Vues : Captures (inbox) · Ready · Session. Contrat : `raster/AGENTS.md`.

## Harness Cursor

Raster choisit le mode, prépare le brief et lance un runner externe. Les clés et commandes restent hors dépôt.

```powershell
$env:CURSOR_API_KEY = "..."
$env:RASTER_CLOUD_REPO = "https://github.com/org/repo"
$env:RASTER_CLOUD_REF = "main" # optionnel
npm run dev
```

- **Local** : une Task Code à la fois dans le worktree du sous-lot.
- **Agents cloud** : le brief contient la vague de Tasks Code indépendantes que le runner peut paralléliser.

Le runner `@cursor/sdk` est intégré. `RASTER_LOCAL_CMD` et `RASTER_AGENTS_CMD` permettent de le remplacer ; `RASTER_AGENT_CMD` reste l’alias local historique.
Le runner cloud doit relayer son résultat sur stdout au format
`RASTER_RESULT {"done":["ID"],"blocked":[]}`. Raster borne ces mutations aux IDs de la vague, puis relance automatiquement le front suivant.
