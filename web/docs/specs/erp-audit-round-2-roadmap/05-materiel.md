# 05 — Matériel & Équipements (GMAO, carburant, locations, contrôles)

> **Sévérité** : P0 sur M-MAT-01 + M-MAT-02 (modules absents)
> **Estimation** : 1.5 sprint (S3–S4)
> **Dépendances** : Round 1 (Parc + Affectations OK), `09-rh` (CACES habilitations)

## Findings traités

- [x] **M-MAT-01** Maintenance préventive et corrective (GMAO) **P0** — *mock + pages (CRUD UI limité)*
- [x] **M-MAT-02** Carburant & consommables **P0** — *mock + pages + anomalie plein*
- [x] **M-MAT-03** Fiche engin 360° — *partiel : `/materiel/engins/:id` sans photos, conducteurs CACES, documents*
- [x] **M-MAT-04** Locations externes — *partiel : contrats / états / échéances mock, sans PDF état contradictoire*
- [x] **M-MAT-05** Réservation/planning matériel — *partiel : Gantt dhtmlx + conflits + drag (session mock)*
- [x] **M-MAT-06** Pointage matériel chantier — *partiel : saisie + liste mock, sans coût budget analytique*
- [x] **M-MAT-07** Contrôles réglementaires — *partiel : listing + blocage VGP sur fiche engin, pas sur wizard affectation*
- [ ] **M-MAT-08** GPS / télémétrie (P2)
- [ ] **M-MAT-09** Habilitations CACES blocage affectation
- [ ] **M-MAT-10** TCO par engin
- [ ] **M-MAT-11** Maintenance prédictive IA (P3)

## Goal

Implémenter une **vraie GMAO BTP** : maintenance préventive (h/km/dates), corrective (OT), suivi carburant (carnet par engin, coût analytique chantier), locations externes avec état contradictoire, contrôles réglementaires bloquants, et TCO par engin.

## Context to read first

```
app/applications/erp/pages/materiel/parc/                        # Round 1 OK
app/applications/erp/pages/materiel/affectations/                 # Round 1 OK
app/applications/erp/pages/materiel/maintenance/                  # ⚠️ redirige vers /parc — à créer
app/applications/erp/pages/materiel/carburant/                    # ⚠️ redirige vers /parc — à créer
app/applications/erp/pages/materiel/locations/                    # ⚠️ stub — à créer
app/applications/erp/materiel/                                    # services, models
app/applications/erp/shell/erp-nav.generated.ts                   # nav
```

---

## Architecture cible

```
app/applications/erp/pages/materiel/
├── parc/                       # ✅ Round 1
├── affectations/                # ✅ Round 1
├── fiche-360/                  # 🆕 fiche engin enrichie (M-MAT-03)
├── maintenance/                # 🆕 GMAO (M-MAT-01)
│   ├── plans/                  # plans entretien préventif (h/km/date)
│   ├── ot/                     # ordres de travail
│   └── historique/
├── carburant/                  # 🆕 M-MAT-02
│   ├── carnets/
│   ├── pleins/
│   └── consommations/
├── locations/                  # 🆕 M-MAT-04
│   ├── contrats/
│   ├── etats-contradictoires/
│   └── echeances/
├── planning/                   # 🆕 Gantt matériel (M-MAT-05)
├── pointage/                   # 🆕 heures fonctionnement (M-MAT-06)
├── controles/                  # 🆕 VGP/CT/étalonnage (M-MAT-07)
└── tco/                        # 🆕 P2 (M-MAT-10)
```

---

## Task 5.1 — Maintenance GMAO (M-MAT-01) **P0**

**Modèles** :

```ts
export interface PlanMaintenance {
  id: string;
  engineId: string;
  typeIntervention: string;     // « Vidange moteur », « Filtres », « Graissage »
  declencheur: 'HEURES' | 'KILOMETRES' | 'CALENDAIRE';
  seuil: number;                 // 250 h, 5000 km, 90 jours
  dernierReleve: number;
  prochainSeuil: number;
  alerteJ: number;                // 30 jours avant ou 50h avant
}

export interface OrdreTravail {
  id: string;
  numero: string;                // OT-2026-001
  engineId: string;
  type: 'PREVENTIF' | 'CORRECTIF' | 'AMELIORATION';
  declencheurPlanId?: string;
  description: string;
  dateOuverture: string;
  dateClôture?: string;
  techniciens: string[];         // employés
  piecesConsommees: PieceOT[];
  coutPieces: number;
  coutMO: number;                // heures × taux
  coutTotal: number;
  duree: number;                 // heures
  status: 'OUVERT' | 'EN_COURS' | 'CLOS' | 'ANNULE';
  prochainEntretien?: string;
}
```

