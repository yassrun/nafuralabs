---
id: SEKTOR-211
status: todo
context: nafura
type: feature
agent_type: exec
priority: P1
assignee: agent
gate: me
tags: [sektor]
---

# Garde-fous métier avant gain et conversion

> Un dossier à 100 % de coûts non établis, ou avec warnings non acceptés, ne peut plus être marqué gagné ni converti. Le compteur d'anomalies égale ce que l'écran montre.

Contrat : [`../CONTRAT.md`](../CONTRAT.md) AC-1 à AC-4.
**Ne pas commencer avant approbation de SEKTOR-212.** Titre d'inbox conservé par `promote` ; le résultat est celui de ce corps.

`CompletudeEtudeService` est absent de l'arbre intégré. Réintroduire le minimum consommé par `gagne()` et `convertir()`, sans rejouer tout `raffinement-etude`.

## Étapes

- [ ] Faire produire au backend des contrôles structurés (code, sévérité, faits, action) lus par synthèse, bandeau et gates.
- [ ] Compteur = contrôles actifs de la phase ; un warning visible interdit un compteur 0.
- [ ] `gagne()` et `convertir()` refusent tout BLOCKING ; un WARNING commercial exige acceptation auditée.
- [ ] 100 % de coûts non établis (ou déboursé indisponible avec postes) = BLOCKING.
- [ ] Afficher « aucun composant » au lieu de `0 / 0 (100 %)`.
- [ ] Ne plus doubler le statut « Devis généré » sur la fiche (AC-14, même surface).

## Preuves attendues

- Étude avec 3 postes, 0 déboursé : UI et `POST /gagne` refusent, code stable.
- Étude avec part estimée < 100 % : gain possible seulement après motif ; journal acteur/date/motif.
- Replay identique du gain accepté : pas de double transition.
- Capture : bandeau + compteur identiques, desktop et 390.

## Journal

```
27/08 21:56  posée (promote inbox)
27/08 22:10  corps recalé sur AC-1..AC-4 — attendre SEKTOR-212
```

## Rapport de livraison
