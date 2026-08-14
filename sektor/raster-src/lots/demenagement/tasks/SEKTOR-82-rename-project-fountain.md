---

id: SEKTOR-82
status: done-me
context: nafura
type: tech
priority: P2
assignee: agent
gate: none
sprint: 2026-W33
blocked_by: [SEKTOR-80]
---

# Renommer le projet Angular project-fountain → sektor

> Le nom de scaffold n'a plus rien à faire dans le dist, Docker, ni `ng run`.

## Étapes

- [x] `angular.json` / `package.json` : projet `sektor`, `outputPath` `dist/sektor`
- [x] `Dockerfile.web` COPY `sektor/web/dist/sektor/browser`
- [x] Drop `web/dist/project-fountain` dans `.dockerignore` racine (chemins morts)
- [x] JWT `issuer: 'project-fountain'` dans platform-web : hors contrat Angular → inbox

## Preuve de fin

Plus de `project-fountain` dans Sektor web. Docker COPY aligne `dist/sektor/browser`.

## Journal

```
14/08 00:42  tsk1  angular.json + package.json + package-lock : projet sektor, dist/sektor.
14/08 00:42  tsk2  Dockerfile.web COPY sektor/web/dist/sektor/browser. .dockerignore : drop web/dist + exception project-fountain.
14/08 00:42  tsk3  JWT issuer/audience platform-web → inbox (pas le nom Angular).

Livré : le projet Angular s'appelle sektor
```
