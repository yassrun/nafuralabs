# Gap-test extraction BDP

Comparaison **extracteur déterministe** vs **référence LLM** sur les 4 fichiers de `BDP/`.

## Contenu

| Dossier | Rôle |
|---|---|
| `extractor/*.json` | Sortie `bordereau-grid-prototype` v3 |
| `llm/*.json` | Référence LLM (lecture indépendante des dumps) |
| `raw/*.rows.json` | Lignes brutes (source commune) |
| `compare/GAPS.md` | Rapport d'écarts |
| `compare/gaps.json` | Écarts machine-lisibles |

## Relancer

```bash
python -X utf8 sektor/docs/extraction/gap-test/run_extractor.py
python -X utf8 sektor/docs/extraction/gap-test/build_llm_gold.py
python -X utf8 sektor/docs/extraction/gap-test/compare_gaps.py
```

## Note API

L'upload via `POST /api/v1/etudes/dossiers/{id}/documents` + `previsualiser-bordereau` n'a pas été utilisé ici : le token Cursor QA renvoie **401** sur `/api/v1/etudes/*` dans cet environnement. Le prototype Python est la spec exécutable du pipeline grille documenté dans `docs/extraction/README.md`.
