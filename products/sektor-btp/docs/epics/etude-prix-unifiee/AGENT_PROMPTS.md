# Prompts pour l'agent d'implémentation

Un prompt par lot. Chacun est autonome et pointe vers les specs, qui font foi.

**Règle** : un lot = une session = une PR. Ne pas enchaîner deux lots dans la même session.

---

## En-tête commun

À placer en tête de **chaque** prompt.

```
Tu es l'agent d'implémentation du monorepo nafuralabs (ERP Sektor-BTP).

AVANT DE COMMENCER, lis dans cet ordre :
1. docs/AGENTS.md — conventions du monorepo (impératif)
2. products/sektor-btp/docs/epics/etude-prix-unifiee/00-INDEX.md
3. products/sektor-btp/docs/epics/etude-prix-unifiee/00-ARCHITECTURE.md
4. Le fichier de lot indiqué ci-dessous

RÈGLES ABSOLUES

R0. AVANT de créer une entité, un service ou un module, RECENSE l'existant dans les modules
    item, achats, stock, partner, currency, marches, chantiers, etudes.
    Ce dépôt a déjà produit DEUX doublons majeurs (consultation vs etudes ; une première
    version d'un lot recréait AppelOffreAchat). En cas de doute : demande, ne crée pas.

R1. Invariant de prix — ne jamais le rompre :
      composant.rendement = quantité PAR UNITÉ d'ouvrage (ex. 350 kg/m³)
      PrixDpu.deboursSec  = Σ(rendement × prixUnitaire)        → coût UNITAIRE
      coûtDeRevient       = deboursSec × (1 + FG%)
      PrixDpu.prixVenteHt = coûtDeRevient × (1 + marge%)       → PU de vente
      DpgfNoeud.total     = quantite × prixUnitaire
    La quantité du bordereau n'intervient QU'AU niveau DpgfNoeud.total.

R2. Ne modifie PAS DpuCalculator.computePrixVenteHt() — la formule est validée par l'expert
    métier et correcte en l'état.

R3. FRONT — le doc et la réalité divergent. docs/AGENTS.md:183 désigne
    products/sektor-btp/web/app/ comme source, mais le build ne compile QUE
    web/app/applications/erp/ (web/tsconfig.app.json → include: ["app/**/*.ts"]).
    Tout code front écrit ailleurs ne partira JAMAIS en production.
    → Écris dans web/app/applications/erp/ jusqu'à nouvel ordre.

R4. Aucune valeur métier codée en dur (taux, seuils) : passe par les paramètres tenant.
    Aucun message utilisateur en dur dans le code Java : utilise une clé i18n.
    Tout montant persisté porte une devise.
    Détail : 10-genericite-multitenant.md

R5. Métier uniquement sous products/sektor-btp/ — jamais dans platform/.

R6. Changement SQL → changelog Liquibase versionné. Jamais de DDL ad hoc.

MÉTHODE
- Commence par lire le code existant concerné avant d'écrire quoi que ce soit.
- Si une spec te paraît fausse ou incomplète, ARRÊTE-TOI et signale-le. Ne comble pas
  un trou par une invention.
- À la fin, mets à jour 00-PROGRESS.md (journal d'implémentation + cases cochées).
- Ne fais PAS de commit ni de push sans qu'on te le demande.
```

---

## Lot 9 — Référentiel articles et prix *(à exécuter en premier)*

