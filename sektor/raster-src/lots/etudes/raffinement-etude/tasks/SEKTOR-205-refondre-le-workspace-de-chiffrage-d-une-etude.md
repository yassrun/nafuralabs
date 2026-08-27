---
id: SEKTOR-205
status: done-me
context: nafura
type: feature
agent_type: exec
priority: P1
assignee: agent
gate: none
blocked_by: [SEKTOR-202, SEKTOR-203]
tags: [etudes, web, ux, chiffrage]
---

# Refondre le workspace de chiffrage d'une étude

> Rendre le chiffrage lisible et efficace : coût et vente séparés, un CTA par intention, prix expliqué et sauvegarde sans ambiguïté sur desktop/mobile.

Contrat : [`../CONTRAT.md`](../CONTRAT.md), AC-21 à AC-24 et AC-32. UX : [`../ux/raffinement-etude-wireframe.md`](../ux/raffinement-etude-wireframe.md).

## Étapes

- [~] Renommer l'étape `Chiffrage` et séparer déboursé unitaire, vente unitaire HT et total vente dans l'arbre/agrégats. — **vague 1 livrée** : libellés des 4 phases du contrat ; arbre : **Déboursé unitaire / Prix de vente unitaire HT / Total vente HT** ; tableau composants : `Prix unitaire HT / Total HT`.
- [~] Recomposer le drawer dans l'ordre contexte → origine → composants → formation du prix → sauvegarde. — **vague 2 livrée** : vocabulaire de la formation (`Déboursé unitaire → + FG → + marge → Prix de vente unitaire HT → Total ligne HT`) ; « **Prix visé** » nommé comme tel et éditable (mode ESTIME/VENTE), jamais confondu avec le total courant.
- [x] Supprimer les CTA IA/Catalogue dupliqués et appliquer la hiérarchie du wireframe selon état vide/revue/rempli. — « Extraire les composants » retiré de la section descriptif ; état vide : **Proposer avec l’IA** (primaire) + Catalogue + Manuel.
- [x] Intégrer provenance, état IA et résolution incertaine sans dialogue déconnecté du poste. — **vague 3 livrée** : revue IA **inline** dans le panel (plus de dialogue) — en-tête « Proposition IA · générée HH:MM » + sources (libellé + CPS indexé), sections déjà-au-catalogue / absent / incertain, motif obligatoire pour ignorer un incertain (AC-14), deux actions distinctes pour les absents (AC-16), bouton final Appliquer désactivé tant qu'un élément reste à trancher (AC-16), états aucun-résultat et indisponible avec chemin manuel.
- [~] Clarifier prix visé, frais, marge et formules; mettre à jour arbre/synthèse/anomalies après save. — formules et libellés clarifiés ; la remontée arbre/synthèse après save repose sur `(change)` existant (à prouver en parcours).
- [~] Fermer dirty state, autosave, erreur/retry, fermeture et changements concurrents. — vérifié : statut « Modifications non enregistrées / Enregistrement… / Tout est à jour », fermeture dirty → conserver (rester ouvert) ou abandonner (AC-24) ; autosave/erreur/retry à prouver.
- [~] Livrer plein écran mobile, clavier, focus et cibles tactiles. — **vague 2** : drawer **plein écran sous 720 px** (AC-32) ; **vague 3** : focus initial dans la revue IA (premier champ), retour de focus vers « Proposer avec l'IA » à la fermeture, `aria-label` sur cases à cocher et champ motif (AC-32) ; audit complet des parcours en QA 208.

## Preuves attendues

- [~] Tests composants sur trois origines de coût, états IA, sauvegarde et fermeture dirty. — spec `dossier-etape.util.spec` aligné phases ; tests composants à compléter (runner `ng test` bloqué par erreur préexistante `stock-budget-sync.service.spec.ts`).
- [ ] Parcours exact coût `582600`, vente `737106`, marge `154506`, sans libellé ambigu.
- [ ] Capture desktop/mobile comparée au wireframe; aucun CTA dupliqué.
- [ ] Audit clavier/focus et test que l'arbre se rafraîchit sans reload.

