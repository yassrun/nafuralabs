---
id: PLT-117
status: done-me
context: nafura
type: qa
agent_type: qa
priority: P2
assignee: agent
gate: none
blocked_by: [PLT-116]
tags: [platform, identite]
sprint: 2026-W34
---

# Preuves — baseline identite

> 2 lignes max.

## Étapes

- [x] Exécuter `node --test nafura-platform/e2e/identite/*.test.mjs` (live, hors cache XML)
- [x] Revue SPEC AC-1, AC-2, AC-4, AC-5
- [x] Vérifier le substitut rouge dans le journal PLT-116
- [x] Rapport + verdict

## Journal

```
16/08 14:15  posée
17/08 21:30  sprint → 2026-W34
17/08 21:31  status → doing
17/08 21:32  1er node --test : 5 pass / 0 fail en 103 ms (junit-xml-cache PLT-116)
17/08 21:33  cache XML vidé ; relance live Gradle + node --test
             TAP 5 pass 0 fail  duration_ms 11225
             XML IdentiteBaselineTest tests=4 failures=0 errors=0
             timestamp=2026-08-17T20:33:32.262Z
             méthodes : deuxTenants, inviterMembre, accepterInvitation, retirerMembre
17/08 21:34  revue SPEC AC-1/2/4/5 + substitut rouge PLT-116 (4 JUnit + frontière vus rouge)
             verdict PASS → done-agent
17/08 21:34  status → done-agent · gate none → done-me
```

## Rapport de livraison

**ce qui a changé** — rien à coder. Verdict QA sur CH-00-INIT-identite : **PASS**.

**critères prouvés**

| AC | Preuve | Verdict |
|----|--------|---------|
| AC-1 | Revue : `pact/identite/SPEC.md` existe. `not_owns` = 10 exclusions ; chaque ligne a une cellule « qui s'en charge » (socle, ops, notification, le produit, ou « non spécifié »). | **pass** |
| AC-2 | Revue : owns = personne / organisation / appartenance / invitation / session / codes de rôle. Iam inclus, pas de 2ᵉ lot `iam` sous `raster-src/lots`. `not_owns` : settings, app-settings, rôles custom/catalogue permissions → socle, IdP → ops, domaines/features. | **pass** |
| AC-3 | Exécuté (live) : `node --test nafura-platform/e2e/identite/*.test.mjs` → `# tests 5` `# pass 5` `# fail 0`. XML `IdentiteBaselineTest` tests=4 failures=0 (deuxTenants, inviterMembre, accepterInvitation, retirerMembre). | **pass** |
| AC-4 | Revue : un lecteur de la seule SPEC peut dire oui (membres, invitation, organisation, session) ou non (settings, IdP, catalogue rôles, métier produit). | **pass** |
| AC-5 | Revue SPEC : INV-1 + zéro règle Devis/Chantier/Paie. Exécuté : `identite-frontiere-produit` → `hits("Devis"|"Chantier"|"Paie") = []`. | **pass** |

Extraite e2e (live, hors cache) :

```
TAP version 13
ok 1 - identite-accepter-invitation
ok 2 - identite-deux-tenants
ok 3 - identite-frontiere-produit
ok 4 - identite-inviter-membre
ok 5 - identite-retirer-membre
# tests 5
# pass 5
# fail 0
# duration_ms 11225.301
```

XML JUnit (live) : `tests="4" failures="0" errors="0"` — `retirerMembre` / `deuxTenants` / `inviterMembre` / `accepterInvitation`. Logs : invite `emailStatus=FAILED` ; `Invitation accepted email=invitee-a@example.test`.

Substitut rouge (PLT-116 journal, pas un test inverse) : deuxTenants attendait M chez B (fail) ; inviterMembre expected "active" was "invited" ; accepterInvitation expected "INVITED" was "ACTIVE" ; retirerMembre true was false ; frontière `hits("Devis").length > 0` actual false. Puis invert + vert.

**décidé seul** — « non spécifié » dans 4 lignes `not_owns` (settings, app-settings, prefs affichage, domaines/features) compte comme « qui s'en charge » nommé : le CADRE n'a pas de BC settings ; inventer un propriétaire serait un mensonge. 1er `node --test` (103 ms) = cache XML de PLT-116 ; preuve retenue = 2ᵉ run live après vidage du XML.

**écarts / dette** — 4 exclusions `not_owns` sans BC nommé (seulement « non spécifié »). `POL-ERREUR-CODE` non tenu par le code actuel (dette PLT-116). `P-IDENTITE-*` non assertés (hors matrice, CH-07). settings/app-settings non scannés (not_owns). UI non codée.
