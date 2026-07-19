# Lot 1 — Fusion du modèle

**Objectif** : une seule vérité de prix. Supprimer le module `consultation` en tant que modèle de
données, migrer son apport utile vers `etudes`, et corriger la sémantique du rendement.

**Risque** : élevé — touche directement le calcul de prix. Commencer par les tests.

---

## Invariant à préserver

Relire `00-ARCHITECTURE.md` §1 avant de coder. En résumé :

```
composant.rendement    = quantité PAR UNITÉ d'ouvrage
PrixDpu.deboursSec     = Σ(rendement × prixUnitaire)     → coût UNITAIRE
PrixDpu.prixVenteHt    = deboursSec × (1+FG%) × (1+marge%) → PU de vente
DpgfNoeud.total        = DpgfNoeud.quantite × prixUnitaire
```

La quantité du bordereau n'intervient **qu'au niveau `DpgfNoeud.total`**. Jamais avant.

---

## Tâches

### T1.1 — Tests de non-régression du calcul de prix *(à faire en premier)*

Avant toute modification, figer le comportement attendu.

**Fichier** : `backend/modules/etudes/src/test/java/ma/nafura/etudes/service/DpuCalculatorTest.java`

Cas à couvrir, avec des chiffres métier réels :

| Cas | Entrée | Attendu |
|---|---|---|
| Béton B35, 1 m³ | ciment 350 kg × 1,20 DH ; sable 0,4 m³ × 180 DH ; gravier 0,8 m³ × 220 DH ; MO 1,5 h × 45 DH | `deboursSec = 735,50` |
| + FG 8 % + marge 7 % | déboursé 735,50 | `prixVenteHt = 849,86` |
| + TVA 20 % | | `prixVenteTtc = 1 019,83` |
| Ligne bordereau | quantité 70 m³ × PU 849,86 | `total = 59 490,20` |
| Rendement nul | rendement = 0 | composant à 0, pas d'exception |
| Composants vides | liste vide | `deboursSec = 0` |
| Valeurs négatives | rendement = −5 | ramené à 0 (comportement actuel `max(ZERO)`) |
| Arrondi | vérifier `HALF_UP` scale 2 sur chaque étage | pas d'accumulation d'erreur |

> Vérifier les montants attendus avec l'expert métier avant de figer le test.
> Ces valeurs deviennent la référence de tout le module.

### T1.2 — Renommer `ComposantDpu.quantite` → `rendement`

La cause racine de la dérive de `consultation` est un nom qui ment sur le contenu.

- Entité `ComposantDpu` : champ + `@Column(name = "rendement")`
- Migration SQL : `ALTER TABLE composants_dpu RENAME COLUMN quantite TO rendement;`
- DTOs : `ComposantDpuInputDto.quantite` → `rendement`
- ⚠️ **API publique** : conserver `quantite` en alias de lecture JSON pendant une version
  (`@JsonProperty` + getter de compatibilité), pour ne pas casser le front en cours de migration.
- Javadoc obligatoire sur le champ :
  ```java
  /** Quantité de ce composant nécessaire pour UNE unité d'ouvrage (ex. 350 kg de ciment par m³).
   *  Ce n'est PAS une quantité absolue — ne jamais multiplier par la quantité du bordereau ici. */
  ```

### T1.3 — Étendre `DpgfNoeud`

```sql
ALTER TABLE dpgf_noeuds
  ADD COLUMN descriptif   TEXT,
  ADD COLUMN mode         VARCHAR(20),      -- FOURNI | DECOMPOSE, sur ARTICLE uniquement
  ADD COLUMN prix_dpu_id  UUID REFERENCES prix_dpu(id) ON DELETE SET NULL;
```

Règles :
- `mode` non nul uniquement si `type = 'ARTICLE'`, défaut `FOURNI`
- `prix_dpu_id` non nul uniquement si `mode = 'DECOMPOSE'`

### T1.4 — Lier `PrixDpu` à un nœud de bordereau

Aujourd'hui `PrixDpu.ouvrageId` est `nullable = false` — un prix ne peut exister que rattaché à un
ouvrage de bibliothèque. Il faut pouvoir chiffrer un article de bordereau directement.

