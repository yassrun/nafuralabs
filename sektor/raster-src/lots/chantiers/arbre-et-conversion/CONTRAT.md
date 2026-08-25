# Contrat — Arbre du chantier : vendu / interne, et conversion depuis GAGNE

> Ce sous-lot est autonome. Ce fichier est le **seul ancrage QA** (`AC-n` gelés).
> Journal produit : [`DECISIONS-PRODUIT-CHANTIER.md`](../../../DECISIONS-PRODUIT-CHANTIER.md) — § Simplicité, § L'arbre du chantier, § Le déclencheur, § Le marché naît à la notification, § Les cinq derniers points / doublons web.
> Plan du sous-lot : [`00-PLAN.md`](00-PLAN.md).
> Les preuves attendues vivent ici. Pas de canvas : aucun écran neuf.

**Qualification : EVOL.** La conversion existe (`ChainageAvalAdapter`, L13) et crée déjà chantier → marché → lots / postes → budget. Ce qui n'existe pas : la **nature** du nœud, le **lien retour** vers le poste vendu, la naissance en **préparation**, et le refus d'un arbre bancal.

Gelé le **23/08/2026**. Les tasks exec **référencent** `AC-n` ; elles ne les recopient pas.

> **Amendé une seconde fois (24/08/2026, après QA)** — AC-12 ne nommait que les *postes* orphelins. La QA a montré qu'un **sous-lot** orphelin est remonté à la racine en silence par `ChainageAvalAdapter`. L'AC couvre désormais tout nœud. Porté par SEKTOR-173.
>
> **Amendé à l'approbation (23/08/2026)** — deux corrections portées par l'approbateur, pas par l'auteur du contrat :
> **AC-9** disait « renvoie le chantier déjà créé, **ou** est refusée » : un critère à deux issues n'est pas testable. Une seule retenue.
> **AC-12** exigeait un refus sec « rejouable après correction du devis ». Impossible : `GAGNE` ne transitionne que vers `CONVERTIE`, le devis n'est plus modifiable — l'utilisateur se serait retrouvé sans issue. Remplacé par un placement explicite des postes orphelins par l'humain, au moment de la conversion.

---

## Intention

Le chantier a **son** arbre. Il est **initialisé** par le devis validé, puis il vit sa vie — on ajoute, on subdivise, on réordonne, sans rien casser côté étude.

Deux natures de nœud, et une seule question pour les distinguer : **est-ce que le client paie ça ?**

| Nature | D'où il vient | Situation de travaux | Coût |
|--------|---------------|----------------------|------|
| **Vendu** | copié du devis validé, garde le lien vers le poste d'origine | oui | oui |
| **Interne** | ajouté au chantier — installation, repli, régie, base vie, aléas | **jamais** | oui |

Et un chemin d'entrée unique : l'étude **gagnée** arme la création, un humain la fait. Le chantier naît **en préparation** ; c'est l'**ordre de service** qui le démarre. Le **marché** ne naît pas ici — il naît à la **notification**.

**Palier 1, et rien de plus.** Le chantier issu de cette conversion doit être avançable, attachable et facturable **sans qu'aucune activité de planning n'existe**. Aucun `AC-n` de ce contrat n'exige un planning, une zone, une activité ou une quotité.

---

## Critères gelés

### L'arbre — nature et origine

**AC-1 — Toute ligne de l'arbre porte une nature.** Chaque lot, sous-lot et poste du chantier porte une nature obligatoire, `VENDU` ou `INTERNE`. Aucune ligne sans nature ne peut exister en base ni être lue par une API : la nature est affichée dans l'arbre du chantier et rendue par les endpoints de lecture de l'arbre.

**AC-2 — Un vendu garde son origine.** Une ligne `VENDU` porte l'identifiant du nœud du devis (DPGF) dont elle a été copiée. Depuis n'importe quelle ligne vendue du chantier, on remonte au poste vendu correspondant de l'étude. Ce lien est posé à la copie et n'est jamais réécrit ensuite.

**AC-3 — Un vendu naît de la copie, jamais de la saisie.** La copie depuis le devis validé est le **seul** producteur de lignes `VENDU`. Toute création de lot ou de poste par saisie — écran chantier, API de création, import manuel — produit une ligne `INTERNE`, quoi que demande l'appelant. Une demande de créer un vendu à la main est **refusée** avec un message explicite ; elle n'est pas silencieusement convertie en interne.

