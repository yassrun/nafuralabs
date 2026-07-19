# Lot 10 — Ne pas se fermer de portes

**Périmètre fonctionnel : le Maroc uniquement.** Ce lot ne construit **aucune** fonctionnalité
internationale. Il évite seulement les choix qui coûteraient cher à défaire.

**Ordre d'exécution** : ce ne sont pas des tâches séparées mais des **règles à respecter pendant les
autres lots**. Il n'y a rien à livrer isolément.

---

## Le principe

> On développe pour le Maroc. On code de façon à ne pas avoir à tout réécrire si on en sort.

La différence tient en une question, à se poser à chaque choix :

**« Si on doit changer ça dans deux ans, est-ce une migration de données ou une modification de
code ? »**

Une modification de code est acceptable — on la fera le jour où le besoin existe. Une migration de
données sur une base de production multi-tenant, avec des montants et des historiques, est ce qu'on
veut éviter. C'est le seul critère de ce lot.

---

## Ce qu'on fait maintenant (peu coûteux, très coûteux à rattraper)

### R1 — Une devise sur chaque montant persisté

```sql
-- ✅ dès maintenant
montant_ht   NUMERIC(18,4) NOT NULL,
currency_id  UUID NOT NULL REFERENCES currencies(id)
```

Le module `currency` existe. On stocke le dirham partout, l'UI ne propose que le dirham, aucune
conversion n'est implémentée. Mais la colonne est là.

**Pourquoi maintenant** : ajouter `currency_id` plus tard sur des tables de montants en production
signifie choisir rétroactivement la devise de chaque ligne historique. C'est le cas typique où
attendre coûte cher.

**Ce qu'on ne fait pas** : conversion, taux de change, multi-devise sur une même étude, devise
d'affichage. Rien.

### R2 — Les valeurs métier dans une table de paramètres, pas dans le code

```java
// ❌ interdit
if (this.tvaTaux == null) this.tvaTaux = new BigDecimal("20");

// ✅ attendu
this.tvaTaux = parametres.tauxTvaParDefaut();   // valeur MA en base, constante en repli commenté
```

Le `ParametresEtudeService` (déjà prévu au lot 1 T1.9) porte : taux de TVA, FG et marge par défaut,
type de marge, base de prix de chiffrage, seuils d'approbation, capacités activables.

**Pourquoi maintenant** : c'est de toute façon nécessaire — les taux varient d'une entreprise à
l'autre, pas seulement d'un pays à l'autre. Le FG à 8 % est aujourd'hui codé en dur à **quatre**
endroits, avec un défaut de marge incohérent (7 % dans `etudes`, 0 % dans `consultation`). Il faut
le corriger de toute façon ; autant que la table soit au bon niveau.

**Ce qu'on ne fait pas** : profils pays, fichiers `MA.json` / `FR.json`, écran d'administration
sophistiqué. Un enregistrement de paramètres par tenant, initialisé avec les valeurs marocaines,
suffit.

### R3 — Les messages utilisateur portent une clé, pas un texte

```java
// ❌ interdit — dans ConsultationService.assertGate() aujourd'hui
throw new IllegalArgumentException("Ajoutez au moins un poste au bordereau avant de continuer");

// ✅ attendu
throw new BusinessException("etude.gate.bordereau.aucun_article", Map.of("dossierId", id));
```

Les libellés français vivent dans les fichiers de traduction du front, où ils sont déjà.

**Pourquoi maintenant** : c'est le même effort d'écriture. Un message en dur dans un service métier
est invisible depuis le front et ne sera jamais retrouvé au moment où on en aura besoin. S'aligner
sur le dispositif i18n existant (`web/docs/specs/i18n-roadmap/`) — ne pas en inventer un.

**Ce qu'on ne fait pas** : traduire quoi que ce soit. Le français reste la seule langue livrée.

### R4 — Le réglementaire ne descend pas dans `etudes`

Ce qui relève d'un cadre juridique — CCAG-T, retenue de garantie, révision de prix indexée
(`IndiceBtp`), mentions légales — reste dans `marches`. Le module `etudes` produit un montant et une
décomposition ; il ne connaît pas le droit marocain des marchés.

**Pourquoi maintenant** : c'est de la discipline d'architecture, ça ne coûte rien. Vérifier
qu'aucune dépendance de cette nature n'apparaît pendant le lot 7.

**Ce qu'on ne fait pas** : abstraire ou généraliser `marches`. Il reste marocain, c'est très bien.

### R5 — Clés i18n neutres

`etude.composant.rendement`, pas `etude.composant.deboursSec`. Le vocabulaire du chiffrage n'est pas
universel — « déboursé sec » se dit *prime cost*, « bordereau » se dit *bill of quantities*.

**Pourquoi maintenant** : renommer des clés plus tard oblige à reprendre tous les fichiers de
traduction et tous les gabarits. Coût nul aujourd'hui, réel demain.

### R6 — Les capacités inutilisées sont masquées, pas supprimées

`ItemPrice.priceType = VENTE` (négoce d'articles seuls) : le tenant marocain type ne s'en sert pas.
On garde le modèle, on masque l'UI derrière un booléen de paramètre.

**Pourquoi maintenant** : réactiver un booléen ne coûte rien ; recréer une colonne et remigrer les
données en coûte.

---

## Ce qu'on ne fait PAS

Explicitement hors périmètre, à ne pas anticiper :

| Non fait | Pourquoi c'est sans risque de reporter |
|---|---|
| Profils pays (`MA.json`, `FR.json`, `GENERIC.json`) | Ajout de fichiers de configuration — aucune migration |
| Traductions autres que le français | Ajout de fichiers de traduction, si R3 et R5 sont respectées |
| Conversion de devises et taux de change | Service à écrire, la colonne existe déjà (R1) |
| Multi-devise sur une même étude | Concerne le calcul, pas le schéma |
| Multi-société par tenant | À réévaluer si le besoin apparaît — `Chantier.societeId` existe déjà |
| Systèmes d'unités non métriques | `UnitOfMeasure` est déjà générique |
| Abstraction du cadre réglementaire | R4 suffit à ce que ce soit possible plus tard |
| Plans comptables paramétrables | Hors périmètre de cet epic |

---

## Vérification

Une seule question de revue, à chaque fin de lot :

> **Y a-t-il, dans ce que je viens d'écrire, quelque chose dont le changement futur imposerait une
> migration de données plutôt qu'une modification de code ?**

Contrôles concrets :

- [ ] Tout montant persisté a une colonne devise
- [ ] `grep -rn 'new BigDecimal("20")\|new BigDecimal("8")\|new BigDecimal("7")'` sur les modules
      touchés ne retourne que des replis commentés
- [ ] Aucune chaîne de message utilisateur en français dans le code Java des modules touchés
- [ ] Aucune dépendance de nature réglementaire de `etudes` vers `marches`
- [ ] Les clés i18n ajoutées sont neutres

C'est tout. Pas de test de généricité, pas de profil `GENERIC` — on développe pour le Maroc.