```sql
ALTER TABLE prix_dpu
  ALTER COLUMN ouvrage_id DROP NOT NULL,
  ADD COLUMN dpgf_noeud_id UUID REFERENCES dpgf_noeuds(id) ON DELETE CASCADE,
  ADD COLUMN source_ouvrage_id UUID,   -- traçabilité si instancié depuis la bibliothèque
  ADD CONSTRAINT prix_dpu_rattachement_chk
      CHECK (ouvrage_id IS NOT NULL OR dpgf_noeud_id IS NOT NULL);
```

### T1.5 — Ajouter la provenance du prix

```sql
ALTER TABLE composants_dpu
  ADD COLUMN source_prix VARCHAR(20) NOT NULL DEFAULT 'MANUEL',
  ADD COLUMN offre_fournisseur_id UUID,       -- rempli au lot 5
  ADD COLUMN suggere_par_ia BOOLEAN NOT NULL DEFAULT FALSE;
```

Valeurs : `MANUEL | BIBLIOTHEQUE | CATALOGUE | CONSULTE | HISTORIQUE`.

### T1.6 — Audit et verrou optimiste

Sur `Dpgf`, `PrixDpu`, et le futur `DossierEtude` :

```sql
ALTER TABLE <table>
  ADD COLUMN created_by VARCHAR(100),
  ADD COLUMN updated_by VARCHAR(100),
  ADD COLUMN version    BIGINT NOT NULL DEFAULT 0;
```

Côté Java : `@Version private Long version;` + renseigner `createdBy`/`updatedBy` depuis le contexte
d'authentification. Vérifier s'il existe déjà un `AuditingEntityListener` dans `platform/` avant d'en
écrire un — réutiliser plutôt que dupliquer.

### T1.7 — Déplacer les ports d'extraction

De `consultation/service/port/` vers `etudes/service/port/`, sans changement de signature sauf
adaptation des types (`ConsultationNoeud` → `DpgfNoeud`) :

- `BordereauExtractionPort` + `NoOpBordereauExtractionPort`
- `CpsDescriptifExtractionPort` + `NoOp...`
- `DecompositionSuggestionPort` + `NoOp...`
- `DescriptifResolverPort` + `NoOp...`
- `CatalogResolverPort`, `ItemCatalogResolver`

### T1.8 — Supprimer le module `consultation` (backend)

Après validation du lot 8 (migration des données) :

- Supprimer `backend/modules/consultation/` entièrement
- Retirer `:sektor:consultation` de `settings.gradle.kts` et des `build.gradle` dépendants
- Retirer les imports dans `app/src/main/java/ma/nafura/erp/consultation/` et `ErpApplication.java`
- Conserver les tables SQL jusqu'à validation en production (voir lot 8) — suppression dans un
  changelog ultérieur

### T1.9 — Fusionner les calculateurs

`ConsultationPricingCalculator` et `DpuCalculator` sont quasi identiques. Garder `DpuCalculator`
(il a `computePrixVenteTtc`). Supprimer l'autre.

⚠️ Le défaut FG 8 % est codé en dur à **quatre endroits** : `PrixDpu.@PrePersist`,
`ConsultationNoeud.@PrePersist`, `ConsultationNoeudService.createNoeud`,
`ConsultationNoeudService.recalculatePostePricing`. Le défaut marge est à 7 % dans `etudes` et
**0 %** dans `consultation` — incohérence à trancher (voir Q1). Centraliser dans un
`ParametresEtudeService` lisant les valeurs du tenant, avec repli sur les constantes.

---

## Critères d'acceptation

- [ ] `DpuCalculatorTest` passe, y compris le cas béton B35 validé par l'expert métier
- [ ] Aucune classe `Consultation*` de données ne subsiste
- [ ] `grep -r "quantiteIndicative"` ne retourne rien
- [ ] Le champ `rendement` porte la Javadoc de T1.2
- [ ] Aucun défaut FG/marge codé en dur hors `ParametresEtudeService`
- [ ] `./gradlew :sektor:app:build` passe
- [ ] Le lot 8 (migration) a tourné sur une copie de la base de staging sans perte

## Anti-patterns à éviter

| ❌ | ✅ |
|---|---|
| Multiplier le déboursé par la quantité du bordereau | Le déboursé reste unitaire |
| Garder `ConsultationComposant` « en attendant » | Suppression franche, migration au lot 8 |
| Renommer `quantite` sans alias JSON | Casse le front en cours de migration |
| Redéfinir un défaut FG local | `ParametresEtudeService` uniquement |
