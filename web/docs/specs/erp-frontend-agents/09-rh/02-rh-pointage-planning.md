# Agent — RH · Pointage & Planning équipes

> **Objet** : pointage quotidien par chantier (présences, heures, absences) + planning des affectations équipe ↔ chantier. Saisie chef chantier sur tablette.
> **Routes** : `/rh/pointage`, `/rh/planning-equipes`
> **Permission** : `rh.pointage.*`, `rh.planning.*`

## 0. Pré-requis

[README rh](README.md), [01-rh-employes](01-rh-employes.md).

## 1. Modèle

```ts
// applications/erp/rh/models/

export type TypePresence = 'PRESENT' | 'ABSENT_JUSTIFIE' | 'ABSENT_INJUSTIFIE' | 'CONGE_PAYE' | 'CONGE_SANS_SOLDE' | 'ARRET_MALADIE' | 'ACCIDENT_TRAVAIL' | 'FORMATION' | 'FERIE' | 'WEEKEND';

export interface Pointage {
  id: string;
  date: string;
  employeId: string;
  employeName?: string;
  employeMatricule?: string;
  chantierId?: string;                 // si présent sur chantier
  chantierCode?: string;
  type: TypePresence;
  
  // Heures
  heuresNormales: number;              // ex: 8
  heuresSupp25: number;                // majoration 25%
  heuresSupp50: number;                // majoration 50% (nuit)
  heuresSupp100: number;               // majoration 100% (dimanche/férié)
  
  // Détails
  heureArrivee?: string;               // 'HH:mm'
  heureDepart?: string;
  pauseMinutes?: number;
  
  // Justificatif (si absence)
  motif?: string;
  justificatifUrl?: string;
  
  // Saisie
  saisieParId: string;
  saisieParName?: string;
  saisieDateTime: string;
  validateurId?: string;
  validationDate?: string;
  status: 'BROUILLON' | 'VALIDE' | 'CONTESTE';
  notes?: string;
}

export interface AffectationEmploye {
  id: string;
  employeId: string;
  employeName?: string;
  chantierId: string;
  chantierName?: string;
  dateDebut: string;
  dateFin?: string;                    // null si en cours
  role?: string;                       // 'Chef d'équipe maçonnerie'
  pourcentageTemps?: number;           // 100% par défaut, < 100% si multi-chantiers
  status: 'ACTIVE' | 'TERMINEE';
  notes?: string;
}
```

## 2. Page `/rh/pointage`

