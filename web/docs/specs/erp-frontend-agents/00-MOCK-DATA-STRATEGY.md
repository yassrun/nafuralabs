# Mock Data Strategy — ERP BTP Maroc

> Objectif : un jeu de données mock **cohérent, dense, plausible** pour qu'un démo client BTP Maroc paraisse réelle. Tous les agents doivent piocher dans ces seeds (ou y ajouter, jamais en re-créer de fictifs incohérents).

## Société de démo

```
Société : SEYRURA BTP SARL
ICE     : 002847593000087
RC      : 715869 — Casablanca
IF      : 40297583
Patente : 35628471
CNSS    : 9847562
Capital : 1 000 000 MAD
Siège   : 47 Boulevard Zerktouni, Casablanca 20100
Tél     : +212 522 36 78 90
```

## Plan comptable BTP Maroc (CGNC adapté)

Classes utilisées par l'ERP :
- **2 Immobilisations** — engins, matériel.
- **3 Stocks** — matériaux (3111), fournitures (3121), travaux en cours (3411).
- **4 Tiers** — fournisseurs (4411), clients (3421), avances clients (3427), retenues garantie (4486).
- **5 Trésorerie** — banques (5141), caisse (5161), virements (5115).
- **6 Charges** — achats matières (6111), sous-traitance (6131), location matériel (6132), salaires (617), charges sociales (618).
- **7 Produits** — ventes travaux (7111), prestations (7121).

> Les comptes utilisés dans les écritures mock doivent suivre cette nomenclature.

## TVA

Taux applicables BTP Maroc :
- **20%** — taux normal (matériaux, prestations standard).
- **14%** — transports, opérations spécifiques.
- **10%** — opérations bancaires, hôtellerie (rare en BTP).
- **7%** — exportations, eau (rare).
- **0%** — exonérations (export, certains équipements).

Conventions mock : majorité 20%, ~10% 14%, exonérations sur lots spécifiques.

## Devises

Devise de référence : **MAD** (dirham marocain). Devises secondaires : EUR, USD pour fournisseurs étrangers (import matériaux).

## Chantiers de démo (12 chantiers, à utiliser partout)

| Code | Nom | Client | Type | Budget MAD HT | Statut | Début | Fin |
|------|-----|--------|------|---------------|--------|-------|-----|
| CH-2025-001 | Résidence Yasmine — Casa | OCP Promotion | Bâtiment R+5 | 24 500 000 | EN_COURS | 2025-03-15 | 2026-09-30 |
| CH-2025-002 | Pont Bouregreg ouvrage 3 | ADM | TP — ouvrage d'art | 87 000 000 | EN_COURS | 2025-06-01 | 2027-12-31 |
| CH-2025-003 | Lotissement Al Boustane | Addoha | Lotissement 80 lots | 18 200 000 | EN_COURS | 2025-09-10 | 2026-12-15 |
| CH-2025-004 | Ecole Tanger Med phase 2 | MEN | Bâtiment scolaire | 12 800 000 | EN_COURS | 2025-11-20 | 2026-08-30 |
| CH-2025-005 | Voirie Mohammedia secteur 7 | Commune Mohammedia | VRD | 9 600 000 | EN_COURS | 2026-01-08 | 2026-07-15 |
| CH-2025-006 | Hôtel Atlas Marrakech | Atlas Hospitality | Bâtiment hôtelier | 42 000 000 | SUSPENDU | 2025-04-01 | 2026-12-31 |
| CH-2025-007 | Station traitement eaux Berrechid | ONEE | Génie civil industriel | 31 500 000 | EN_COURS | 2025-08-01 | 2027-02-28 |
| CH-2025-008 | Gymnase universitaire Rabat | UM5 | Bâtiment équipement | 6 800 000 | EN_COURS | 2026-02-10 | 2026-10-30 |
| CH-2024-019 | Villa Anfa Place — Casa | Privé Benjelloun | Villa luxe | 5 400 000 | TERMINE | 2024-09-01 | 2025-08-15 |
| CH-2024-022 | Réhabilitation médina Tétouan | Min. Culture | Réhabilitation | 14 200 000 | TERMINE | 2024-11-01 | 2025-12-20 |
| CH-2025-009 | Centre commercial Tanger | Aksal Group | Bâtiment commercial | 56 000 000 | EN_COURS | 2025-10-15 | 2027-06-30 |
| CH-2025-010 | Forage AEP Errachidia | ONEE | Hydraulique | 4 200 000 | EN_COURS | 2026-03-01 | 2026-09-30 |

