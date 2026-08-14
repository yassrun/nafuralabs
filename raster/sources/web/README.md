# Raster Web

UI locale de l’orchestrateur Raster.

- **Stack** : Vite + React + TypeScript
- **Port** : `http://127.0.0.1:4210`
- **API** : middleware Vite — scan `**/raster-src/lots/**/tasks` — **aucun** chemin legacy. Pas de BDD. Pas de `pact/`.

```bash
cd raster/sources/web
npm install
npm run dev
```

Vues : Inbox · Backlog · Sprint. Contrat : `raster/pact/work/SPEC.md`.
