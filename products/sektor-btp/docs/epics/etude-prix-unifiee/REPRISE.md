# Point de reprise — session du 2026-07-19

Document de passation. Tout ce qu'il faut pour reprendre sans relire l'historique.

---

## Où on en est

**44 commits, arbre propre, build complet vert.**

| Lot | État |
|---|---|
| 9 — Référentiel articles & prix | ✅ vérifié sur staging |
| 1 — Fusion du modèle | ✅ vérifié sur staging |
| 8 — Suppression de `consultation` | ✅ vérifié sur staging |
| 2 — Dossier d'étude + wizard | 🟡 **backend seul** — front à faire |
| 3 — Documents & CPS indexé | ✅ backend, validé sur un CPS réel |
| 4 — Décomposition & bibliothèque | ⬜ |
| 6 — Chiffrage & validation | ⬜ |
| 5 — Branchement sur `achats` | ⬜ |
| 7 — Chaînage aval | ⬜ |
| Chantier front (epic séparé) | ✅ **5 phases terminées**, `web/` supprimé |

**J1 atteint et vérifié sur staging** : 191/191 changesets, application `UP` en `ddl-auto=validate`.

---

## À faire, dans l'ordre conseillé

### 1. Amorcer la bibliothèque depuis le classeur réel

Le classeur de l'expert (`~/Downloads/II - LOT N° 2 GROS-ŒUVRE…xlsx`) contient **182 ouvrages
sous-détaillés** sur 16 familles. C'est le premier corpus réel, et c'est ce qui manquait pour que
l'assistance IA ait de quoi s'appuyer (D4).

Extraire → `Ouvrage` + `ComposantOuvrage` avec leurs rendements. Attention : **ce sont leurs
valeurs**, elles entrent comme données d'un tenant, jamais comme seed global. Voir
[`11-SOURCES-METIER.md`](11-SOURCES-METIER.md).

### 2. Lot 2 — front

Le backend est fait (entité, machine à états, 5 gates, API, permissions). Reste les écrans.
Le chantier front étant terminé, le code va dans `products/sektor-btp/web/app/` (alias `@app/*`).

Points imposés par la spec :
- consommer `GET /dossiers/{id}/gates` au lieu de recalculer les règles côté front
- afficher **la liste des articles fautifs avec liens cliquables**, jamais un bouton grisé muet
- pas de rechargement de l'arbre complet après chaque mutation

### 3. Lot 4 — décomposition & bibliothèque

Inclut les ouvrages composites (D9) et la **base de rendement mixte** (jour/unité) déjà en base.
La MO se saisit en **effectif + production journalière**, l'outil dérive les heures par unité.

### 4. Lot 6 — chiffrage

Débloqué. Formule confirmée, ne pas y toucher. Ajouts attendus : colonne « coût de revient »,
application en masse d'un taux, **bandeau collant de marge globale en temps réel**.

### 5. Lots 5 et 7

Branchement sur `achats` (aucune entité à créer), puis chaînage devis → chantier + marché + budget.

---

## Les pièges — lire avant de coder

**Gradle ne démarre pas** avec un `java.io.tmpdir` long : Java crée son pipe interne via une
socket AF_UNIX limitée à ~108 caractères de chemin.

```bash
TMP='C:\Temp\gw' TEMP='C:\Temp\gw' ./gradlew --no-daemon -Djava.io.tmpdir='C:\Temp\gw' <tâche>
```

**Front** : `node_modules` est hissé à la racine par les workspaces npm. Binaires dans
`node_modules/.bin/`. Vérification rapide :

```bash
cd products/sektor-btp/web && ../../../node_modules/.bin/ng build --configuration development
```

**`TYPE_ARTICLE` est un rôle, pas un niveau.** Un vrai bordereau a quatre niveaux et une
profondeur variable. Un nœud qui regroupe est LOT ou SOUS_LOT quelle que soit sa profondeur.
`GateBordereauStructureReelleTest` le verrouille.

**Ne pas modifier `DpuCalculator.computePrixVenteHt()`.** Formule validée par l'expert :
marge sur le prix de revient. `déboursé × (1+FG) × (1+marge)`.

**Recenser avant de créer.** Ce dépôt a produit trois faux départs : `consultation` réécrivant
`etudes`, une version du lot 5 recréant `AppelOffreAchat`, un parseur XLSX supplanté par
`smart-import`. Chercher dans `item`, `achats`, `stock`, `partner`, `currency`, `marches`,
`chantiers`, et côté front dans `platform/features/documents/smart-import`.

**Multi-tenant.** Une pratique observée chez un tenant s'ajoute comme capacité **optionnelle**
(champ nullable, défaut neutre). Ses **valeurs** restent dans les tests.

---

## Questions ouvertes

Toutes les bloquantes sont tranchées. Restent :

| # | Question | Impact |
|---|---|---|
| Q4 | FG dans le budget chantier | 🔵 défaut REX posé : déboursé sec seul |
| Q14 | Base de variation de la marge | 🔵 contournée : trois colonnes couvrent tous les motifs |
| Q15 | Marge globale | 🔵 défaut REX : constatée, pas saisie |
| Q8/Q9 | Aléas, coefficient K, FG chantier vs siège | 🟢 hors périmètre |

🔵 = raisonné depuis la pratique, **pas validé par l'expert**. Chaque question dit ce qui le ferait
basculer.

---

## À vérifier de ton côté

- **Le front n'a pas été redéployé** après le déplacement de phase 3. `Dockerfile.web` et
  `nlops.sh` sont à jour, mais `release-app` n'a pas été relancé.
- Le contexte kubectl courant a été basculé sur `docker-desktop`. Un garde-fou dans `nlops.sh`
  refuse désormais tout croisement ENV ↔ contexte.

---

## Documents à lire dans l'ordre

1. [`00-INDEX.md`](00-INDEX.md) — vue d'ensemble, glossaire, règles pour l'agent
2. [`00-ARCHITECTURE.md`](00-ARCHITECTURE.md) — invariant de prix, décisions D1 à D17
3. [`00-PROGRESS.md`](00-PROGRESS.md) — journal détaillé
4. [`11-SOURCES-METIER.md`](11-SOURCES-METIER.md) — ce qu'on a retenu des sources réelles
5. Le fichier du lot visé
