# PDF serveur — démo (Playwright)

Objectif **12.3** : offrir une voie documentée pour produire un PDF fidèle à partir d’une page ou d’un fichier HTML, sans intégrer de serveur HTTP dans le repo Angular.

## Contrat minimal (démo)

| Entrée | Sortie |
|--------|--------|
| URL `http(s)…` **ou** chemin local vers un fichier `.html` | Fichier `.pdf` |

- Les pages Angular nécessitent un `ng serve` (ou build statique servi) pour les URLs applicatives.
- Les fichiers HTML locaux sont passés en `file:///` automatiquement par le script.

## Prérequis

- Node 20+
- Navigateurs Playwright : `npm run e2e:install` (déjà requis pour les e2e).

## Commande

```bash
npm run pdf:demo -- http://127.0.0.1:4200/dashboard dist-demo/dashboard.pdf
```

Ou directement :

```bash
node scripts/pdf-demo/render-pdf.mjs http://127.0.0.1:4200/dashboard dist-demo/dashboard.pdf
```

## Intégration API (prod / hors démo)

1. Exposer un endpoint `POST /pdf` avec corps `{ "url": "https://…" }` ou `{ "html": "<!doctype html>…" }`.
2. Côté serveur Node, écrire le HTML dans un fichier temporaire si besoin, puis appeler la même primitive que ce script (`playwright pdf`).
3. Retourner le PDF en `application/pdf` avec `Content-Disposition: attachment`.

Pour le HTML inline sans URL, pattern recommandé : `fs.writeFileSync(tmp, html)` puis `playwright pdf file:///…/tmp.html out.pdf`.
