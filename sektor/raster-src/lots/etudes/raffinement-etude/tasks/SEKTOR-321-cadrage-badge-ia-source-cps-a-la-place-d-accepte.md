---
id: SEKTOR-321
status: done
context: nafura
type: feature
agent_type: exec
priority: P2
assignee: agent
---

# Cadrage — badge IA source CPS a la place d Accepté

> Le badge dit la provenance (IA · CPS), pas une revue humaine stockée.

## Étapes

- [x] Wireframe cadrage : Accepté → IA · CPS
- [x] Écran identité : même badge avant/après save ; Accepter/Refuser seulement en attente
- [x] Copie preview IDE canvases/

## Journal

```
08/09 11:43  posée
08/09 11:43  status → doing
08/09 11:45  provenance IA · CPS ; Accepté retiré
08/09 11:44  status → done
```

## Rapport de livraison

Badge **IA · CPS** (bleu provenance) à la place d’**Accepté** (vert). Accepter / Refuser restent sur les propositions non sauvées. Refus → **Saisie manuelle**. CPS muet → **Non trouvé dans le CPS**. Wireframe `cadrage-cps-revue-wireframe.canvas.tsx` aligné.

Écarts : aucun état de revue en base (inchangé).

