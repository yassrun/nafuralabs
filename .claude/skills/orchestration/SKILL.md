---
name: orchestration
description: Dérouler la fenêtre de travail Raster — ouvrir les lots au-dessus de la borne, lancer un agent par sous-lot lançable, collecter les rapports, s'arrêter à la borne. À utiliser quand on demande de dérouler un lot, d'avancer la roadmap, ou de lancer le travail planifié.
---

# Orchestration Raster

> **Ce skill ne porte aucune règle.** Elles vivent dans [`raster/AGENTS.md`](../../../raster/AGENTS.md) et
> [`raster/pact/orchestration/SPEC.md`](../../../raster/pact/orchestration/SPEC.md) — les deux seuls fichiers
> que Cursor lit aussi. Une règle recopiée ici serait une règle que Cursor n'a pas.
>
> **Lire d'abord `AGENTS.md` §7.** Ce fichier ne décrit que la boucle.

## La boucle

1. **Fenêtre** — `node raster/t.mjs window <projet> --json`
   Les lots au-dessus de la borne. Fenêtre vide ⇒ **s'arrêter et le dire.** Ne jamais élargir soi-même.

2. **Lançables** — chaque lot de la fenêtre porte ses sous-lots `lancable: true`.
   Un sous-lot `bloque` n'est pas un problème à résoudre : c'est un ordre à respecter.

3. **Lancer** — **un sous-agent par sous-lot lançable, en parallèle.**
   Le type d'agent vient de la task en tête : `spec` → `spec`, `feature|bug|tech|physical` → `exec`, `qa` → `qa`.
   Un seul agent par sous-lot ; ses tasks se déroulent en **série**.

4. **Collecter** — à la fin de chaque sous-lot, lire le **rapport de livraison** de ses tasks.
   Une task `done-agent` sans rapport n'est pas finie : la renvoyer.

5. **Libérer** — quand tous les sous-lots ouverts du lot sont clos, merger et passer au lot suivant de la fenêtre.

6. **S'arrêter** — à la borne, sur une `gate: me`, ou sur une question bloquante.
   Rendre la main avec : ce qui est fait, ce qui attend, et **la question**, formulée.

## Ce que tu ne fais pas

- **Tu n'écris jamais une task à la main.** `t.mjs new|promote|sprint|status|approve` — `AGENTS.md` §0.1-9.
- **Tu ne poses jamais `done-me`.** Il résulte d'une approbation — `AGENTS.md` §0.1-8.
- **Tu ne pousses pas.** Merges locaux ; `git push` est un geste humain — §7.
- **Tu ne déplaces pas la borne.** C'est l'acte de planification de l'humain.
- **Tu ne codes pas.** Tu lances ceux qui codent.

## Commandes

```bash
node raster/t.mjs window <projet>      # la fenêtre et ses sous-lots lançables
node raster/t.mjs ready <projet>       # readiness seule, tous lots confondus
node raster/t.mjs status <id> <statut> # todo|doing|blocked|review|done-agent
node raster/t.mjs check                # doit rester vert
```

## Si quelque chose manque

Pas de `ROADMAP.md`, pas de marqueur `<!-- borne -->`, aucun sous-lot lançable : **c'est un arrêt normal**, pas une panne.
Dire ce qui manque et rendre la main. Le défaut est fermé, par construction.