**Pages** :
- `/materiel/maintenance/plans` : plans préventifs par engin
- `/materiel/maintenance/ot` : listing OT (filtrable engin, type, status)
- `/materiel/maintenance/ot/:id` : fiche OT avec saisie pièces, MO, coûts
- `/materiel/maintenance/historique/:engineId` : timeline OT par engin

**Acceptance criteria** :
- [ ] CRUD plans + OT
- [ ] Alerte « 3 entretiens à programmer cette semaine »
- [ ] Coût OT calculé auto (pièces + MO)
- [ ] Drill-down depuis fiche engin → historique OT

---

## Task 5.2 — Carburant & Consommables (M-MAT-02) **P0**

**Modèles** :

```ts
export interface CarnetCarburant {
  id: string;
  engineId: string;
  capaciteReservoir: number;
  typeCarburant: 'GAZOLE' | 'ESSENCE' | 'ADBLUE' | 'AUTRE';
  consommationCible: number;     // L/h ou L/100km
  ouverturePar: string;
  dateOuverture: string;
}

export interface PleinCarburant {
  id: string;
  carnetId: string;
  engineId: string;
  date: string;
  litres: number;
  prixLitre: number;
  total: number;
  jaugeDebut: number;             // litres restants avant plein
  jaugeFin: number;               // litres après plein
  chauffeurId?: string;
  chantierId?: string;            // affectation analytique
  fournisseurId?: string;
  pieceJustificative?: string;
  anomalie?: boolean;             // detected if écart > 15 %
}
```

**Règles** :
- Détection vol : `litres_plein > capaciteReservoir - jaugeDebut + tolérance` → flag anomalie
- Coût analytique chantier : si `chantierId` rempli, ajouter au budget poste « Carburant »

**Pages** :
- `/materiel/carburant/carnets` : 1 carnet par engin
- `/materiel/carburant/pleins` : saisie plein (manuel ou import scan ticket)
- `/materiel/carburant/consommations` : analyse L/h par engin/chantier

**Acceptance criteria** :
- [ ] Saisie plein < 30 secondes (mobile-friendly)
- [ ] Alertes anomalies (vol détecté)
- [ ] Coût carburant remontant au budget chantier
- [ ] Export CSV mensuel pour comptabilité

---

## Task 5.3 — Fiche engin 360° (M-MAT-03) **P1**

Onglets :
- **Identité** : marque, modèle, série, immatriculation, année, photos
- **Caractéristiques techniques** : puissance, capacité, dimensions
- **Affectations** : chantiers actuels + historique
- **Maintenance** : plans + OT (drill M-MAT-01)
- **Carburant** : pleins + consommation (drill M-MAT-02)
- **Contrôles réglementaires** : VGP, CT, étalonnage (drill M-MAT-07)
- **Conducteurs habilités** : liste avec CACES + dates validité
- **Documents** : carte grise, assurance, manuel

---

## Task 5.4 — Locations externes (M-MAT-04) **P1**

**Modèles** :

```ts
export interface ContratLocation {
  id: string;
  numero: string;                // LOC-2026-001
  loueurId: string;
  engineDescription: string;     // pas dans le parc (engin externe)
  chantierId: string;
  dateDebut: string;
  dateFin: string;
  tarif: { unite: 'JOUR' | 'SEMAINE' | 'MOIS' | 'HEURE'; montant: number };
  montantTotalEstime: number;
  cautionVersee?: number;
  status: 'BROUILLON' | 'ACTIF' | 'EXPIRE' | 'PROLONGE' | 'CLOS';
  documents: string[];           // contrat, attestation
}

export interface EtatContradictoire {
  id: string;
  contratLocationId: string;
  type: 'ENTREE' | 'SORTIE';
  date: string;
  releveHeures?: number;
  releveKm?: number;
  carburantRestant?: number;     // litres ou %
  observations: string;
  reservesDuLoueur?: string;
  reservesDuLouataire?: string;
  photos: string[];
  signaturesUrls: { loueur?: string; louataire?: string };
}
```

