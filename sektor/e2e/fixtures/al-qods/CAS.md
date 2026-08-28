# Cas de test — documents Al Qods

Chaque cas a un fichier + un JSON `expected/` + un verdict métier. Un listing HTTP 200 sans le fait = superficiel.

Schémas Extraire : `devis-consultation.schema.ts` (`lignes`) et `reception-bl.schema.ts` (`items`).

---

## Bordereau / CPS (étude, fabrique du graphe)

| Id | Fichier | Voie | Verdict |
|---|---|---|---|
| BDP-01 | `bdp/al-qods-bdp.csv` | `TabularBordereauParser` | 5 postes : 1 fft, 180 m³, 25 t, 850 m², 420 m² |
| BDP-02 | `bdp/al-qods-bdp.pdf` | Extraire / saisie manuelle | Mêmes codes. CSV = voie auto. |
| CPS-01 | `cps/al-qods-cps.pdf` | Document étude / chantier | Texte extractible, pas un scan muet |

---

## Import magique — devis consultation

Endpoint après confirmation : `POST /api/v1/consultations-achat/{id}/devis` `{ fichierNom, lignes: [{ identite, libelle, quantite, unite, prixUnitaire }] }`.
`lignes: []` → **400**, `devisRecus` inchangé.

| Id | Fichier | Clé panier | Verdict |
|---|---|---|---|
| **IM-01** | `consultations/IM-01-devis-lafarge-ciment.pdf` | `ciment-cpj-45` | 2 lignes. Ciment **40 t × 1083.75**. `devisRecus = 1`, statut `DEVIS_RECU`. |
| **IM-02** | `consultations/IM-02-devis-holcim-ciment.pdf` | `ciment-cpj-45` | 2ᵉ fournisseur, **1050** MAD/t. Composant ciment **CONSULTÉ**. |
| **IM-03** | `consultations/IM-03-devis-vide.pdf` | `ciment-cpj-45` | Extraction vide → POST 400. **Pas** d’incrément. |
| **IM-04** | `consultations/IM-04-devis-hors-panier-peinture.pdf` | `ciment-cpj-45` | PARTIAL. Ciment matché. `peinture-ext` **hors DPU** : pas d’article catalogue inventé. |
| **IM-05** | `consultations/IM-05-devis-sonasid-acier.pdf` | `acier-ha` | 1 devis, **25 t × 9800**. CONSULTÉ si min N tenant = 1. |

Preuve existante SEKTOR-135 : payload API, pas le PDF. Al Qods ajoute le **fichier** + le 2ᵉ devis (IM-02) + le vide (IM-03) + le hors panier (IM-04).

---

## Demandes d’achat

`POST /api/v1/demandes-achat` — `articleId` UUID runtime. Aujourd’hui le DTO **n’a pas** `noeudId` : DA-01 est le discriminant du palier 1 (SEKTOR-222).

| Id | Fichier | Rôle | Verdict |
|---|---|---|---|
| **DA-01** | `da/DA-01-ciment-noeud-2-1.json` | `conducteur` | 40 t CPJ 45, **nœud 2.1**, besoin 2026-09-10. Sans nœud ≠ ce cas. |
| **DA-02** | `da/DA-02-acier-noeud-2-2.json` | `conducteur` | 25 t HA, nœud 2.2. |
| **DA-03** | `da/DA-03-base-vie-sans-noeud.json` | `conducteur` | Générique (clôture). Autorisé. **Absent** de l’attachement. |

`daf` ne crée pas la DA. `chef-chantier` ne l’approuve pas.

---

## Bons de livraison (import magique + métier)

Schéma Extraire : `blReference`, `date`, `sender`, `receiver`, `items[]`.
Métier : `POST /api/v1/bons-commande-achat/{id}/receptions` (`blNumero`, `destLocationId`, lignes `quantiteRecue` > 0).

| Id | Fichier | Kind | Verdict métier |
|---|---|---|---|
| **BL-01** | `bl/BL-01-lafarge-ciment-40t.pdf` | happy | BL **44012**, 40 t = BC. Reste 0. Imputation nœud **2.1**. Direct chantier. |
| **BL-02** | `bl/BL-02-acier-partiel-12t.pdf` | partiel | BL **55101**, **12 t / 25 t**. Reste **13 t**. Interdit d’avancer 25 t d’acier. |
| **BL-03** | `bl/BL-03-acier-ecart-30t.pdf` | écart | 30 t > BC 25 t → **refus ou écart tracé**, jamais OK silencieux. |
| **BL-04** | `bl/BL-04-mauvais-chantier.pdf` | mauvais chantier | Destinataire Lycée Ibn Sina Kenitra → **refus** sur Al Qods. |
| **BL-05** | `photos/bl-photo-terrain-ciment.png` | photo | Même fait que BL-01 si OCR lit 44012 / 40 t. Gold = PDF BL-01 si la photo rate. |

Rôles : `chef-chantier` ou `magasinier` réceptionnent. `daf` n’a pas « Réceptionner le BL ».

---

## ST / OS / photos chantier

| Id | Fichier | Usage |
|---|---|---|
| ST-01 | `st/BPU-coffrage-2-3.pdf` | Contrat ST poste **2.3**, 850 m² × 95 MAD |
| ST-02 | `st/BPU-etancheite-3.pdf` | Contrat ST poste **3**, 420 m². Mois 1 : **0 m²** |
| OS-01 | `docs/OS-ALQODS-001.pdf` | OS 2026-09-01 → `EN_COURS` |
| PV-01 | `docs/PV-coulage-2-1.pdf` | 40 m³ le 12/09, rattaché au nœud 2.1 |
| PH-01 | `photos/coulage-fondations.png` | Document chantier / nœud 2.1 |
| PH-02 | `photos/livraison-acier-partielle.png` | Visuel BL-02 (tas partiel, pas un camion plein) |

---

## Ordre dans la preuve (SEKTOR-226)

1. BDP-01 → arbre. CPS-01 en pièce jointe.
2. IM-01 puis IM-02 (ciment CONSULTÉ) ; IM-05 acier ; IM-03 ne compte pas ; IM-04 hors panier.
3. Convertir, OS-01, PH-01 + PV-01.
4. DA-01 → BC Lafarge → BL-01. DA-03 base vie.
5. ST-01 coffrage. ST-02 étanchéité (0 m²).
6. DA-02 → BC 25 t → **BL-02 12 t**. Tenter BL-03 et BL-04.
7. Avancement 40 m³ / 120 m². Attachement. Situation sans interne ni lot 3 inventé.

---

## Pas dans ce pack (palier 2)

Engins (pelle, pompe à béton), plan de charge RH, besoins matière **datés** par activité : scénario [`SCENARIO.md` § Palier 2](../../../raster-src/lots/chantiers/vie-de-chantier/SCENARIO.md). Lots `planning-activites` / `capacite-et-engagement`. Pas de PDF engin ici.
