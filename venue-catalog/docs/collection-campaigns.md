---
specVersion: 1
kind: reference
appId: venue-catalog
docId: collection-campaigns
name: Campagnes de collecte Google Places
status: draft
language: fr
---

# Campagnes de collecte Google Places — Maroc V1

Document de reference pour cadrer les imports Venue Catalog vers Layali et Beauty.
Chaque campagne correspond a un ou plusieurs jobs `POST /api/v1/catalog/jobs/google-places-search`.

## 1. Villes retenues

### Tier 1 — Lancement (priorite absolue)

Villes a couvrir en premier. Alignees sur Layali (`home` city chips), Beauty (`salons.api` enum) et `catalog-places.cityCode`.

| cityCode | Ville | Layali | Beauty | Priorite | Commentaire |
|---|---|---|---|---|---|
| `CASABLANCA` | Casablanca | oui | oui | P0 | Plus gros marche, density nightlife + salons |
| `RABAT` | Rabat (+ Sale cote grille) | oui | oui | P0 | Agdal, Hassan, Temara proches |
| `MARRAKECH` | Marrakech | oui | oui | P0 | Fort tourisme, nightlife Gueliz/Hivernage |
| `TANGIER` | Tanger | oui | oui | P1 | Cote nord, scene en croissance |
| `AGADIR` | Agadir | oui | oui | P1 | Cote sud, saisonnier mais actif |

**Recommandation :** les 5 villes citees sont le bon perimetre V1. Ne pas elargir avant d'avoir revu et publie au moins 60 % des fiches Tier 1.

### Tier 2 — Extension rapide (apres Tier 1)

| cityCode | Ville | Layali | Beauty | Priorite | Commentaire |
|---|---|---|---|---|---|
| `FES` | Fes | limite | oui | P2 | Deja dans l'enum specs ; salons nombreux, nightlife modeste |

### Tier 3 — Plus tard (hors enum V1, `cityCode = OTHER`)

A ne traiter qu'apres extension de l'enum ou mapping explicite :

| Ville | Interet Layali | Interet Beauty | Note |
|---|---|---|---|
| Meknes | faible | moyen | Proximite Fes/Rabat |
| Oujda | faible | moyen | Est du pays |
| Kenitra | faible | moyen | Banlieue Rabat — plutot grilles Rabat elargies |
| Tetouan | faible | moyen | Proximite Tanger |
| Essaouira | saisonnier | faible | Tourism / events ponctuels |

**Suggestion finale V1 :** `CASABLANCA`, `RABAT`, `MARRAKECH`, `TANGIER`, `AGADIR` puis `FES` en vague 2.

---

## 2. Perimetre par app

### Layali (`appId: layali`, `targetResource: venue`)

| primaryCategory | Sous-types metier Layali | Types Google (whitelist) |
|---|---|---|
| `NIGHTLIFE_VENUE` | CLUB, LOUNGE, ROOFTOP, EVENT_HALL | `night_club`, `bar`, `cocktail_bar`, `wine_bar`, `pub`, `event_venue`, `banquet_hall` |
| `SOCIAL_DINING` | RESTAURANT (ambiance / soiree) | `restaurant`, `mediterranean_restaurant`, `steak_house`, `fine_dining_restaurant` |

**Exclure :** `lodging`, `hotel`, `motel`, `gas_station`, `supermarket`, `gym`, `bank`, `pharmacy`, `hospital`.

**Regle metier :** privilegier lieux avec `businessStatus = OPERATIONAL` et horaires soir/week-end ou signaux `liveMusic`, `servesBeer`, `servesWine`, `outdoorSeating`.

### Beauty (`appId: beauty`, `targetResource: salon`)

| primaryCategory | Segments Beauty | Types Google (whitelist) |
|---|---|---|
| `SALON` | coiffure femme/homme, esthetique, ongles | `beauty_salon`, `hair_salon`, `hair_care`, `nail_salon` |
| `BARBERSHOP` | barbier | `barber_shop` |
| `SPA` | spa, hammam, massage | `spa`, `massage`, `wellness_center` |

**Exclure :** `gym`, `fitness_center`, `lodging`, `hospital`, `veterinary_care`.

---