**Pages** :
- `/materiel/locations/contrats`
- `/materiel/locations/etats-contradictoires`
- `/materiel/locations/echeances` (à retourner < 7 jours)

**Acceptance criteria** :
- [ ] CRUD contrats + états
- [ ] Alerte retour à 7 jours
- [ ] PDF état contradictoire avec photos + signatures

---

## Task 5.5 — Planning matériel (M-MAT-05) **P1**

**Page** : `/materiel/planning` — Gantt avec une ligne par engin, barres par affectation chantier. Détection des conflits (2 affectations sur même engin / même période).

**Acceptance criteria** :
- [ ] Vue Gantt 4 semaines glissantes
- [ ] Drag-resize affectations (durée)
- [ ] Tooltip conflit en rouge

---

## Task 5.6 — Pointage matériel chantier (M-MAT-06) **P1**

**Modèle** :

```ts
export interface PointageEngin {
  id: string;
  engineId: string;
  chantierId: string;
  date: string;
  heuresFonctionnement: number;
  saisiPar: string;             // chef chantier
  geolocPointageLat?: number;
  geolocPointageLng?: number;
}
```

Saisie depuis mobile (cf §15) : chef chantier saisit heures de chaque engin présent à la fin de la journée.

**Acceptance criteria** :
- [ ] Saisie quotidienne mobile en < 2 min pour 5 engins
- [ ] Cumul heures → impact budget chantier (coût horaire engin × heures)
- [ ] Croisement avec carnet carburant (anomalies si heures déclarées << consommation carburant)

---

## Task 5.7 — Contrôles réglementaires (M-MAT-07) **P1**

**Modèle** :

```ts
export interface ControleReglementaire {
  id: string;
  engineId: string;
  type: 'VGP' | 'CT' | 'ETALONNAGE' | 'ASSURANCE' | 'CARTE_GRISE';
  organisme?: string;
  dateRealisation: string;
  dateExpiration: string;
  resultat: 'CONFORME' | 'CONFORME_AVEC_RESERVES' | 'NON_CONFORME';
  reserves?: string;
  certificatUrl?: string;
  prochaineDate?: string;
}
```

**Règle bloquante** : si `Engine.controles[].some(c => c.dateExpiration < today && c.type === 'VGP')` → bloquer affectation chantier.

**Acceptance criteria** :
- [ ] Tableau contrôles par engin
- [ ] Alerte J-30 avant expiration
- [ ] Blocage affectation si périmé (configurable)

---

## Task 5.8 — GPS / télémétrie (M-MAT-08) **P2**

Intégration Fleetio / Geotab / SQUOR (API REST). Mock initial : position lat/lng + heures moteur + alerte sortie de zone.

---

## Task 5.9 — Habilitations CACES (M-MAT-09) **P2**

Croiser avec §09-rh (`M-RH-05` formations). Bloquer affectation engin × employé si CACES inadéquat ou expiré.

---

## Task 5.10 — TCO par engin (M-MAT-10) **P2**

Page `/materiel/tco` :
- Coût acquisition / amortissement annuel
- Coût maintenance YTD
- Coût carburant YTD
- Taux utilisation (heures fonctionnement / heures dispo)
- TCO horaire = (coût annuel total) / heures fonctionnement
- Recommandation : conserver / vendre / louer

---

## Task 5.11 — Maintenance prédictive IA (M-MAT-11) **P3**

Différer S12+. Heuristique sur heures compteur + historique pannes.

---

## Testing

```ts
// unit
describe('MaintenanceService', () => {
  it('calcule prochain seuil après OT préventif', () => { /* … */ });
  it('alerte si dépassement seuil > seuil*1.1', () => { /* … */ });
});

// e2e
test('OT préventif réinitialise compteur', async ({ page }) => { /* … */ });
test('Blocage affectation si VGP expiré', async ({ page }) => { /* … */ });
```

## Dépendances inverses

- 02-chantiers (onglet « Matériel » fiche chantier consomme affectations + heures)
- 09-rh (CACES bloquants)
- 14-transverse (drill-down universel)
