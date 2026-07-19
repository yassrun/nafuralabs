# Lot 5 — Consultation fournisseurs : brancher le chiffrage sur `achats`

**Objectif** : l'étape 4 du wizard. Faire venir les prix d'offres fournisseurs réelles.

**Dépend de** : lots 9 et 4.

> ⚠️ **Ce lot ne crée aucune entité.** Une première version de cette spec proposait
> `DemandePrix` / `OffreFournisseur` / `OffreLigne` — c'était un doublon de ce qui existe déjà dans
> `achats`, exactement l'erreur qui a produit `consultation` vs `etudes`. Corrigé.

---

## Ce qui existe déjà dans `achats`

| Entité | Contenu |
|---|---|
| `AppelOffreAchat` | numero, objet, chantier, datePublication, dateLimiteDepot, status (BROUILLON / PUBLIEE / CLOTUREE / ATTRIBUEE / INFRUCTUEUSE / ANNULEE), `fournisseurInvitesIds`, `fournisseurAttribue*`, `bcGenere*`, `totalAttribueHt` |
| `AppelOffreLigne` | articleId, articleCode, articleName, quantite, uomCode |
| `OffreFournisseur` | fournisseur, dateReponse, totalHt, delaiLivraisonJours, conditionsPaiement, `retenue`, `score` |
| `OffreFournisseurLigne` | prixUnitaireHt, totalHt, delaiSpecifique, lien vers `AppelOffreLigne` |
| `BonCommandeAchat`, `ReceptionAchat`, `FactureFournisseur` | la suite du cycle |

Le cycle achat est **complet**. Il manque uniquement le **pont avec l'étude**.

---

## Le pont à construire

```
Étude (étape 4)                          Achats
──────────────                           ──────
ComposantDpu (ciment, sable…)
      │
      │ T5.1 génération
      ▼
                                    AppelOffreAchat
                                         │  + AppelOffreLigne
                                         │      ↑ origine_composant_dpu_id
                                         ▼
                                    OffreFournisseur (×N)
                                         │
                                         │ T5.3 comparatif + attribution
                                         ▼
                                    OffreFournisseurLigne retenue
      ┌──────────────────────────────────┘
      │ T5.4 report
      ▼
ComposantDpu.prixUnitaire = prixNet
ComposantDpu.sourcePrix   = CONSULTE
      │
      └──► T5.5 alimente aussi CatalogueFournisseurLigne (lot 9 T9.4)
```

---

## Tâches

### T5.1 — Génération d'un appel d'offres depuis une étude

```
POST /api/v1/etudes/dossiers/{id}/generer-appel-offres
     { composantDpuIds: [...], regroupement: "TYPE" | "FAMILLE" | "FOURNISSEUR", objet, dateLimite }
     → un ou plusieurs AppelOffreAchat en statut BROUILLON
```

Regroupement proposé automatiquement :
- **par type** (`MATIERE` / `MATERIEL` / `SOUS_TRAITANCE` / `MAIN_DOEUVRE`)
- **par famille catalogue** (`ItemCategory`, si le rattachement du lot 4 est fait)
- **par fournisseur habituel** (issu du catalogue fournisseur, lot 9)

**Quantité de la ligne d'appel d'offres** — un composant apparaît souvent dans plusieurs articles :

```
AppelOffreLigne.quantite = Σ (composant.rendement × article.quantite)
                           sur tous les articles du bordereau utilisant ce composant
```

> C'est **le seul endroit du système** où un rendement est multiplié par une quantité de bordereau.
> Ici c'est légitime : on veut le volume total à acheter pour négocier. Ce résultat ne remonte
> **jamais** dans le calcul du prix unitaire de vente. À commenter explicitement dans le code —
> c'est précisément la confusion qui a produit le bug d'origine de `consultation`.

### T5.2 — Traçabilité de l'origine

```sql
ALTER TABLE appel_offre_lignes
  ADD COLUMN origine_composant_dpu_id UUID,
  ADD COLUMN origine_dossier_etude_id UUID;

ALTER TABLE appels_offre_achat
  ADD COLUMN dossier_etude_id UUID;   -- un AO peut naître d'une étude ou d'un besoin chantier
```

Un appel d'offres reste utilisable **sans** étude (besoin chantier direct) — ces colonnes sont
nullables. On ne restreint pas le module `achats` à l'usage étude.