## 3. Modes de collecte

Chaque campagne utilise l'un des modes suivants :

| Mode | API job | Role | maxResults par job |
|---|---|---|---|
| `TEXT` | `mode: TEXT` | Requetes nommees, niches (rooftop, hammam…) | 20 |
| `NEARBY` | `mode: NEARBY` | Couverture systematique par grille geo | 20 |

**Pipeline par job :**
1. 1 appel Google Search (text ou nearby)
2. N appels Place Details (1 par candidat retenu apres filtre whitelist)
3. INSERT/UPDATE `catalog_places` + `source_records`

**Delai entre jobs conseille :** 2–5 s (quotas Google). Enfiler les jobs d'un pack via `catalog-job` sans bloquer l'admin.

---

## 4. Grilles geographiques (NEARBY)

Rayon recommande : **1500 m** (centre-ville dense) ou **2000 m** (banlieue / sprawl).

Coordonnees centre par ville (WGS84) — a affiner avec quartiers cibles :

### CASABLANCA

| Grille | Label | lat | lng | radiusM | Focus |
|---|---|---|---|---|---|
| G1 | Centre / Maarif | 33.5869 | -7.6298 | 1500 | bars, clubs, restos |
| G2 | Anfa / Ain Diab | 33.5880 | -7.6700 | 1500 | lounges, rooftops |
| G3 | Gauthier | 33.5950 | -7.6180 | 1200 | restos, bars |
| G4 | Casa Port / Medina | 33.6050 | -7.6150 | 1200 | restos |
| G5 | Bourgogne | 33.5700 | -7.6400 | 1500 | salons, bars |
| G6 | Sidi Maarouf | 33.5300 | -7.6500 | 2000 | salons banlieue |
| G7 | Ain Sebaa / Hay Mohammadi | 33.5700 | -7.5800 | 2000 | salons |

### RABAT

| Grille | Label | lat | lng | radiusM | Focus |
|---|---|---|---|---|---|
| G1 | Agdal | 34.0020 | -6.8460 | 1500 | nightlife, salons |
| G2 | Hassan / Centre | 34.0200 | -6.8350 | 1200 | restos |
| G3 | Hay Riad | 33.9700 | -6.8700 | 2000 | salons |
| G4 | Temara / cote | 33.9280 | -6.9060 | 2000 | salons, bars ete |

### MARRAKECH

| Grille | Label | lat | lng | radiusM | Focus |
|---|---|---|---|---|---|
| G1 | Gueliz | 31.6340 | -8.0100 | 1500 | clubs, lounges, salons |
| G2 | Hivernage | 31.6240 | -8.0180 | 1200 | nightlife premium |
| G3 | Medina (peripherie) | 31.6300 | -7.9900 | 1200 | restos ambiance |
| G4 | Palmeraie | 31.6700 | -7.9700 | 2500 | venues, spas |

### TANGIER

| Grille | Label | lat | lng | radiusM | Focus |
|---|---|---|---|---|---|
| G1 | Centre / Blvd | 35.7673 | -5.7997 | 1500 | bars, salons |
| G2 | Malabata | 35.7500 | -5.7800 | 2000 | salons |
| G3 | Marshan | 35.7850 | -5.8150 | 1500 | restos, lounges |

### AGADIR

| Grille | Label | lat | lng | radiusM | Focus |
|---|---|---|---|---|---|
| G1 | Centre / Talborjt | 30.4278 | -9.5981 | 1500 | bars, salons |
| G2 | Founty / corniche | 30.4000 | -9.5800 | 2000 | nightlife saisonniere |
| G3 | Dakhla (quartier) | 30.4100 | -9.5700 | 1500 | salons |

### FES (Tier 2)

| Grille | Label | lat | lng | radiusM | Focus |
|---|---|---|---|---|---|
| G1 | Ville nouvelle | 34.0331 | -5.0003 | 1500 | salons |
| G2 | Atlas / Zohour | 34.0500 | -4.9800 | 2000 | salons |

---

## 5. Requetes TEXT par ville

Templates FR (ajouter `countryCode: MA` et `cityCode` dans le job).
Variantes AR possibles en vague 2 (`حلاق`, `نادي ليلي`, `سبا`).

