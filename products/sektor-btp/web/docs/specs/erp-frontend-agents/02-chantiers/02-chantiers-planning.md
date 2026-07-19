# Agent — Chantiers · Planning Gantt

> **Objet** : vue planning multi-chantiers (Gantt) consolidée + zoom mono-chantier. Pilotage temporel.
> **Route** : `/chantiers/planning` · **Permission** : `chantiers.chantier.read`

## 0. Pré-requis

[00-CONVENTIONS.md](../00-CONVENTIONS.md), [00-UX-PRINCIPES.md §Écrans non-tabulaires](../00-UX-PRINCIPES.md), [README chantiers](README.md).
Dépendance modèle : `Chantier`, `LotChantier`, `PhaseChantier` (cf. README §Modèle).

## 1. Page `ChantiersPlanningPage`

### Layout

```
┌──────────────────────────────────────────────────────────────────────────┐
│ Planning chantiers                                                       │
│ ┌────────────────┐ ┌────────────┐ ┌──────────┐ ┌─────────┐ [⋯]          │
│ │ Filtre chantier│ │ Période    │ │ Granular.│ │ Affich. │              │
│ │ ▾ Tous (12)    │ │ Q2 2026    │ │ Semaine ▾│ │ Phases ▾│              │
│ └────────────────┘ └────────────┘ └──────────┘ └─────────┘              │
├──────────────────────────────────────────────────────────────────────────┤
│ [chantier]            │ Mar 26 │ Avr 26 │ Mai 26 │ Juin 26 │ Juil 26 │  │
│ ▼ CH-2026-001         │█████████████████░░░░│░│░│░│░│░│░                │
│   ├ 01 Gros œuvre     │██████████████░░░░░░░│░│░│░│░│░│░  62%           │
│   ├ 02 Étanchéité     │░░░░░░░░░██████░░░░░░│░│░│░│░│░│░  10%           │
│   └ 03 Cloisons       │░░░░░░░░░░░░░██████░░│░│░│░│░│░│░  0%            │
│ ▼ CH-2026-002 (Pont)  │██████████████████████████████│░│░│░│░│░│░       │
│   ├ TF-01 Pieux       │██████████████████░░░│░│░│░│░│░│░  85%           │
│   ...                                                                    │
└──────────────────────────────────────────────────────────────────────────┘
```

### Toolbar

- **Filtre chantier** — multi-select, par défaut "Tous les actifs". Si un seul sélectionné, header indique le code chantier.
- **Période** — date range avec presets (Ce mois, Ce trimestre, Cette année, 6 mois glissants, Tout).
- **Granularité** — Jour | Semaine | Mois | Trimestre.
- **Affichage** — Phases | Lots | Phases + Lots.
- **Actions** :
  - `Exporter PDF` — capture A3 paysage du Gantt.
  - `Plein écran` — toggle fullscreen.
  - `Aujourd'hui` — recentre la vue sur la date courante.

### Comportement Gantt

- **Lib retenue V1** : `dhtmlx-gantt` (community) ou `frappe-gantt` (lighter). Trancher dans le code, retenir 1 seul.
- **Drag horizontal** : glisser une phase déplace ses dates (avec confirmation).
- **Resize** : étirer la barre modifie `dateFin`.
- **Dépendances** : flèches entre phases liées (`dependances[]`). En V1 : affichage seul, pas d'édition.
- **Couleur barre** :
  - bleu = planifié
  - vert = en cours nominal
  - orange = en cours en retard (dateFin < today et avancement < 100)
  - gris = terminé
- **Avancement** : barre pleine = avancement réel, fond clair = restant.
- **Aujourd'hui** : ligne verticale rouge.
- **Click barre** : ouvre drawer latéral droit avec détails (lot/phase, qté, avancement, équipe, lien chantier).

### Empty state

Si aucun chantier sélectionné ou aucune phase planifiée → illustration + texte _"Aucune phase planifiée pour cette sélection"_ + CTA `Aller à la fiche chantier pour ajouter des phases`.

## 2. Mock data planning

Pour chaque chantier en cours du seed, créer 6-15 phases cohérentes avec ses lots :

Exemple CH-2026-001 (Résidence R+5) :
```
01 Gros œuvre infrastructure | 2025-03-15 → 2025-09-30 | avancement 100%
02 Gros œuvre superstructure | 2025-08-01 → 2026-04-30 | avancement 78%
03 Étanchéité toiture        | 2026-04-15 → 2026-06-30 | avancement 12%
04 Cloisons & doublages      | 2026-05-01 → 2026-08-15 | avancement 0%
05 Plomberie sanitaire       | 2026-04-15 → 2026-09-15 | avancement 8%
06 Électricité courants forts| 2026-05-15 → 2026-09-30 | avancement 0%
07 Climatisation             | 2026-07-01 → 2026-10-15 | avancement 0%
08 Revêtements sols          | 2026-08-01 → 2026-09-30 | avancement 0%
09 Faïence salle de bain     | 2026-08-15 → 2026-09-15 | avancement 0%
10 Peinture                  | 2026-09-01 → 2026-09-25 | avancement 0%
11 VRD & espaces verts       | 2026-08-01 → 2026-09-15 | avancement 0%
```

Inclure quelques dépendances (`02 ← 01`, `03 ← 02`, `04 ← 03`, etc.) et 2-3 phases en retard volontaire pour démo.

## 3. Files to deliver

```
applications/erp/pages/chantiers/planning/
├── chantiers-planning.page.{ts,html,scss}
├── components/
│   ├── gantt-toolbar/
│   ├── phase-drawer/
│   └── gantt-legend/
└── services/
    └── planning-mock.facade.ts    # consomme chantiers-mock.service
```

## 4. UX details

- Granularité par défaut : `Semaine`.
- Largeur colonnes time : 60px par jour, 80px par semaine, 120px par mois.
- Largeur colonne label gauche : 280px, sticky.
- Légende cliquable pour filtrer par couleur (bleu/vert/orange/gris).
- Mode `Phases + Lots` : niveau parent = chantier, enfants = lots, petits-enfants = phases (3 niveaux).
- Drawer phase : résumé + bouton `Ouvrir fiche chantier` qui navigue vers `/chantiers/:id`.

## 5. DoD

- [ ] Vue rendue avec ≥ 6 chantiers et ≥ 50 phases au mock.
- [ ] Drag dates met à jour le mock service.
- [ ] Filtres et granularité fonctionnels.
- [ ] Click barre ouvre drawer cohérent.
- [ ] Export PDF (V1 : `window.print()` mode landscape OK).
- [ ] Performance : rendu < 1s pour 12 chantiers / 100 phases.
- [ ] Accessible clavier : flèches gauche/droite naviguent, Entrée ouvre drawer.