### T5.3 — Tableau comparatif

À vérifier : un comparatif existe peut-être déjà côté `achats` (`OffreFournisseur.score` et
`retenue` le suggèrent). **Inspecter les services et l'UI de `achats` avant d'écrire quoi que ce
soit.** S'il existe, l'étendre ; sinon le créer dans `achats`, pas dans `etudes`.

| Ligne | Qté | Fourn. A | Fourn. B | Fourn. C | Meilleur | Écart |
|---|---|---|---|---|---|---|
| Ciment CPJ 45 | 24 500 kg | 1,20 | **1,12** | 1,25 | B | −6,7 % |
| Sable 0/4 | 28 m³ | **175** | 182 | n.d. | A | −3,8 % |
| **Total** | | 34 300 | **33 936** | partiel | | |

Fonctions attendues :
- meilleur prix par ligne mis en évidence
- total par fournisseur, sur les lignes couvertes uniquement
- attribution **par ligne** (panachage) ou **globale**
- critères non financiers visibles : délai, conditions de paiement, validité
- **motif obligatoire** si l'offre retenue n'est pas la moins-disante — traçabilité d'audit
- gestion des offres partielles sans fausser les totaux

### T5.4 — Report des prix vers le chiffrage

```
POST /api/v1/etudes/dossiers/{id}/appliquer-offres
     { appelOffreId, selections: [{ appelOffreLigneId, offreFournisseurLigneId }] }
```

Pour chaque sélection :
- `ComposantDpu.prixUnitaire = OffreFournisseurLigne.prixUnitaireHt` (net de remise)
- `ComposantDpu.sourcePrix = CONSULTE`
- `ComposantDpu.offreFournisseurId = ...`
- recalcul en cascade de `PrixDpu.deboursSec` puis `prixVenteHt`
- **si le composant est un sous-ouvrage** : la cascade remonte jusqu'aux ouvrages parents
  (voir `04-decomposition-bibliotheque.md` §Récursivité)
- **le rendement n'est jamais modifié** — une consultation porte sur le prix, pas sur la quantité

Écran de confirmation avant application :
> 47 composants mis à jour. Déboursé total 1 245 300 → 1 198 450 DH (−3,8 %).
> Marge globale 7,0 % → 9,1 %.

### T5.5 — Alimentation du référentiel

Retenir une offre déclenche l'alimenteur du lot 9 (T9.4) : création d'une
`CatalogueFournisseurLigne` avec `source = OFFRE_RETENUE`. Le prix consulté aujourd'hui devient le
prix proposé par défaut au prochain chiffrage.

### T5.6 — Indicateur de couverture

En en-tête de l'étape 4 : « 47 / 62 composants avec prix consulté (76 %) — 12 % du déboursé non
consulté ».

Le gate de l'étape 4 est **non bloquant** — on chiffre souvent sans avoir tout consulté, contrainte
de délai. Mais le taux figure sur la fiche d'étude et dans le dossier de validation : le N+1 doit
savoir sur quoi il s'engage.

### T5.7 — Conversion en commande

Une fois l'affaire gagnée, l'appel d'offres attribué doit pouvoir générer un `BonCommandeAchat`.
`AppelOffreAchat.bcGenereId` existe déjà — vérifier si le service correspondant est implémenté avant
de l'écrire.

---

## Hors périmètre

- Envoi d'e-mail automatisé et portail fournisseur (export PDF + suivi manuel suffit)
- Négociation multi-tours avec historique
- Notation fournisseur (`OffreFournisseur.score` existe mais son alimentation est un autre sujet)

---

## Critères d'acceptation

- [ ] Aucune entité nouvelle de demande de prix / offre — `achats` est réutilisé
- [ ] Un appel d'offres se génère depuis les composants d'une étude, avec regroupement
- [ ] La quantité agrège correctement `rendement × quantité article` sur tous les articles concernés
- [ ] Un appel d'offres sans étude d'origine reste possible
- [ ] Trois offres se comparent, y compris partielles
- [ ] Une attribution panachée par ligne fonctionne
- [ ] Retenir une offre non moins-disante exige un motif
- [ ] Le report recalcule le chiffrage en cascade, y compris à travers les sous-ouvrages
- [ ] Les rendements sont inchangés après application
- [ ] Retenir une offre alimente le catalogue fournisseur