**AC-4 — Un interne n'a pas de prix de vente.** Une ligne `INTERNE` ne porte pas de prix unitaire de vente ni de montant vendu. Elle porte de la quantité et du coût. Un montant vendu posé sur une ligne interne est refusé.

**AC-5 — Un interne n'entre jamais dans une situation.** Aucune ligne `INTERNE` n'apparaît dans les lignes proposées à un attachement ou à une situation de travaux, ni dans le cumul valorisé au client. Le balayage des travaux à facturer ne retient que les lignes `VENDU`.

**AC-6 — L'arbre reste libre après la copie.** Une fois copié, l'arbre du chantier s'édite : ajout d'une ligne interne, subdivision, renommage, réordonnancement, suppression d'une ligne interne. Aucune de ces éditions ne modifie l'étude ni le devis d'origine, et aucune ne casse le lien retour des lignes vendues restantes.

### La conversion depuis l'étude

**AC-7 — Seule une étude gagnée se convertit.** La conversion n'est offerte et n'aboutit que si l'étude est au statut `GAGNE`. Depuis tout autre statut, elle est refusée avec un message métier — pas une erreur technique.

**AC-8 — Le chantier naît en préparation.** Le chantier créé par la conversion est en **`EN_PREPARATION`**. Il n'est jamais créé `EN_COURS`. Le passage `EN_PREPARATION → EN_COURS` reste le fait de l'**ordre de service**, hors de ce geste.

**AC-9 — Une étude ne se convertit qu'une fois.** Après conversion, l'étude est `CONVERTIE` — état terminal. Rejouer la conversion sur la même étude ne crée **aucun** second chantier : elle **renvoie le chantier déjà créé** — un seul comportement, pas une alternative. Deux appels concurrents ne produisent pas deux chantiers.

**AC-10 — Aucun marché n'est créé à la conversion.** La conversion crée le chantier et son arbre, et **rien d'autre du côté contractuel** : aucun `ContratMarche` n'existe après conversion. Un chantier de régie ou sur bon de commande reste sans marché indéfiniment, sans que rien ne se dégrade. La référence de vente, tant qu'aucun marché n'est notifié, est le **devis validé**.

**AC-11 — La copie couvre tout le devis.** Chaque lot, sous-lot et poste du devis validé donne exactement **une** ligne dans l'arbre du chantier : même hiérarchie, même code, même désignation, même unité, même quantité, même prix unitaire, même ordre. Aucun nœud perdu, aucun nœud dupliqué.

**AC-12 — Un arbre bancal se répare devant l'humain, jamais en silence.** Le rattrapage actuel — un poste sans parent tombe sur le premier lot trouvé, sinon un « Lot principal » est forgé — **disparaît**.

Si un ou plusieurs postes du devis n'ont pas de lot parent identifiable, la conversion **s'arrête avant de rien créer** et les **nomme** à l'écran. L'humain les **place** : il choisit un lot existant, ou crée le lot d'accueil. La conversion reprend alors et aboutit. S'il refuse, rien n'est créé — ni chantier, ni arbre, ni budget — et l'étude reste `GAGNE`.

**Le cas vaut pour tout nœud, pas seulement les postes.** Un **sous-lot** dont le lot parent n'est pas identifiable relève du même traitement : nommé, placé par l'humain, jamais remonté à la racine en silence. Une hiérarchie qui change sans que personne ne le voie est précisément ce que cet AC interdit.

**Pourquoi pas un simple refus :** une étude `GAGNE` ne transitionne que vers `CONVERTIE` (`StatutDossierEtude`) — elle **ne peut plus être corrigée**. Un refus sec enfermerait l'utilisateur : conversion impossible, devis non modifiable, aucune sortie. Le placement à la conversion est la seule issue qui ne demande ni nouvelle version de devis ni déblocage de statut.

Ce que le placement **n'est pas** : une devinette. L'humain décide, nommément, poste par poste ; rien n'est rattaché par défaut.

**AC-13 — Ce que l'humain complète.** L'écran de conversion demande code chantier, date de démarrage et durée. Aucun de ces champs ne suppose un planning. Le zonage est **facultatif** : la conversion aboutit sans qu'aucune zone soit saisie.

### La porte de service

