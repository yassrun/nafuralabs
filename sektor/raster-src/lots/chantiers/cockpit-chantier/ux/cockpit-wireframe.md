# Wireframe fonctionnel — cockpit chantier

Ce document fixe hiérarchie, contenu et comportements. Il ne prescrit ni palette ni composants graphiques hors design system existant.

## Desktop — EN_PREPARATION

```text
┌────────────────────────────────────────────────────────────────────────────┐
│ ← Chantiers   CH-2026-002 · École Al Amal                 [EN PRÉPARATION] │
│ Client · Devis DV-2026-0002 v3 approuvé · fraîcheur 26/08 12:00            │
├────────────────────────────────────────────────────────────────────────────┤
│ Pilotage | Équipe | Arbre | Budget | Planning | Situations | Docs | Photos │
├────────────────────────────────────────────────────────────────────────────┤
│ Vente active HT │ Budget révisé HT │ Marge projetée │ Avancement │ Échéance│
│ 737 106         │ 582 600           │ 154 506 · 20,96%│ —          │ 120 j   │
├──────────────────────────────────────┬─────────────────────────────────────┤
│ PRÉPARER LE DÉMARRAGE  5/7           │ À FAIRE MAINTENANT                  │
│ ✓ source commerciale                 │ [Affecter le chef de chantier]      │
│ ✓ arbre et budget                    │                                     │
│ ! conducteur / chef          [Gérer] │ Alertes suivantes                   │
│ ✓ dates prévues                      │ • Fin prévue non renseignée [Ouvrir]│
│ ! ordre de service    au démarrage   │ • Planning recommandé      [Créer] │
│ ○ planning recommandé        [Créer] │                                     │
│                                      │ [Enregistrer l'OS et démarrer] off  │
├──────────────────────────────────────┴─────────────────────────────────────┤
│ FLUX DU MOIS       Avancement 37% → Attachement à créer → Situation —      │
│                    [Saisir l'avancement]                                   │
├──────────────────────────────────────┬─────────────────────────────────────┤
│ BUDGET / MARGE                       │ PLANNING / DÉLAI                    │
│ résumé + écart                 [Voir]│ aucun planning · recommandé [Créer]│
├──────────────────────────────────────┴─────────────────────────────────────┤
│ ACTIVITÉ RÉCENTE  (faits audités, date, acteur, lien source)               │
└────────────────────────────────────────────────────────────────────────────┘
```

Règles :

- L'action primaire est celle fournie en tête de `nextActions`; elle n'est jamais inventée par le composant.
- Le bouton de démarrage reste absent ou désactivé avec les bloqueurs nommés jusqu'à satisfaction d'AC-5.
- `Planning recommandé` est visuellement distinct d'un bloqueur.

## Desktop — EN_COURS

La même grille remplace la checklist par `Alertes et prochaine action`. Le flux du mois monte avant les résumés de modules. Une marge négative occupe la première alerte et l'action primaire ouvre le budget au nœud/périmètre source. Une échéance absente n'affiche ni retard ni zéro.

## Mobile — 390 px

```text
┌──────────────────────────────┐
│ ← CH-2026-002  [PRÉPARATION] │
│ École Al Amal                │
│ Devis DV-2026-0002 v3        │
├──────────────────────────────┤
│ Vente HT       737 106 MAD   │
│ Budget révisé  582 600 MAD   │
│ Marge          154 506 · 21% │
│ Avancement     Non disponible│
├──────────────────────────────┤
│ À FAIRE MAINTENANT           │
│ Affecter le chef             │
│ [Gérer l'équipe]             │
├──────────────────────────────┤
│ Préparation 5/7       [Voir] │
│ Flux du mois           [Voir]│
│ Budget                 [Voir]│
│ Planning recommandé   [Créer]│
├──────────────────────────────┤
│ Onglets / menu « Plus »      │
├──────────────────────────────┤
│ [ Action primaire 44 px ]    │ ← barre persistante, sans masquer le bas
└──────────────────────────────┘
```

## États obligatoires à maquettiser dans le code

| État | Comportement |
|---|---|
| chargement initial | squelette stable, aucun ancien montant |
| erreur identité | page bloquée, réessai et retour liste |
| erreur d'une section | carte « Indisponible », réessai local |
| donnée interdite | carte/valeur retirée, mise en page recomposée |
| liste vide légitime | explication et CTA si autorisé |
| état changé au clic | message métier, rechargement et nouvelle action primaire |
| suspendu | bandeau raison/date, actions compatibles uniquement |
| clôturé | lecture seule, historique et résidus visibles |