```
[EN-TÊTE COMMUN]

LOT : 9 — Référentiel articles et prix
SPEC : products/sektor-btp/docs/epics/etude-prix-unifiee/09-referentiel-articles-prix.md

C'est le premier lot de l'epic. Purement backend — aucun front, donc aucun impact du
chantier de réorganisation front en cours.

OBJECTIF
Assainir le référentiel article / fournisseur / prix, et poser le service de résolution
de prix dont dépendent tous les lots suivants.

MODULES : item, achats, stock, currency (products/sektor-btp/backend/modules/)

CONTEXTE — rien n'est à créer de zéro. Tout existe :
  Item, ItemPrice, ItemCategory, ItemType, UnitOfMeasure   → module item
  CatalogueFournisseurLigne, ContratFournisseur,
  FactureFournisseur, AppelOffreAchat, OffreFournisseur    → module achats
  StockBalance, CostingMethod                              → module stock
  Partner, PartnerRole                                     → module partner
  module currency dédié

TROIS DÉFAUTS À CORRIGER (détail dans la spec)
  1. ItemPrice.priceType et Item.articleType existent en base mais AUCUN code ne les
     écrit ni ne les lit. Intention non terminée.
  2. Trois prix concurrents sur Item : prixUnitaire, pmp, ItemPrice.unitPrice — rien
     n'indique lequel fait foi.
  3. CatalogueFournisseurLigne n'a ni date de validité, ni devise, ni remise, ni délai.

TÂCHES : T9.1 à T9.6 de la spec. La pièce maîtresse est T9.5 (ResolutionPrixService,
hiérarchie à 7 niveaux).

POINTS DE VIGILANCE
- Item.prixUnitaire : DÉPRÉCIER, ne pas supprimer brutalement. Migrer les valeurs non
  nulles vers un ItemPrice de type ACHAT_STANDARD.
- Les valeurs de ArticleType doivent correspondre aux types de ComposantDpu — c'est le
  point de jonction catalogue ↔ décomposition. Une seule classe de correspondance, pas
  un switch dupliqué. Aligne-toi sur DpuService.mapOuvrageTypeToDpu() qui existe déjà.
- Historisation des prix : ne JAMAIS écraser. Un nouveau prix ferme le précédent
  (valid_to = nouveau.valid_from - 1 jour) et crée une ligne.
- T9.4 (alimentation automatique depuis les offres/factures/contrats) est ce qui boucle
  le cycle. Sans elle, le catalogue reste vide et les lots suivants n'ont rien à
  proposer. Ne la saute pas.
- Devises : passe par le module currency. N'écris aucune logique de change ad hoc.

TERMINÉ QUAND
Tous les critères d'acceptation de la spec sont vérifiés, et ./gradlew :sektor:app:build
passe.
```

---

## Lot 1 — Fusion du modèle *(après le lot 9)*

```
[EN-TÊTE COMMUN]

LOT : 1 — Fusion du modèle
SPEC : products/sektor-btp/docs/epics/etude-prix-unifiee/01-fusion-modele.md

Lot le PLUS RISQUÉ de l'epic : il touche le calcul de prix.

OBJECTIF
Une seule vérité de prix. Le module consultation cède ses entités à etudes, et la
sémantique du rendement est corrigée.

ORDRE IMPÉRATIF
Commence par T1.1 (tests de non-régression du calcul) AVANT toute modification.
Les valeurs attendues du cas « béton B35 » doivent être figées avant qu'on touche au
code. Si tu n'as pas ces valeurs validées, demande-les — ne les invente pas.

CAUSE RACINE À COMPRENDRE
consultation est une réécriture appauvrie de etudes, née d'une génération sans
validation métier. Elle a perdu la notion de rendement en renommant le champ en
quantiteIndicative/quantite. Un nom qui ment sur le contenu = la source du bug.
D'où T1.2 : renommer ComposantDpu.quantite → rendement, AVEC la Javadoc d'avertissement.

POINTS DE VIGILANCE
- Conserve un alias JSON `quantite` en lecture pendant une version, sinon le front casse.
- Le défaut FG 8 % est en dur à QUATRE endroits, et le défaut marge est incohérent
  (7 % dans etudes, 0 % dans consultation). Centralise dans ParametresEtudeService.
- Ne supprime le module consultation qu'après le lot 8.

TERMINÉ QUAND
Critères d'acceptation de la spec vérifiés, DpuCalculatorTest vert,
grep -r "quantiteIndicative" ne retourne rien.
```

---

## Lot 8 — Suppression des tables consultation *(avec le lot 1)*

```
[EN-TÊTE COMMUN]

LOT : 8 — Suppression des tables consultation
SPEC : products/sektor-btp/docs/epics/etude-prix-unifiee/08-migration-donnees.md

Lot court. AUCUNE migration de données : le produit n'est pas en production et les
données en base sont sans valeur (décision Q6).

COMMENCE PAR T8.1 : exécute la requête de comptage et VÉRIFIE que la décision tient
toujours. Si des études non-brouillon apparaissent sur un tenant réel, ARRÊTE-TOI et
signale-le.

ORDRE IMPÉRATIF
Le code Java (lot 1) doit être supprimé AVANT le DROP TABLE, sinon le démarrage de
l'application échoue sur des entités JPA sans table.

N'oublie pas T8.4 (permissions consultation.* à retirer ou renommer en etude.*) et
T8.6 (front — dans web/app/applications/erp/, cf. R3).
```

---

## Lots 2 à 7

⚠️ **Ne pas lancer avant la fin de la phase 3 du chantier front**
(`../front-ownership/01-PLAN.md`) — ils créent des pages qu'il faudrait sinon migrer deux fois.

Le lot 2 est l'exception partielle : sa partie backend (entité `DossierEtude`, machine à états,
gates, API) peut être faite avant. Découper le prompt en conséquence si le besoin s'en fait sentir.
