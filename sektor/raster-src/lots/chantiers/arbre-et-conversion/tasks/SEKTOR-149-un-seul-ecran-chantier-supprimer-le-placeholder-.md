---
id: SEKTOR-149
status: done-me
context: nafura
type: tech
agent_type: exec
priority: P2
assignee: agent
gate: none
---

# Un seul écran chantier — supprimer le placeholder detail/

> web app/chantiers/detail/ (placeholder) meurt ; chantier-detail/ reste, à onglets.

## Étapes

- [x] Supprimer `web/app/chantiers/detail/` — vérifié sans route ni import (AC-15)
- [x] Retirer la clé i18n devenue orpheline `chantiers.planning.placeholder` (fr / en / ar) (AC-15)
- [x] Colonne **Nature** dans l'arbre de la fiche chantier — badge vendu / interne (AC-16)
- [x] Accès au poste du devis d'origine depuis une ligne vendue (AC-16, AC-2)
- [x] Endpoint `GET /api/v1/etudes/dpgf/noeuds/{id}/origine` pour résoudre le lien retour

## Journal

```
23/08 18:21  posée
23/08 23:35  status → doing
23/08 23:40  placeholder supprime (aucune reference), cle i18n orpheline retiree des 3 langues.
23/08 23:55  AC-16 : colonne Nature + badge, action « voir le poste d'origine ».
             Endpoint origineDuPoste ajoute cote etudes (DpgfService + DpgfController).
24/08 00:05  compile chantiers+etudes EXIT 0 ; tsc chantiers+etudes 0 erreur ; rapport rempli.
23/08 20:39  status → done-agent · gate none → done-me
```

## Rapport de livraison

**Ce qui a changé.** `web/app/chantiers/detail/` est supprimé — le dossier ne contenait que
`chantier-detail-placeholder.page.ts`, sans route ni import (vérifié par recherche sur le chemin,
sur le sélecteur et sur le nom de classe : zéro occurrence hors documentation). La clé i18n
`chantiers.planning.placeholder.backToPlanning`, qui n'était plus utilisée que par lui, est
retirée des trois fichiers de langue. Côté AC-16 : l'arbre de la fiche chantier
(`chantier-lots-tab`) gagne une colonne **Nature** rendue en badge — « Vendu » en succès,
« Interne » en neutre —, et une ligne vendue porte une action qui ouvre l'étude d'origine. Pour la
résoudre, `etudes` expose `GET /api/v1/etudes/dpgf/noeuds/{noeudId}/origine`
(`DpgfService.origineDuPoste`) : depuis le seul identifiant de nœud que la ligne conserve, il rend
le poste (code, libellé, type), son bordereau et l'étude qui le contient.

**Critères prouvés.**
`AC-15` → le dossier n'existe plus ; `grep -rn "chantiers/detail\|ChantierDetailPlaceholder"` sur
`app/` et `public/` ne rend plus rien ; `chantiers.routes.ts` L88 route toujours vers
`./chantier-detail/chantier-detail.page`, inchangée, donc la fiche reste atteignable depuis la
liste ; les trois `*.json` de traduction n'ont plus de bloc `placeholder` et restent à parité
(même clé retirée dans les trois). `tsc` sur `app/chantiers` + `app/etudes` → 0 erreur : rien ne
pointait vers le fichier supprimé.
`AC-16` → colonne `nature` dans `treeColumns`, cellule `@case ('nature')` rendant
`natureLabelKey()` (clés `natureVendu` / `natureInterne`, libellés **Vendu** / **Interne** — pas
de jargon ERP) ; `rowDpgfNoeudId()` n'expose l'action que quand le lien retour existe, donc sur
les seules lignes vendues ; `ouvrirOrigine()` appelle `origineDuPoste` puis navigue vers
`/etudes/dossiers/{dossierId}` avec le poste en paramètre de requête.
Preuve d'ensemble : `nb-compile.sh chantiers etudes` → EXIT 0 ; `nb-test.sh chantiers` → 31/31 ;
`tsc` (chantiers + etudes + le handler d'import) → 0 erreur.

**Décidé seul.**
1. **AC-16 exigeait un aller-retour que la donnée ne permettait pas.** Le chantier ne garde aucun
lien vers son étude : ni `dossierEtudeId`, ni `dpgfId`. La ligne vendue ne connaît que
`dpgfNoeudId`. J'ai donc ajouté un point de lecture côté `etudes` qui résout nœud → bordereau →
dossier, plutôt que d'ajouter un champ dénormalisé sur `Chantier`. Raison : le lien retour d'AC-2
est déjà la source de vérité, la dénormaliser en créerait une seconde à maintenir.
2. **La navigation cible l'étude, pas le poste.** Aucune route n'adresse un nœud DPGF aujourd'hui.
Le poste part en paramètre de requête (`?poste=<uuid>`) pour que l'écran d'étude puisse le
surligner le jour où il saura le faire. C'est un accès *au devis d'origine* avec le poste désigné,
pas encore un défilement jusqu'à la ligne.
3. **Un appel front de `chantiers` vers l'API `etudes`.** Précédent existant et assumé dans ce
dépôt : `chantier-create.page.ts` importe déjà `DevisApiService` depuis `@app/etudes`. Je n'ai
donc pas ouvert de nouveau type de couplage.
4. **La clé i18n orpheline est retirée, pas laissée en place.** AC-15 dit « aucune traduction ne
pointe plus vers le placeholder » ; garder une clé morte aurait été le contraire.
5. **Badge `success` pour vendu.** Vendu = ce que le client paie ; interne = neutre. Aucun `AC-n`
n'impose de couleur ; le choix est lisible et réversible.

**Écarts / dette.**
- **Le surlignage du poste dans l'étude n'existe pas** : `?poste=<uuid>` est ignoré par
  `dossier-detail.page.ts`. L'accès aboutit à la bonne étude, pas à la bonne ligne.
- **`origineDuPoste` n'a pas de test JUnit** : c'est une lecture de trois lignes sans branche
  métier (nœud → bordereau → dossier), et les tests de `DpgfService` sont absents du module. La
  preuve est la compilation et le parcours QA.
- **Le nouvel écran n'a pas été ouvert dans un navigateur** : pas de serveur de dev lancé ici
  (préférence connue : tester sur staging). La colonne et l'action sont prouvées par typage et
  par lecture, pas par capture.
- **Pas de test de rendu Angular** pour la colonne Nature : le module n'a pas de spec pour
  `chantier-lots-tab`.
