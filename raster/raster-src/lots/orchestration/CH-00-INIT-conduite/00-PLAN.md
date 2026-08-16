# Conduite

> Le BC qui porte la fenêtre de travail, la borne, et les rôles qu'on lance dedans.

## Verdict

RAS-78 a laissé le placement en dette. Le résoudre maintenant évite d'écrire du code d'orchestration dans `work`, qu'on aurait à en sortir ensuite.

## Constat

- Le CADRE owns « la conduite d'agents en parallèle » et « la borne » depuis RAS-78 — aucun BC ne les porte
- `raster/ROADMAP.md` existe avec son marqueur `<!-- borne -->` ; rien ne le lit
- `.claude/skills/` et `.claude/agents/` n'existent pas
- L'UI génère des briefs vers `nafura-spec` / `nafura-exec` / `nafura-qa`, qui n'existent nulle part

## Approche technique

`roadmap.mjs` à la racine du projet Raster : parse markdown minimal, repère le marqueur, retient les lots cités au-dessus. Croisé avec `ready.mjs` (RAS-81), ça donne la fenêtre lançable — d'où la dépendance croisée entre sous-lots.

Le défaut est **fermé** : pas de marqueur ⇒ fenêtre vide. Un fichier mal formé ne doit jamais élargir l'autonomie.

Skill et agents sont des fichiers markdown, sans code.

## Tasks

| # | Task | blocked_by | // OK |
|---|------|------------|-------|
| 1 | RAS-84 SPEC du BC + Carte | — | **oui** avec 2 |
| 2 | RAS-85 lire roadmap + borne | RAS-81 | **oui** avec 1 |
| 3 | RAS-86 skill + agents | 2 | non |
| 4 | RAS-87 QA | 1, 3 | non |

## Couverture

Couvre `AC-1` → `AC-5` de [`CH.md`](../../../../pact/orchestration/CH-00-INIT-conduite/CH.md).
Hors périmètre : le spawn réel et les worktrees — ils supposent un processus et une clé, donc `gate: me` au CADRE.

## Décisions ouvertes

Aucune — prêt à découper.