### Layout principal — vue grid quotidienne

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Pointage  [Chantier ▾ Tous] [Date ◀ Lun 06/05/2026 ▶] [⊞ Sem.][📊 Mois]│
│ [Pointer toute l'équipe]  [+ Pointage individuel]    [Valider la jrn.]  │
├─────────────────────────────────────────────────────────────────────────┤
│ Employé                       │Chantier   │Statut    │ Hr norm │ HS    │
│ EMP-018 K. Alami (Cond.trav.) │CH-2026-001│ Présent  │   8    │   2   │
│ EMP-024 H. Bennis (Chef éq.)  │CH-2026-001│ Présent  │   8    │   1.5 │
│ EMP-031 S. Mansouri (Maçon)   │CH-2026-001│ Présent  │   8    │   --  │
│ EMP-032 T. El Idrissi (Maçon) │CH-2026-001│ Absent J.│   --   │   --  │
│ EMP-035 R. Kabbaj (Manœuvre)  │CH-2026-001│ Présent  │   8    │   --  │
│ ...                                                                     │
│ ──────────────────────── Σ Présents : 18 / 22 ──── Σ Heures: 152      │
└─────────────────────────────────────────────────────────────────────────┘
```

### Vues alternatives

- **Jour** (par défaut) : 1 ligne par employé.
- **Semaine** : grille employé × jour, cellule = type présence (couleur).
- **Mois** : grille employé × jour mois, cellule = couleur présence + total heures.

### Action `Pointer toute l'équipe`

Pré-remplit toute l'équipe affectée au chantier sélectionné comme `PRESENT 8h`. Le chef chantier ajuste juste les exceptions.

### Saisie individuelle

Modal :
- Employé (autocomplete équipe affectée).
- Chantier (auto si déjà sélectionné).
- Type présence.
- Si présent : heures (8h défaut), heures sup 25/50/100, heure arrivée/départ.
- Si absent : motif + justificatif (upload).

### Validation journée

Bouton `Valider la journée` :
- Vérifie pour tous les employés avec contrat actif si pointage saisi.
- Liste les manquants → user complète ou marque absent.
- Bascule tous les pointages `BROUILLON → VALIDE`.

### Filtres

- `chantierId`, `dateRange`, `employeId`, `type`, `status`, `departmentId`.

### Chips

- `Mon équipe`, `Aujourd'hui`, `Cette semaine`, `Heures sup ce mois`, `Absences à justifier`.

## 3. Calculs heures

```ts
// dans PointageFacade
totalHeuresEmploye(employeId: string, dateDebut: string, dateFin: string) {
  const pointages = this.pointages().filter(/* ... */);
  return {
    heuresNormales: pointages.reduce((s, p) => s + p.heuresNormales, 0),
    heuresSupp25: pointages.reduce((s, p) => s + p.heuresSupp25, 0),
    heuresSupp50: pointages.reduce((s, p) => s + p.heuresSupp50, 0),
    heuresSupp100: pointages.reduce((s, p) => s + p.heuresSupp100, 0),
    joursPresents: pointages.filter(p => p.type === 'PRESENT').length,
    joursAbsents: pointages.filter(p => p.type.startsWith('ABSENT')).length,
    coutMoChantier: this.calcCoutMoChantier(pointages),
  };
}
```

`coutMoChantier` = somme (heuresTotales × tauxHoraireEmploye × majoration). Alimente l'analytique chantier.

## 4. Page `/rh/planning-equipes`

### Layout — Gantt par employé

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Planning équipes                                                         │
│ Filtre: [Département ▾] [Chantier ▾] [Période 6 sem.]                   │
│                                                                          │
│ Employé                  │S22│S23│S24│S25│S26│S27│                       │
│ K. Alami (Cond. trav.)   │██CH001 ████████████████████████              │
│ H. Bennis (Chef éq.)     │██CH001 ██████ ██████CH002 ████               │
│ S. Mansouri (Maçon)      │██████CH001 ██████████████                    │
│ T. El Idrissi (Maçon)    │  ██████CH002 ████████████                    │
│ R. Kabbaj (Manœuvre)     │██████CH001 ████████████████                  │
│ ...                                                                      │
└─────────────────────────────────────────────────────────────────────────┘
```

### Comportement

- Barres = `AffectationEmploye`. Couleur par chantier.
- Drag horizontal : ajuste les dates.
- Click barre : drawer édition (employé, chantier, dates, rôle, %).
- Conflit : si un employé affecté à 2 chantiers en parallèle avec %total > 100% → alerte rouge.

### CTA

`+ Nouvelle affectation` → form (employé, chantier, dates, rôle, %).

### Tabs alternatifs

- **Par chantier** : grille chantier × semaine, cellules = nombre/liste employés affectés.
- **Synthèse** : table : employé, chantier(s), total jours affectés, taux d'occupation.

## 5. Composants

```
applications/erp/rh/components/
├── presence-badge/                # variant par type présence
├── presence-cell/                 # cellule grille jour/semaine
├── pointage-grid/                 # grid jour/semaine/mois
├── pointage-row-form/             # ligne édition rapide
├── planning-gantt-rh/             # Gantt employés
├── affectation-form-dialog/
└── heures-cumul-card/             # synthèse heures employé
```

## 6. Mock seed

- ~5000 pointages sur 6 mois (40 employés × 22 j × 6 mois).
- Mix : 90% PRESENT, 5% CONGE_PAYE, 3% ABSENT_JUSTIFIE, 2% autres.
- Cohérence : pas de pointage le dimanche (FERIE/WEEKEND), heures sup ponctuelles (~10% des journées).
- 60+ affectations actives ou terminées (cohérentes avec dates chantiers).

## 7. UX details

- **Saisie groupée tablette** : chef chantier coche 20 employés présents en 5 secondes (checkbox + boutons rapides 8h/9h/10h).
- **Coût MO en temps réel** : sticky en bas listing montrant `Coût MO journée chantier : X MAD`.
- **Détection conflits** : pointage employé sur 2 chantiers même jour → modal de répartition (4h+4h, etc.).
- **Géolocalisation V2** : pointage GPS (vérifie présence sur chantier). V1 OK sans.
- **Notifications** : à 18h, conducteurs travaux non pointés → notif (V2).
- **Historique** : modification d'un pointage validé requiert motif + log audit.

## 8. Files to deliver

```
applications/erp/pages/rh/
├── pointage/
│   ├── pointage.page.{ts,html,scss}
│   ├── components/{pointage-grid, pointage-day-grid, pointage-week-grid, pointage-month-grid, saisie-individuelle-dialog, validation-day-dialog}/
│   ├── services/pointage.facade.ts
│   ├── models/
│   └── config/
└── planning-equipes/
    ├── planning-equipes.page.{ts,html,scss}
    ├── components/{rh-gantt, affectation-dialog, conflits-detector}/
    └── services/affectation.facade.ts
```

## 9. DoD

- [ ] Vue jour/semaine/mois fonctionnelle avec couleurs par type présence.
- [ ] Saisie groupée `Pointer toute l'équipe` opérationnelle.
- [ ] Validation journée bascule statut tous les pointages.
- [ ] Calculs cumul heures (normales + sup) corrects.
- [ ] Coût MO chantier alimente onglet Budget chantier.
- [ ] Planning Gantt employés rendu, drag dates fonctionnel.
- [ ] Détection conflits affectation > 100%.
- [ ] Mock seed dense (~5000 pointages cohérents).
- [ ] Performance : grille mois 40 employés × 30 jours rendue < 1s.
