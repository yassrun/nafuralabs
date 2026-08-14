---

id: SEKTOR-84
status: done-me
context: nafura
type: tech
priority: P0
assignee: agent
gate: none
sprint: 2026-W33
blocked_by: [SEKTOR-83]
---

# Ramasser sektor/sources/web/socle

> Le kernel UI Sektor (layout ERP, nav, composition shell, i18n hôte) vit sous `app/socle/`. Platform inchangée.

## Étapes

- [x] Créer `sektor/sources/web/app/socle/`
- [x] Y déplacer ce que `MAPPING.md` classe socle (`config/`, `shell/`, `onboarding/`, `invitations/`, `integrations/`, bootstrap `app.config` / `app.routes` / `app.component` selon mapping)
- [x] Retargeter les imports `@app/…` concernés
- [x] Ne pas y mettre anatomy, ni un écran métier

## Preuve de fin

`ng serve` / compile : les mêmes routes publiques (login platform, shell) bootent. Kernel plus sous `app/shell` + `app/config` à la racine.

## Journal

```
14/08 11:20  tsk1  git mv mapping web socle → app/socle/ (config shell onboarding invitations integrations styles shared routes bootstrap dashboard administration ARCHITECTURE)
14/08 11:25  tsk2  retarget @app/… + relative sortants/entrants + src/main.ts + src/styles.scss
14/08 11:26  tsk3  domaines (etudes chantiers inventory …) et app/pages/<métier> laissés en place
```

## Rapport de livraison

ce qui a changé      kernel UI sous `sektor/sources/web/app/socle/` ; `src/main.ts` boot `socle/app.component` + `socle/app.config` ; aliases `@app/socle/…`
critères prouvés     n/a (tech) — plus de `app/shell` ni `app/config` à la racine ; domaines non déplacés
décidé seul          relative hors-socle réécrites (erp.routes, shell→pages métier, inventory/finance→shared) pour que le move compile ; pas de rewrite UI
écarts / dette       `app/pages/` métier reste (SEKTOR-85) ; compile Angular reporté à SEKTOR-86
