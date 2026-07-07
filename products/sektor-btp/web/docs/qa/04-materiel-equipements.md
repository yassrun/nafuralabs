# 04 — Matériel & Équipements

> **Audit 2026-06-19** · routes crawl **OK** · **QA browser 20/06** (7 routes smoke PASS) · Parc alimenté via ERP (3 engins). Affectation ENG-PEL-01→CH-2026-004 seedée via API (`seed-qa-materiel-ext.mjs`). GMAO locations/carburant/plans/OT/contrôles/pointage = **in-memory** (`MaterielGmaoFacadeService`) ; planning affectations = **API** `GET /api/v1/materiel-affectations`.

Base : `/materiel`.
Gestion du parc (engins, équipements) : exploitation + maintenance/GMAO.

---

## A. Exploitation

### A1. Parc matériel — `/materiel/parc`

- [x] Liste des engins/équipements (3 engins QA créés via ERP).
- [ ] **Créer/éditer/supprimer** un matériel (formulaire UI — route création `/materiel/parc/new`).
- [ ] Statut disponibilité (disponible / affecté / en location / maintenance).

### A2. Affectations — `/materiel/affectations`

- [x] Liste + **créer** une affectation matériel → chantier.
- [x] Période d'affectation, taux d'imputation.
- [ ] Restitution / fin d'affectation.

### A3. Locations — `/materiel/locations`

- [x] Hub + onglets **Contrats** / **États contradictoires** / **Échéances** — smoke 20/06, redirect `/contrats` (**in-memory**, liste vide).
- [ ] Liste des locations (loueur externe) + détail — pas de données seed (API `ContratLocation` absente ; Loca-Engins Atlas non injectable).
- [ ] Contrat de location, tarif, période, coût imputé chantier.

### A4. Planning matériel — `/materiel/planning`

- [x] Vue planning d'occupation du parc — Gantt dhtmlx charge ; barre **Pelle Caterpillar 320 — CH-2026-004** (affectation API seedée).
- [ ] Détection des conflits d'affectation — logique UI présente ; non vérifiable (1 seule affectation active QA).

### A5. Pointage matériel — `/materiel/pointage`

- [x] Saisie des heures/jours d'utilisation par engin/chantier — formulaire + **Enregistrer** ajoute une ligne (**in-memory**, session uniquement ; brouillon par défaut `mat-001` / `PROJ-2024-001`).
- [ ] Valorisation du coût d'utilisation — absent.

### A6. Contrôles — `/materiel/controles`

- [x] Liste des contrôles réglementaires (VGP, CT) + échéances — page + tableau (**in-memory**, vide).
- [ ] Alertes de contrôle à échéance — aucune donnée / pas d'alerte.

---

## B. Maintenance

### B1. Plans de maintenance — `/materiel/maintenance/plans`

- [x] Page liste — smoke 20/06, état vide « Aucun plan » (**in-memory** ; seed `notesMaintenance` sur ENG-PEL-01 non reflété ici).
- [ ] Liste des plans préventifs + détail — pas de CRUD ni lien fiche engin.
- [ ] Périodicité (heures moteur / km / calendaire), gammes d'intervention.
- [ ] Génération des ordres de travail à échéance — lien vers `/maintenance/ot` seulement.

### B2. Carburant — `/materiel/carburant/carnets`

- [x] Page carnets — smoke 20/06, tableau vide (**in-memory** ; aucun carnet auto-créé depuis le parc ERP).
- [ ] Carnets de pleins par engin — pas de seed ENG-CAM-04 (API pleins absente).
- [ ] **Créer** un plein (date, litres, coût, compteur, engin) — formulaire sur `/materiel/carburant/pleins` bloqué sans carnet.
- [ ] **Export CSV** des pleins — bouton sur `/pleins` (in-memory) ; non testé faute de données.
- [ ] Calcul consommation (L/100km ou L/h) + dérives — route `/materiel/carburant/consommations` non visitée.

### B3. Ordres de travail — `/materiel/maintenance/ot`

- [x] Page liste OT — smoke 20/06, tableau vide (**in-memory**).
- [ ] Détail OT, pièces consommées, clôture.

---

## Jeux de données

### Matériel (parc)

| Code | Type | Marque | N° série | Valeur (MAD) | Statut |
|------|------|--------|----------|--------------|--------|
| ENG-PEL-01 | Pelle hydraulique | Caterpillar 320 | CAT320-7781 | 1 450 000 | Disponible |
| ENG-CAM-04 | Camion benne | MAN TGS 26.400 | MAN-26400-1123 | 980 000 | Affecté |
| ENG-GRU-02 | Grue à tour | Potain MDT 219 | POT219-0456 | 2 100 000 | Maintenance |

### Affectation

| Matériel | Chantier | Période | Taux imputation |
|----------|----------|---------|-----------------|
| ENG-PEL-01 | CH-2026-004 | 01/07/2026 → 31/08/2026 | 850 MAD/j |

### Location

| Loueur | Matériel | Tarif | Période |
|--------|----------|-------|---------|
| Loca-Engins Atlas | Compacteur tandem | 1 200 MAD/j | 10/07 → 20/07/2026 |

### Plein carburant

| Engin | Date | Litres | Coût | Compteur |
|-------|------|--------|------|----------|
| ENG-CAM-04 | 18/06/2026 | 180 L | 2 340 MAD | 84 210 km |

### Plan de maintenance

| Engin | Type | Périodicité | Prochaine échéance |
|-------|------|-------------|--------------------|
| ENG-PEL-01 | Vidange + filtres | 500 h moteur | à 2 000 h |