> **Règle d'or** : tout document transactionnel mock (BC, BL, facture, pointage, situation, incident…) doit référencer un chantier de cette liste. Pas de chantiers orphelins.

## Clients (10)

| Code | Raison sociale | Type | ICE | Ville |
|------|----------------|------|-----|-------|
| CLI-001 | OCP Promotion SA | SA | 001234567890123 | Casablanca |
| CLI-002 | ADM (Autoroutes du Maroc) | SA | 000987654321098 | Rabat |
| CLI-003 | Addoha SA | SA | 002345678901234 | Casablanca |
| CLI-004 | Ministère Education Nationale | Public | — | Rabat |
| CLI-005 | Commune Mohammedia | Public | — | Mohammedia |
| CLI-006 | Atlas Hospitality | SARL | 003456789012345 | Marrakech |
| CLI-007 | ONEE Branche Eau | EEP | 000456789012345 | Rabat |
| CLI-008 | Université Mohammed V | Public | — | Rabat |
| CLI-009 | Aksal Group SA | SA | 001567890123456 | Casablanca |
| CLI-010 | M. Benjelloun (privé) | Particulier | — | Casablanca |

## Fournisseurs (25 — déjà partiellement dans inventory mock, étendre)

Catégories à couvrir :
- **Cimentiers** : Lafarge Holcim Maroc, Ciments du Maroc, CIMAT.
- **Aciers** : Sonasid, Maghreb Steel, Riva Acier Maroc.
- **Granulats / béton** : Béton Maroc, GCS, Holcim Béton, Lafarge Bétons.
- **Engins / location** : Maroc Manutention, AFM Engins, Loca BTP.
- **Carburants** : Afriquia, Total Maroc, Vivo Energy.
- **Sous-traitants** : ETB Mansouri, Génie Plomberie Casa, Electro BTP, Façade Pro Maroc.
- **Consommables / EPI** : Distri Pro, BTP Tools, Sécuripro.

> Format : `code, nom, ICE, RC, ville, contact, conditions_paiement (30j fin de mois | 60j | comptant), tva (20|14|0)`.

## Sous-traitants (10)

Spécialités courantes BTP Maroc à représenter : terrassement, gros œuvre, étanchéité, électricité, plomberie, peinture, menuiserie alu, menuiserie bois, façade, ascenseurs.

## Employés (40 — pour le module RH)

Répartition réaliste :
- Direction & encadrement : 4 (DG, DAF, Resp. exploitation, Resp. études).
- Conducteurs travaux / chefs chantier : 8.
- Ingénieurs / techniciens études : 6.
- Chefs d'équipe : 8.
- Maçons / coffreurs / ferrailleurs : 10 (catégorisation ouvriers).
- Conducteurs engins : 4.

Statuts : CDI 28, CDD 8, intérim 4. Salaires bruts cohérents (2 800 MAD ouvrier → 18 000 MAD ingénieur → 45 000 MAD direction).

## Articles / matériaux (≥ 80)

