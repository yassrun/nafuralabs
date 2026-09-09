# Wireframe fonctionnel — Études raffinées

## Liste desktop

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ Études / appels d'offres                               [Nouvelle étude]     │
│ [Recherche n°, objet, MOA…] [État] [Chargé] [Alertes] [Réinit.]          │
├──────────────┬───────────┬────────────┬──────────┬──────────┬───────────────┤
│ Étude        │ Échéance  │ État       │ Qualité  │ Alerte   │ Prochaine     │
│ DE-0042      │ J-3       │ Chiffrage  │ 72 %     │ 3 coûts  │ Chiffrer poste│
│ École Al Amal│ 29/08     │            │ établie  │ estimés  │ A-17       →  │
├──────────────┴───────────┴────────────┴──────────┴──────────┴───────────────┤
│ 1–25 sur 42                         [25 ▾]                 [‹] 1 2 [›]     │
└─────────────────────────────────────────────────────────────────────────────┘
```

Une seule pagination. La prochaine action ouvre directement la phase ou le poste concerné.

Colonne **État** unique : pendant le travail, le nom d’étape (Cadrage, Bordereau, Chiffrage) ; après soumission, le statut métier (En validation, Convertie, Perdu…). Pas de compteur `n/4`.

## Détail — phase Chiffrage

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ ← Études  DE-0042 · École Al Amal                [EN ÉTUDE] [3 anomalies] │
│ MOA · Chargé · échéance J-3 · Rév. 2 · Enregistré                          │
│ Vente HT 737 106 │ Déboursé 582 600 │ Marge 154 506 · 20,96 % │ 6 postes │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1 Cadrage & docs ✓ │ 2 Bordereau ✓ │ 3 Chiffrage ● │ 4 Décision & devis │
├─────────────────────────────────────────────────────────────────────────────┤
│ 3 postes à traiter                                      [Traiter le suivant]│
│ [Recherche] [Origine coût] [Risque]                                         │
├──────┬─────────────────────┬─────┬─────────────┬─────────────┬──────────────┤
│ Code │ Poste               │ Qté │ Déboursé PU │ Vente PU HT │ Total vente  │
│ 1.1  │ Béton armé         │ 120 │ 420,00      │ 550,00      │ 66 000       │
│      │ Décomposé · IA revue│     │              │ marge 23,6% │ [Ouvrir]     │
└──────┴─────────────────────┴─────┴─────────────┴─────────────┴──────────────┘
```

## Drawer poste

```text
┌──────────────────────────────────────────────────────────┐
│ 1.1 · Béton armé                              [Fermer]   │
│ U · Qté 120 · Modifications non enregistrées             │
├──────────────────────────────────────────────────────────┤
│ Descriptif technique                          [Voir CPS]  │
│ [texte…]                                                   │
├──────────────────────────────────────────────────────────┤
│ Origine : [Je décompose] [Forfait] [J'estime]             │
│                                                          │
│ Aucun composant                                           │
│ [Proposer avec l'IA]                                      │
│ Alternatives : [Catalogue] [Ajouter manuellement]         │
├──────────────────────────────────────────────────────────┤
│ Prix expliqué                                             │
│ Déboursé 420 + FG 42 + marge 88 = Vente PU HT 550         │
│ Total ligne HT 66 000                                     │
├──────────────────────────────────────────────────────────┤
│ [Annuler]                           [Enregistrer et fermer]│
└──────────────────────────────────────────────────────────┘
```

Un CTA par intention. Sur mobile, ce drawer occupe tout le viewport.

## Revue IA des composants

```text
┌────────────────────────────────────────────────────────────────┐
│ Proposition IA · générée 14:32 · À actualiser si descriptif ✎ │
│ Sources : libellé du poste + CPS §3.2 p.18                     │
├────────────────────────────────────────────────────────────────┤
│ ✓ Ciment CPJ 45       Déjà au catalogue · tarif 1 083,75      │
│   Pourquoi : CPS §3.2 « béton dosé… »             [Inclure ✓] │
│                                                                │
│ ? Sable lavé           2 identités possibles                   │
│   [Choisir] [Chercher] [Poste seulement] [Créer catalogue]     │
│                                                                │
│ + Adjuvant             Absent du tenant                         │
│   [Poste seulement] [Créer catalogue et lier]                  │
├────────────────────────────────────────────────────────────────┤
│ 1 élément reste à trancher                   [Appliquer] off   │
└────────────────────────────────────────────────────────────────┘
```

## Mobile — carte liste 390 px

```text
┌──────────────────────────────┐
│ Études              [+ Nouveau]│
│ [Rechercher…]       [Filtres] │
├──────────────────────────────┤
│ DE-0042 · École Al Amal      │
│ Chiffrage                    │
│ Échéance J-3                 │
│ ⚠ 3 coûts estimés            │
│ [Chiffrer le prochain poste] │
├──────────────────────────────┤
│ …                            │
└──────────────────────────────┘
```

## États obligatoires

| État | Rendu attendu |
|---|---|
| IA en attente/en cours | progression et reprise après navigation |
| aucun résultat | explication métier + enrichir descriptif + manuel |
| IA indisponible | service indisponible + manuel, pas « aucun résultat » |
| proposition périmée | source modifiée + comparer/régénérer |
| création Catalogue partielle | article créé non rattaché + CTA de reprise |
| sauvegarde en erreur | brouillon conservé, erreur visible, retry |
| lecture seule | sources et historique visibles, aucune fausse action |