### Pack Layali — requetes TEXT

| ID | cityCode | q | primaryCategoryHint |
|---|---|---|---|
| L-CASA-T01 | CASABLANCA | night club casablanca | NIGHTLIFE_VENUE |
| L-CASA-T02 | CASABLANCA | rooftop bar casablanca | NIGHTLIFE_VENUE |
| L-CASA-T03 | CASABLANCA | lounge casablanca | NIGHTLIFE_VENUE |
| L-CASA-T04 | CASABLANCA | restaurant ambiance casablanca | SOCIAL_DINING |
| L-CASA-T05 | CASABLANCA | cabaret casablanca | NIGHTLIFE_VENUE |
| L-RABA-T01 | RABAT | night club rabat | NIGHTLIFE_VENUE |
| L-RABA-T02 | RABAT | bar lounge rabat | NIGHTLIFE_VENUE |
| L-RABA-T03 | RABAT | restaurant ambiance rabat | SOCIAL_DINING |
| L-MARR-T01 | MARRAKECH | night club marrakech | NIGHTLIFE_VENUE |
| L-MARR-T02 | MARRAKECH | rooftop marrakech | NIGHTLIFE_VENUE |
| L-MARR-T03 | MARRAKECH | lounge gueliz | NIGHTLIFE_VENUE |
| L-MARR-T04 | MARRAKECH | restaurant ambiance marrakech | SOCIAL_DINING |
| L-TANG-T01 | TANGIER | night club tanger | NIGHTLIFE_VENUE |
| L-TANG-T02 | TANGIER | bar tanger | NIGHTLIFE_VENUE |
| L-AGAD-T01 | AGADIR | bar club agadir | NIGHTLIFE_VENUE |
| L-AGAD-T02 | AGADIR | restaurant ambiance agadir | SOCIAL_DINING |

### Pack Beauty — requetes TEXT

| ID | cityCode | q | primaryCategoryHint |
|---|---|---|---|
| B-CASA-T01 | CASABLANCA | salon coiffure casablanca | SALON |
| B-CASA-T02 | CASABLANCA | barbier casablanca | BARBERSHOP |
| B-CASA-T03 | CASABLANCA | hammam spa casablanca | SPA |
| B-CASA-T04 | CASABLANCA | onglerie casablanca | SALON |
| B-RABA-T01 | RABAT | salon coiffure rabat | SALON |
| B-RABA-T02 | RABAT | barbier rabat | BARBERSHOP |
| B-RABA-T03 | RABAT | spa rabat | SPA |
| B-MARR-T01 | MARRAKECH | salon coiffure marrakech | SALON |
| B-MARR-T02 | MARRAKECH | barbier marrakech | BARBERSHOP |
| B-MARR-T03 | MARRAKECH | hammam marrakech | SPA |
| B-TANG-T01 | TANGIER | salon coiffure tanger | SALON |
| B-TANG-T02 | TANGIER | barbier tanger | BARBERSHOP |
| B-AGAD-T01 | AGADIR | salon coiffure agadir | SALON |
| B-AGAD-T02 | AGADIR | spa agadir | SPA |

---

## 6. Packs de campagne (unites de lancement)

Un **pack** = ensemble de jobs a enfiler pour une ville + app. Nommage : `{APP}-{CITY}-{SCOPE}`.

### Exemple : pack `LAYALI-CASABLANCA`

| Job ID | Mode | Parametres | Types Google (si NEARBY) |
|---|---|---|---|
| L-CASA-N01 | NEARBY | G1 Maarif | `night_club`, `bar` |
| L-CASA-N02 | NEARBY | G2 Anfa | `bar`, `cocktail_bar` |
| L-CASA-N03 | NEARBY | G3 Gauthier | `restaurant`, `bar` |
| L-CASA-N04 | NEARBY | G1 Maarif | `night_club`, `event_venue` |
| L-CASA-T01..T05 | TEXT | voir section 5 | — |

**Objectif pack :** 80–150 candidats bruts, 50–90 fiches canoniques apres dedup.

### Exemple : pack `BEAUTY-CASABLANCA`

