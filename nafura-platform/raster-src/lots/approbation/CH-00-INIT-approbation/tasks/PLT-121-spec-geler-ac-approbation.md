---
id: PLT-121
status: done-me
context: nafura
type: spec
agent_type: spec
priority: P1
assignee: agent
gate: none
tags: [platform, approbation]
sprint: 2026-W34
---

# SPEC + geler AC — approbation

> Premier contrat du BC `approbation`. Coupe du jar `workflow` · SPEC · AC gelés.

## Étapes

- [x] Lire CADRE, CH, socle (tenant · erreurs · POL · rôles), modèle `documents/SPEC.md`, jar `workflow`
- [x] Trancher AC-2 : tout le jar (demande, étape, chaîne, parcours) — pas de lot workflow
- [x] Écrire `pact/approbation/SPEC.md` (une page, pas de futur)
- [x] Geler les AC du CH ; nommer scénarios e2e + état initial ; lister les POL-*
- [x] Régénérer la carte CADRE (`approbation`)
- [x] Rapport · `index` · `check`

## Journal

```
16/08 14:15  posée
17/08 21:07  sprint → 2026-W34
17/08 21:08  status → doing
17/08 21:20  coupe = tout le jar ; SPEC + CH + carte
17/08 21:22  check : 4 erreurs (commentaire · conversation · identite · notification) — approbation sorti
17/08 21:11  status → done-agent · gate none → done-me
17/08 21:25  constat après PLT-122 : SPEC inchangée — le livré photographie R-3..R-5, R-7, INV-2 ; les fuites (catalogue, POL-ERREUR-CODE, timeout mort, commentaire UI) = dette, pas une SPEC à rattraper
```

## Rapport de livraison

ce qui a changé      `pact/approbation/SPEC.md` créée · CH complété (scénarios + POL, AC inchangés) · carte CADRE : ligne `approbation`. Pas de canvas, pas de code, pas d'e2e.

critères prouvés     AC-1 → SPEC existe, `not_owns` nomme produit / Identité / Notification / Commentaire / documents. AC-2 → coupe écrite (tout le jar). AC-4 → un lecteur tranche sur owns/not_owns. AC-5 → `entité` / rôle opaques, aucun catalogue métier. AC-3 → scénarios nommés pour l'exec (PLT-122), pas exécutés ici.

décidé seul          Coupe = **tout le jar** : chaîne et parcours sont « qui décide, dans quel ordre », pas un BPM générique — pas de lot workflow. Pas de canvas (INIT de contrat, widgets existants). `P-APPROBATION-LIRE` / `P-APPROBATION-DECIDER` déclarés dans la SPEC du BC ; socle non patché (CH-08). Timeout / escalation / condition stockés mais non joués : absents de la SPEC. Commentaire obligatoire au refus = défaut UI, pas une règle. Liste hardcodée Invoice/Quote/… = fuite, pas une règle — hors INIT (pas de correction).

écarts / dette       Deux cycles coexistants (demande vs parcours) non câblés : vérité actuelle, pas un EVOL de cet INIT. Fuite `getEntityTypes` métier. Matrice socle sans `P-APPROBATION-*` jusqu'à CH-08. Baseline e2e → PLT-122.

constat PLT-122      SPEC inchangée. Baseline 6/6 photographie le contrat (type `record`, refus `null`). Dette confirmée, déjà inbox : catalogue `getEntityTypes` (code en avance sur INV-1) · refus UI vs API · timeout/escalation non joués · exceptions sans code (POL-ERREUR-CODE). R-8 parcours non exercé par les scénarios nommés — trou de preuve, pas une SPEC fausse. OK QA.