Familles BTP types (déjà partiellement dans inventory mock) :
- **Ciments & liants** : ciment CPJ 35, ciment CPJ 45, chaux hydraulique, mortier prêt.
- **Aciers** : rond à béton T10/T12/T14/T16/T20/T25, treillis soudés, profilés HEA/IPN.
- **Granulats** : sable 0/4, gravette 4/6, gravier 6/10, gravier 10/20, tout-venant.
- **Béton prêt** : BCN 25, BCN 30, BCN 35.
- **Bois & coffrage** : madrier sapin, contreplaqué CTBX, pointes.
- **Étanchéité** : feutre bitumé, primaire, mastic.
- **Électricité** : câbles HO7 1.5/2.5/4/6, gaines ICTA, disjoncteurs, prises.
- **Plomberie** : tubes cuivre, raccords laiton, PVC évacuation, robinetterie.
- **Carrelage / revêtement** : carrelage 60x60, faïence 25x40, plinthes.
- **Menuiserie** : portes pleines, vitrages, châssis alu, profilés.
- **Consommables / EPI** : casques, gants, harnais, gilets, gasoil 50, huile moteur.
- **Engins** (catalogue matériel) : pelle JCB JS220, chargeur Volvo L60, camion benne Renault Kerax, grue à tour Potain MDT 178, compresseur Atlas Copco, vibreur béton, bétonnière 350L, échafaudage cadre 6m.

> Prix unitaires en MAD HT cohérents avec marché Maroc 2026 (ex: ciment CPJ 35 ≈ 78 MAD/sac, T12 ≈ 14 500 MAD/T, gasoil 50 ≈ 12.5 MAD/L, location pelle 220 ≈ 2 800 MAD/jour).

## Dates de mock

- Période active : du **2026-01-01** au **2026-05-08** (date courante).
- Historique : 6 mois en arrière (juillet 2025 → mai 2026) pour avoir des séries temporelles.
- Documents en BROUILLON : ~15% — VALIDE/CLOTURE : ~75% — ANNULE : ~10%.

## Numérotation

| Type | Format | Exemple |
|------|--------|---------|
| Chantier | `CH-AAAA-NNN` | CH-2026-014 |
| Bon de commande | `BC-AAAA-NNNNN` | BC-2026-00387 |
| Demande achat | `DA-AAAA-NNNN` | DA-2026-0142 |
| Bon livraison | `BL-AAAA-NNNNN` | BL-2026-00298 |
| Facture client | `FC-AAAA-NNNNN` | FC-2026-00056 |
| Facture fournisseur | `FF-AAAA-NNNNN` | FF-2026-00214 |
| Devis | `DV-AAAA-NNNN` | DV-2026-0089 |
| Situation | `SIT-CH-NNN-NN` | SIT-CH-001-04 |
| Inventaire | `INV-AAAA-NNNN` | INV-2026-0021 |
| Transfert | `TR-AAAA-NNNN` | TR-2026-0145 |
| Réception | `RC-AAAA-NNNNN` | RC-2026-00876 |
| Affectation matériel | `AFF-AAAA-NNNN` | AFF-2026-0034 |
| Incident HSE | `INC-AAAA-NNN` | INC-2026-007 |

## Stratégie d'implémentation mock

Pour chaque module nouveau :

1. **Créer un mock service** au niveau du module (`applications/erp/<module>/mock/<module>-mock.service.ts`).
2. **Seeder les données** dans un fichier `applications/erp/<module>/mock/seeds.ts` avec les listes ci-dessus.
3. **Réutiliser les seeds globaux** quand applicable (chantiers, clients, fournisseurs, articles existent déjà partiellement — ne pas dupliquer).
4. **Persistance** : optionnel, via `localStorage` pour que les ajouts/edits survivent au reload (déjà le cas pour inventory).
5. **Délais réseau simulés** : `delay(150 + Math.random() * 250)` sur les `Observable` mock pour réalisme.

## Lookups partagés (centralisés)

Créer/maintenir : `web/app/applications/erp/shared/mock/global-lookups.service.ts` exposant :

- `chantiers$` — liste de tous les chantiers.
- `clients$` — clients.
- `fournisseurs$` — fournisseurs.
- `articles$` — catalogue articles (proxy vers inventory mock).
- `employees$` — employés (alimenté par RH mock).
- `sousTraitants$` — sous-traitants (alimenté par chantiers mock).

> Tous les modules consomment ces lookups au lieu de redéfinir leurs propres listes.
