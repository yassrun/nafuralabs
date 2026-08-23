---
id: SEKTOR-146
status: done-me
context: nafura
type: spec
agent_type: spec
priority: P1
assignee: agent
gate: me
---

# CONTRAT — arbre vendu / interne et conversion depuis GAGNE

> Geler les AC du sous-lot depuis DECISIONS-PRODUIT-CHANTIER.md : noeud vendu (lien retour poste devis) vs interne, conversion GAGNE -> chantier EN_PREPARATION sans marche, un seul ecran chantier.

## Étapes

- [x] Relire les gels de `DECISIONS-PRODUIT-CHANTIER.md` (§ Simplicité, § arbre, § déclencheur, § marché, § doublons web)
- [x] Vérifier chaque constat dans le code avant de l'écrire en AC
- [x] Écrire `CONTRAT.md` — AC-1 → AC-16, hors périmètre, scénarios e2e + état initial
- [x] Poser la question de gate

## Journal

```
23/08 18:21  posée
23/08 18:33  status → doing
23/08 19:05  CONTRAT.md écrit — 16 AC. Constats revérifiés dans le code.
23/08 18:38  status → done-agent
23/08 18:44  toi · approuvée → done-me
```

## Rapport de livraison

**ce qui a changé** — Un seul fichier créé : `sektor/raster-src/lots/chantiers/arbre-et-conversion/CONTRAT.md`. Aucun fichier sous `sources/` touché. Pas de canvas UX : le sous-lot ne crée aucun écran (AC-15 en supprime un).

**critères prouvés** — AC-1 → AC-16 gelés, chacun adossé à un gel du 23/08 et vérifié contre le code :

| Vérifié | Constat |
|---------|---------|
| `ChainageAvalAdapter` | `setStatus("EN_COURS")` (→ AC-8) · crée `ContratMarche` dans la même transaction (→ AC-10) · fallback « premier lot trouvé, sinon `LOT-1` / Lot principal forgé » (→ AC-12) |
| `ChantierLot`, `PosteBudgetaire` | aucun champ nature ni origine (→ AC-1, AC-2) |
| `ChantierLotTreeNodeDto`, `ChantierLotTreePosteDto` | ne rendent ni nature ni origine (→ AC-1, AC-16) |
| `ChainageAvalPort.LotProjection` | porte `code` / `parentCode`, **pas** l'id du nœud DPGF — le lien retour d'AC-2 exige d'élargir ce record ; `projeterLots` a l'id sous la main |
| `DossierEtudeService.convertir` | garde `GAGNE` déjà en place (AC-7 est un maintien) · garde de double conversion déjà en place via `chantierGenereId`, retour idempotent (AC-9 est un maintien) |
| `StatutDossierEtude` | `GAGNE → CONVERTIE`, `CONVERTIE` terminal — conforme, rien à changer |
| `Chantier` | `STATUS_EN_PREPARATION` existe · `demarrer()` accepte déjà `EN_PREPARATION → EN_COURS` — AC-8 ne demande aucun nouvel état |
| `web/app/chantiers/detail/chantier-detail-placeholder.page.ts` | **aucune** référence dans le code : ni route, ni import. `chantiers.routes.ts` L88 route vers `chantier-detail.page`. La suppression d'AC-15 est un retrait de fichier mort, pas une bascule de route |

**décidé seul** —
1. **AC-3 refuse au lieu de dégrader.** Le gel dit « un vendu naît de la copie, pas de la saisie » sans dire ce que fait une demande explicite de vendu à la main. J'ai choisi le refus explicite plutôt qu'une conversion silencieuse en interne : un silence ici recrée un rafistolage du même genre que celui qu'AC-12 supprime.
2. **AC-12 fait échouer la conversion en entier**, étude laissée `GAGNE` et rejouable. Le gel dit « refus explicite » sans trancher la granularité. Tout-ou-rien : la transaction est déjà atomique, et un arbre à moitié copié serait pire que pas d'arbre.
3. **AC-5 formulé au niveau du balayage** (les lignes proposées à un attachement / une situation), pas de la refonte de la situation — celle-ci appartient à un autre sous-lot. Ce contrat garantit l'exclusion, pas le reste de la chaîne.
4. **AC-11 « copie fidèle »** ajouté alors qu'il n'est pas un gel en propre : sans lui, AC-12 (refus d'un arbre bancal) n'a aucun critère positif en face, et rien ne dit ce qu'une copie réussie doit produire.
5. **Aucun canvas UX.** AC-15 supprime un écran mort et AC-16 ajoute deux marqueurs de lecture sur un arbre existant — pas de quoi ouvrir un canvas.
6. **Vocabulaire.** « ligne de l'arbre » plutôt que « nœud » dans les AC destinés à l'écran, « vendu » / « interne » affichés tels quels. Ni WBS, ni quotité, ni valeur acquise.

**écarts / dette** —
- **`LotProjection` doit s'élargir** à l'id du nœud DPGF pour qu'AC-2 soit tenable : c'est une modification du port `etudes → chantiers`, pas seulement de `chantiers/`. À porter par SEKTOR-147.
- **AC-4 (un interne n'a pas de prix de vente)** : les colonnes `prix_unitaire_ht` / `montant_ht` existent déjà sur `ChantierLot` et `PosteBudgetaire`. AC-4 est une règle de service, pas un changement de schéma — assumé.
- **Les seeders** (`ChantierLotSeedService`, `PosteBudgetaireSeedService`, `ChantierSeedService`, qui pose `EN_COURS` par défaut) produisent des lignes sans nature. Ils devront poser une nature — vraisemblablement `INTERNE` — sinon AC-1 tombe dès le seed. Non tranché ici : c'est de l'exec.
- **Budget par rubrique au chantier** non touché : le lien budget ↔ arbre du § budget reste entier pour un autre sous-lot. AC-11 ne couvre que l'arbre.
- **Aucun AC de performance** sur la copie d'un DPGF volumineux. Pas de volumétrie connue en lab.

## Question

Le contrat est-il gelé tel quel, ou faut-il amender un des trois arbitrages que j'ai pris seul (AC-3 refus explicite · AC-12 échec total et rejouable · AC-11 ajouté hors gel) ?

- **A** — Geler tel quel. SEKTOR-147 → 150 partent sur ces 16 AC, la vague avance sans autre attente.
- **B** — Amender AC-12 en tolérance : les postes orphelins sont copiés sous un lot « à rattacher », visible et bloquant pour la facturation, plutôt qu'un échec. Conséquence : la conversion aboutit toujours, mais un arbre incomplet peut vivre — et le rafistolage revient, déplacé.
- **C** — Amender AC-3 : une demande de vendu à la main devient un interne, silencieusement. Conséquence : plus aucun appel ne casse, mais un utilisateur peut croire avoir créé du facturable qui ne le sera jamais.

Recommandé : **A** — B et C rendent tous deux à l'arbre le droit d'être faux sans le dire, ce que le gel « un vendu naît de la copie » cherchait justement à fermer.