**AC-14 — Un chantier peut naître sans étude.** La création directe d'un chantier — gré à gré, régie, petits travaux — reste possible. Son arbre est saisi à la main et **toutes** ses lignes sont `INTERNE` (conséquence directe d'AC-3). Aucun lien retour, aucune situation de travaux tant qu'aucun devis ne vend ces lignes. Ce chantier est utilisable : arbre, coût, journal, documents.

### L'écran

**AC-15 — Un seul écran chantier.** `web/app/chantiers/detail/` (le placeholder) est supprimé. `web/app/chantiers/chantier-detail/` reste l'unique fiche chantier. Aucune route, aucun import, aucune traduction ne pointe plus vers le placeholder, et la fiche chantier reste atteignable et fonctionnelle depuis la liste des chantiers.

**AC-16 — La nature se lit dans l'arbre.** Dans la fiche chantier, une ligne vendue se distingue d'une ligne interne d'un coup d'œil, et une ligne vendue offre l'accès au poste du devis d'origine (AC-2). Vocabulaire affiché : **vendu** / **interne** — pas de jargon ERP.

---

## Hors périmètre (dette nommée, pas AC)

- **Budget décomposé par rubriques sur le nœud** (copie du DPU : matière / main d'œuvre / matériel / sous-traitance). Le budget actuel reste par rubrique au chantier. Autre sous-lot.
- **Situation et attachement** : leur refonte (lecture des attachements, pénalités, RAS). Ici on garantit seulement qu'un interne n'y entre pas (AC-5).
- **Planning, activités, quotités, zones** : palier 2. Rien dans ce contrat ne les prépare ni ne les attend.
- **Avenants** : ils créeront ou modifieront des lignes vendues sans passer par la copie. C'est la seule autre porte future vers `VENDU` (AC-3 la nomme comme copie ; l'avenant l'élargira). Pas dans ce sous-lot.
- **Marché à la notification** : ce contrat le fait **sortir** de la conversion (AC-10) ; il ne définit pas le geste de notification.
- **Ordre de service** : ce contrat pose la naissance en préparation (AC-8) ; le geste de démarrage existe déjà et n'est pas retouché.
- **Migration de données** : lab métier, schéma clean + re-seed. Aucune migration douce des chantiers existants.

---

## Scénarios e2e (noms) + état initial

L'exec implémente ; le QA joue. Ne pas choisir des valeurs qui passent toutes seules.

| Scénario | Couvre |
|----------|--------|
| `chantier-conversion-gagne-en-preparation` | AC-7, AC-8, AC-13 |
| `chantier-conversion-sans-marche` | AC-10 |
| `chantier-conversion-copie-fidele` | AC-11, AC-1, AC-2 |
| `chantier-conversion-double-refusee` | AC-9 |
| `chantier-conversion-poste-orphelin-place-par-l-humain` | AC-12 |
| `chantier-conversion-poste-orphelin-abandon` | AC-12 |
| `chantier-arbre-saisie-donne-interne` | AC-3, AC-4 |
| `chantier-arbre-interne-hors-situation` | AC-5 |
| `chantier-arbre-edition-libre` | AC-6 |
| `chantier-sans-etude-tout-interne` | AC-14 |
| `chantier-un-seul-ecran-detail` | AC-15, AC-16 |

**État initial requis :**

- Tenant `qa-local`.
- **Une étude `GAGNE`** avec un devis validé dont le DPGF a **au moins 2 lots**, **1 sous-lot** sous l'un d'eux, et **≥ 6 postes** répartis — dont au moins un poste sous le sous-lot, pour que la profondeur soit réellement vérifiée. Unités et prix unitaires **distincts** entre postes.
- **Une étude `GAGNE`** dont le DPGF contient **un poste sans lot parent** — l'étude piège d'AC-12. Jouée deux fois : une fois l'humain place le poste et la conversion aboutit, une fois il abandonne et l'étude reste `GAGNE`.
- **Une étude déjà `CONVERTIE`**, ou la première rejouée, pour AC-9.
- **Une étude non gagnée** (`DEVIS_GENERE`) pour AC-7.
- **Un chantier créé sans étude**, arbre saisi à la main, pour AC-14.
- Aucun jeu de données de planning : **aucune activité, aucune zone**. Tous les scénarios doivent passer sans.
