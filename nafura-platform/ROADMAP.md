# ROADMAP — nafura-platform

> L'ordre des lots. **Écrite à la main**, hors `raster-src/`, **non indexée** par Raster.
> Ce qui est **au-dessus de la borne** est ouvert à l'orchestrateur ; en dessous, non.
> Déplacer la borne = planifier. Contrat : [`raster/AGENTS.md`](../raster/AGENTS.md) §7.

## 1 — Nettoyage

Trois dettes de contrat sur des BC déjà pactés. Chacune tient en un Change, et chacune
**tranche une question** plutôt que d'ajouter du comportement.

1. **impression** — `CH-02-EVOL-sans-facture`
   Sortir `PrintDocument`, la TVA et les lignes du jar : le rendu reçoit un type **opaque**.
   Sektor garde la forme facture.

2. **documents** — `CH-09-EVOL-archive`
   « archivé » : transition d'un cycle de vie, ou reste à jeter. Le spec tranche, une seule vérité survit.

3. **document-extraction** — `CH-03-EVOL-hors-spec`
   `builder` et `workflow` : dans la SPEC avec leurs règles, ou hors du BC. Le code suit.

<!-- borne -->

## 2 — Reste du CADRE platform

Cinq BC annoncés par le CADRE, aucun contracté. Même rythme pour tous : **trois sous-lots**.

```
lot <bc>
  CH-00-INIT-<bc>                        spec · tech (baseline e2e) · qa
  CH-01-TECHNICAL-plier                  spec · tech
  socle CH-0n-EVOL-consommateur-<bc>     spec
```

L'INIT **coupe** — c'est lui qui dit ce qui entre dans le BC. Le plier ne bouge que du code,
et il attend l'INIT : on ne déplace pas ce qui n'a pas de contrat.

| # | Lot | Jars | Ce que l'INIT tranche |
|---|-----|------|------------------------|
| 4 | **commentaire** | `collaboration/comment` | ce que commenter recouvre — mention, notification, modération dedans ou dehors |
| 5 | **notification** | `collaboration/notification` | notifier ou transporter : le canal appartient-il au BC ou à ops |
| 6 | **identite** | `core/identity` · `iam` · `settings` | les trois jars d'un coup. **Pas de 2ᵉ lot iam.** Si `settings` n'est pas « qui est là », il part en `not_owns` |
| 7 | **approbation** | `workflow` | tout le jar, ou la seule part qui fait décider. **Pas de lot workflow à côté** : un besoin, faire décider |
| 8 | **conversation** | `ai-conversation` · `ai-agent-api` · `ai-agent-runtime` · `llm-provider` | quels jars entrent. `llm-provider` peut relever du socle ou d'ops |

## Hors roadmap

**Husk et les packages docmanager** — pas de lot. Après, ou jamais. Les inscrire ici en ferait
une dette qu'on regarde ; les laisser dehors est la décision.

---

**État au 2026-08-16.** 39 tasks, 18 sous-lots. 8 lançables tout de suite : les trois du
nettoyage et les cinq INIT. Les 10 autres attendent leur INIT — c'est voulu, et c'est
`node raster/t.mjs ready nafura-platform` qui le dit.

Les cinq nouveaux BC n'ont pas encore de `SPEC.md` : c'est la première étape de leur INIT.
`check` les signale en erreur jusque-là.