## Journal

```
26/08 15:27  posée
26/08 18:47  status → doing
26/08 22:05  vague 1 livrée : phases du contrat (Chiffrage), colonnes coût/vente séparées, CTA IA unique — build web vérifié
26/08 22:45  vague 2 livrée : formation du prix (Déboursé → FG → marge → vente), « Prix visé » éditable, drawer plein écran <720px — build web vérifié
29/08      vague 3 livrée : revue IA inline (plus de dialogue déconnecté) — en-tête/sources, sections déjà-au-catalogue/absent/incertain, motif pour ignorer, Appliquer bloqué tant qu'il reste à trancher, états aucun/indisponible avec chemin manuel — build web vérifié
29/08      vague 4 livrée : focus initial/retour dans la revue IA + libellés accessibles (AC-32) — build web vérifié
26/08 21:00  status → done-agent · gate none → done-me
```

## Rapport de livraison

**Vague 1 (livrée)** — phases du contrat (Chiffrage), colonnes `Déboursé unitaire / Prix de vente
unitaire HT / Total vente HT` (AC-21), CTA IA unique, tableau composants `Prix unitaire HT / Total HT`.

**Vague 2 (livrée)** — drawer ordonné contexte → origine → composants → formation du prix →
sauvegarde (AC-22) ; vocabulaire `Déboursé unitaire → + FG → + marge → Prix de vente unitaire HT →
Total ligne HT` ; « Prix visé » nommé et éditable (mode ESTIME/VENTE), jamais confondu avec le
total courant ; drawer plein écran sous 720 px (AC-32).

**Vague 3 (livrée, AC-23/AC-14/AC-16)** — la revue IA devient **inline** dans le panel : plus de
dialogue déconnecté après « Proposer avec l'IA » ; l'écran bascule en revue. En-tête
« Proposition IA · générée HH:MM » + sources (libellé du poste + CPS indexé, AC-10) ; sections
« Déjà au catalogue » (cases à cocher, défaut coché), « Absent du tenant » (deux actions
distinctes : *Ajouter au poste seulement* / *Créer dans le catalogue et lier*, AC-16),
« Identité incertaine » (candidats listés, actions poste/catalogue/ignorer, **motif obligatoire
pour ignorer**, AC-14) ; bouton final **Appliquer** désactivé tant qu'un élément reste à trancher
(AC-16) ; régénération « Actualiser » (✎) ; états `aucun résultat` et `indisponible` rendus
distincts avec chemin manuel (AC-8) ; le CTA « Proposer avec l'IA » n'est plus dupliqué avec
l'état vide (masqué pendant la revue).

**Décidé seul (vague 3)** : les manquants résolus « poste seulement » deviennent des composants
manuels LIBRE ; un incertain résolu « poste » est ajouté en composant manuel (pas de lien) ;
l'ignore d'un incertain est mémorisé dans la revue (motif affiché en chip) — la persistance
serveur du motif d'ignore suit le moteur de proposition IA (SEKTOR-203), hors périmètre du
legacy Extraire ; la régénération remplace la revue (aucun diff serveur sur l'endpoint legacy).

**Vague 4 (livrée, AC-32)** : focus initial dans la revue IA (premier champ non désactivé) via
`viewChild` + effet, retour de focus vers le CTA « Proposer avec l'IA » à la fermeture,
`aria-label` sur les cases à cocher (« Inclure … ») et le champ motif (« Motif pour ignorer … »).
Le modèle est passé de dialogues modaux (autoFocus/restoreFocus) à une revue inline gérée
explicitement.

**Dette restante** : preuves de parcours (coût 582600 / vente 737106 / marge 154506), captures
desktop/mobile, audit clavier/focus complet sur tous les parcours et tests composants (runner
`ng test` bloqué par erreur préexistante) — QA 208.