| Job ID | Mode | Parametres | Types Google |
|---|---|---|---|
| B-CASA-N01 | NEARBY | G1 Maarif | `beauty_salon`, `hair_salon` |
| B-CASA-N02 | NEARBY | G5 Bourgogne | `beauty_salon` |
| B-CASA-N03 | NEARBY | G6 Sidi Maarouf | `beauty_salon`, `nail_salon` |
| B-CASA-N04 | NEARBY | G1 Maarif | `barber_shop` |
| B-CASA-N05 | NEARBY | G2 Anfa | `spa`, `wellness_center` |
| B-CASA-T01..T04 | TEXT | voir section 5 | — |

**Objectif pack :** 120–200 candidats bruts, 80–120 fiches apres dedup.

---

## 7. Inventaire global V1 (estimation)

| Ville | Packs | Jobs NEARBY | Jobs TEXT | Jobs total | Appels Google estimes* |
|---|---|---|---|---|---|
| Casablanca | Layali + Beauty | 11 | 9 | 20 | ~420 |
| Rabat | Layali + Beauty | 8 | 6 | 14 | ~294 |
| Marrakech | Layali + Beauty | 7 | 7 | 14 | ~294 |
| Tanger | Layali + Beauty | 5 | 4 | 9 | ~189 |
| Agadir | Layali + Beauty | 5 | 4 | 9 | ~189 |
| **Total Tier 1** | | **36** | **30** | **66** | **~1 386** |

\* Hypothese : 1 search + 20 details en moyenne par job = 21 appels/job.

Ajout Fes (Tier 2) : +8 jobs, ~168 appels.

---

## 8. Ordre d'execution recommande

```
Semaine 1 — Casablanca
  1. BEAUTY-CASABLANCA (salons = volume, moins de revue)
  2. LAYALI-CASABLANCA
  3. Revue + publish mappings pilotes

Semaine 2 — Rabat + Marrakech
  4. BEAUTY-RABAT, LAYALI-RABAT
  5. BEAUTY-MARRAKECH, LAYALI-MARRAKECH

Semaine 3 — Tanger + Agadir
  6. Packs restants

Semaine 4 — Consolidation
  7. Jobs TEXT de rattrapage (niches manquantes)
  8. google-places-refresh sur fiches stale
  9. FES si capacite revue OK
```

---

## 9. Payload job (exemples)

### NEARBY Layali

```json
{
  "mode": "NEARBY",
  "query": {
    "lat": 33.5869,
    "lng": -7.6298,
    "radiusMeters": 1500,
    "countryCode": "MA",
    "cityCode": "CASABLANCA",
    "primaryCategoryHint": "NIGHTLIFE_VENUE",
    "includedTypes": ["night_club", "bar", "cocktail_bar"]
  },
  "options": {
    "maxResults": 20,
    "refreshExisting": true,
    "autoCreateMappingsForApps": ["layali"]
  }
}
```

### TEXT Beauty

```json
{
  "mode": "TEXT",
  "query": {
    "q": "salon coiffure casablanca",
    "countryCode": "MA",
    "cityCode": "CASABLANCA",
    "primaryCategoryHint": "SALON"
  },
  "options": {
    "maxResults": 20,
    "refreshExisting": true,
    "autoCreateMappingsForApps": ["beauty"]
  }
}
```

---

## 10. Criteres de succes par ville

| Indicateur | Seuil minimal V1 |
|---|---|
| Fiches `REVIEWED` Layali | >= 30 par ville Tier 1 |
| Fiches `REVIEWED` Beauty | >= 50 par ville Tier 1 |
| Taux doublons detectes | < 15 % des candidats bruts |
| Fiches `manualReviewRequired` | 100 % revues avant publish |
| Projections `PUBLISHED` | >= 80 % des fiches `REVIEWED` |

---

## 11. Open questions

- Ajouter requetes AR (`ملهى ليلي`, `صالون حلاقة`) en V1 ou V2 ?
- Etendre grilles Kenitra/Temara dans pack Rabat sans nouveau `cityCode` ?
- Seuil `AUTO_IF_SAFE` pour auto-publish Beauty (salons homogenes) vs revue manuelle Layali ?
- Budget Google Places mensuel plafond pour calibrer le rythme d'enfilage des packs ?
