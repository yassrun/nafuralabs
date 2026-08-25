# Contrat — L'avancement en quantité, l'attachement qui lit

> Ce sous-lot est autonome. Ce fichier est le **seul ancrage QA** (`AC-n` gelés).
> Journal produit : [`DECISIONS-PRODUIT-CHANTIER.md`](../../../DECISIONS-PRODUIT-CHANTIER.md) — § Simplicité, § L'avancement se saisit en quantité, § Le réel s'impute à l'activité (**son amendement palier 1 / palier 2**), § Les cinq derniers points / situation et attachement.
> Plan du sous-lot : [`00-PLAN.md`](00-PLAN.md).
> Contrats voisins, à ne pas contredire : [`../arbre-et-conversion/CONTRAT.md`](../arbre-et-conversion/CONTRAT.md) — nature `VENDU` / `INTERNE`, et **AC-5 : un interne n'entre jamais dans une situation** · [`../budget-et-marge/CONTRAT.md`](../budget-et-marge/CONTRAT.md) — son **AC-13** (valeur acquise) consomme l'avancement du nœud **en quantité** que ce contrat pose.
> Les preuves attendues vivent ici. Pas de canvas : les deux écrans existent déjà.

**Qualification : EVOL.** L'avancement existe (`AvancementPhysique`, saisi sur `lotId` / `posteId` — déjà le palier 1) et l'attachement aussi, signature MOE par lien public comprise (`SignaturePublicController`). Ce qui n'existe pas : **une seule vérité**. Le pourcentage est stocké à trois endroits, le dépassement est écrasé en silence, et l'attachement rouvre une saisie de quantités à côté de celle du terrain.

Gelé le **23/08/2026**. Les tasks exec **référencent** `AC-n` ; elles ne les recopient pas.

---

> **Amendé à l'approbation (24/08/2026)** — la `## Question` de la task portait sur le lien public de signature : le garder tel quel en dette nommée (A), ou en faire un critère (B). Tranché **B**, contre la recommandation de l'auteur : **AC-19** ajouté. Un critère non écrit n'est jamais vérifié, et celui-ci garde la porte du seul document que le contrat rend opposable.

## Intention

Le chef de chantier déclare **une quantité faite sur un nœud, à une date**. C'est le seul fait. Tout le reste se calcule.

| | Aujourd'hui | Après |
|--|-------------|-------|
| Le fait saisi | quantité **et** pourcentage — aucun ne prime | la **quantité**, seule |
| Le pourcentage | **stocké** sur la ligne d'avancement, sur le lot, sur le chantier | **dérivé** : `fait / prévu`, à la lecture |
| Le dépassement | ramené à 100 % en silence (`.min(100)`) | **refusé** — la sortie est l'avenant |
| L'attachement | une grille où l'on retape code, désignation, quantité, zone | il **lit** les quantités déclarées sur la période |

Un attachement n'est pas une deuxième déclaration : c'est la **mise au net contradictoire** de ce que le chantier a déjà déclaré. Le MOE le signe, et c'est lui qui fait foi.

**Palier 1, et rien de plus.** Tout ce contrat doit marcher sur un chantier qui n'a **aucune activité, aucune zone, aucune quotité** — ni pour saisir, ni pour calculer, ni pour attacher. La règle du palier 2 (« un nœud couvert par une activité ne se saisit plus en direct ») est **posée** ici, et reste sans effet tant qu'aucune activité n'existe.

---

## Critères gelés

### La quantité est le seul fait saisi

**AC-1 — Une déclaration = un nœud, une quantité, une date.** Une saisie d'avancement porte exactement trois choses obligatoires : le **nœud** de l'arbre du chantier, la **quantité faite** dans son unité, et la **date**. Le nœud est une **feuille** — un poste, ou un lot qui n'a ni poste ni sous-lot. Un lot qui porte des enfants ne se déclare pas en direct : son avancement se calcule (AC-4). C'est la même règle qu'AC-9, un étage plus haut : jamais deux portes sur le même nœud. S'y ajoutent, facultatifs, une note et des photos. Aucun autre champ n'est requis : ni activité, ni zone, ni quotité, ni pourcentage. Un appel qui fournit un pourcentage est **refusé** — il n'est pas silencieusement ignoré.

**AC-2 — Aucun pourcentage n'est stocké, nulle part.** Le pourcentage d'avancement disparaît des données écrites, aux **trois** endroits où il vit aujourd'hui : la colonne `pourcentage` de `avancements_physiques`, `avancement_percent` sur le lot du chantier, `avancement_percent` sur le chantier. Aucune écriture, aucun seed, aucune API ne les alimente plus, et aucun code ne les lit. La propagation de l'avancement vers le lot et le chantier (`ChantierProgressSyncService`) cesse d'exister comme **écriture** : ce qu'elle calculait se calcule désormais **à la lecture**.

**AC-3 — Le pourcentage d'un nœud se calcule : `fait / prévu`.** Pour tout nœud, l'avancement lu vaut le **cumul des quantités déclarées** sur ce nœud divisé par sa **quantité prévue**. Il est recalculé à chaque lecture : corriger une déclaration change immédiatement le pourcentage, sans aucune autre écriture. Deux lectures du même nœud au même instant donnent le même nombre — il n'y a plus de second endroit où il puisse diverger.

**AC-4 — Un lot ne s'additionne pas, il se pondère.** Les postes d'un lot n'ont pas la même unité : leurs quantités ne s'additionnent pas. L'avancement d'un **lot** ou d'un **sous-lot** est la moyenne des avancements de ses enfants **pondérée par leur montant vendu**, et l'avancement du **chantier** la même moyenne sur ses lots racines. Un nœud `INTERNE` n'a pas de montant vendu (contrat voisin, AC-4) : il ne pèse pas. Un lot dont aucun enfant n'est vendu n'affiche **pas** un avancement de 0 % — il n'en affiche **aucun**, et le dit. Un lot sans enfant est une feuille : il porte ses propres déclarations (AC-1) et son avancement se lit comme celui d'un poste (AC-3).

**AC-5 — Dépasser la quantité prévue est refusé ; la sortie est l'avenant.** Une déclaration qui porterait le cumul d'un nœud **au-delà** de sa quantité prévue est **refusée**, avec un message métier qui nomme le **reste à faire** du nœud. Le rabotage actuel à 100 % (`min(100)`) disparaît : rien n'est accepté puis écrêté. Le message dit où est la sortie — **l'avenant** ou les **travaux supplémentaires**, hors de ce geste. Atteindre exactement la quantité prévue reste normal (100 %).

**AC-6 — Pas de quantité prévue, pas de déclaration.** Un nœud sans quantité prévue (ou à zéro) n'accepte aucune déclaration d'avancement : elle est **refusée** avec un message qui demande de renseigner la quantité prévue du nœud. C'est ce qui rend AC-3 et AC-5 toujours calculables — jamais de division par zéro déguisée en 0 %.

**AC-7 — Une déclaration se corrige, tant qu'elle n'est pas attachée et signée.** Une déclaration peut être modifiée (quantité, date, note) ou **annulée** tant qu'aucun **attachement signé** ne la reprend (AC-15). Une correction à la baisse est possible ; le cumul du nœud ne devient jamais négatif. Dès qu'un attachement signé la reprend, elle est **figée** : la correction se fait sur la période suivante, jamais en réécrivant le passé.

### Palier 1 : on saisit sur le nœud

**AC-8 — La saisie porte sur le nœud, sans planning.** Sur un chantier ne portant aucune activité — c'est-à-dire tous les chantiers aujourd'hui — l'avancement se déclare **directement sur le nœud** de l'arbre, et la chaîne complète (déclaration → attachement) est vérifiable de bout en bout. Aucun écran, aucun endpoint de ce contrat ne demande, ne propose ni n'affiche une activité, une zone obligatoire ou une quotité, et aucun ne laisse un champ vide en attendant qu'elles existent.

**AC-9 — Jamais deux portes sur le même nœud.** Un nœud **couvert par au moins une activité** ne se déclare plus en direct : sa quantité faite remonte alors des activités qui le couvrent, et une déclaration directe sur ce nœud est **refusée** avec un message qui nomme les activités en cause. Tant qu'aucune activité ne le couvre — l'état d'aujourd'hui, sur tous les nœuds — il se déclare au nœud. La règle est **écrite dans le garde-fou de la déclaration**, pas seulement dans ce contrat. Aucune activité n'existant au palier 1, aucun scénario e2e ne l'exerce : la preuve est **unitaire**. Le mécanisme de remontée depuis l'activité appartient au palier 2 et n'est pas livré ici.

### L'attachement lit la période, il ne la ressaisit pas

**AC-10 — Un attachement couvre une période, pas un jour.** L'attachement porte une **date de début** et une **date de fin** (la période attachée), et non plus une date unique. Son numéro reste unique par chantier. Deux attachements d'un même chantier ne **chevauchent** pas : une période qui empiète sur celle d'un attachement existant non annulé est refusée.

**AC-11 — Les lignes sont lues, jamais tapées.** À l'ouverture d'un attachement, ses lignes sont **montées** depuis les déclarations d'avancement de la période : un nœud déclaré = une ligne, portant la **quantité de la période** (somme des déclarations du nœud entre les deux dates), son **unité** et son **prix unitaire vendu**, tous pris sur le nœud. Aucun champ de saisie de code, de désignation, d'unité ou de quantité n'est offert. La grille libre actuelle (`attachement-saisie`, où l'on tape `posteCode`, `designation`, `quantiteExecutee`, `unite`) **disparaît**. Une période sans aucune quantité déclarée ne produit **pas** un attachement vide : la création est refusée, en le disant.

**AC-12 — Chaque ligne pointe un nœud de l'arbre.** Une ligne d'attachement porte l'**identifiant du nœud** du chantier dont elle vient. Le `posteCode` en chaîne libre cesse d'être ce qui identifie la ligne : code, désignation et unité sont **lus** sur le nœud, jamais recopiés à la main. Sans ce lien, rien ne permet de filtrer les lignes par nature — c'est lui qui rend AC-13 exécutable.

**AC-13 — Seuls les nœuds vendus entrent dans un attachement.** Le montage des lignes ne retient que les nœuds `VENDU`. Un nœud `INTERNE` — installation, repli, base vie, régie, aléas — n'apparaît **jamais** dans un attachement, même s'il porte des quantités déclarées : son avancement se lit sur son nœud (AC-3), il ne se facture pas. Conséquence directe d'AC-5 du contrat voisin, qui n'avait jusqu'ici rien à filtrer.

**AC-14 — La zone vient du référentiel du chantier.** Le chantier porte **un** référentiel de zones, arborescent (bâtiment › niveau › zone), tenu au chantier et **vide par défaut**. La zone d'une ligne d'attachement est **facultative** et se **choisit** dans ce référentiel : le texte libre disparaît (`AttachementLigne.zone`, et le champ « Zone » de l'écran de saisie). Un chantier sans aucune zone déclarée produit ses attachements normalement, sans zone — aucun écran ne réclame d'en créer une.

**AC-15 — L'attachement signé fait foi, et fige ce qu'il porte.** La signature du MOE se recueille par le **lien public existant** (`/api/v1/sign/{token}`, `SignaturePublicController`). Une fois l'attachement `SIGNE_MOE` : ses lignes, ses quantités et sa période ne changent plus, et les déclarations d'avancement qu'il reprend sont figées (AC-7). C'est cet attachement signé — pas la situation — qui est la **référence** des quantités de la période.

**AC-16 — Une quantité n'est attachée qu'une fois.** Une quantité déclarée déjà reprise par un attachement signé n'est **jamais** reproposée dans un attachement suivant. Sur un chantier, la somme des quantités attachées d'un nœud, tous attachements signés confondus, est **égale** au cumul déclaré sur ce nœud pour les périodes couvertes — ni un doublon, ni un oubli.

**AC-17 — Le désaccord se règle sur la déclaration, pas dans l'attachement.** Tant que l'attachement n'est pas signé, une quantité contestée par le MOE ne se corrige pas dans l'attachement : celui-ci retourne en **brouillon**, la **déclaration** du nœud est corrigée (AC-7), et l'attachement est **remonté** depuis les déclarations. Une fois l'attachement signé, plus rien ne s'y corrige (AC-15) : l'écart se règle sur la **période suivante**. Il n'y a donc jamais deux valeurs pour la même quantité — c'est la même règle qu'AC-9, appliquée à l'attachement.

**AC-18 — Le vocabulaire du chantier marocain.** À l'écran : **attachement**, **situation**, **quantité faite**, **reste à faire**, **avancement**, **zone**, **MOE**. N'apparaissent **jamais** : « quotité », « WBS », « valeur acquise », « earned value », « avancement pondéré », « ligne d'équilibre » — ni comme libellé, ni comme colonne, ni comme message d'erreur. Le mot **activité** n'apparaît qu'au palier 2 (message d'AC-9) : au palier 1, aucun écran ne le prononce. Le nom interne d'un calcul n'est pas son libellé.

---

**AC-19 — Le lien de signature ne se devine pas.** Le jeton de `/api/v1/sign/{token}` est **distinct de l'identifiant de l'attachement** : non devinable, non énumérable, **daté** (il expire) et **à usage unique** — une fois la signature déposée, il ne rouvre rien. Un jeton inconnu, expiré ou déjà consommé rend le même refus, sans révéler si l'attachement existe.

**Pourquoi c'est un critère et pas une dette.** Aujourd'hui `SignaturePublicController` est `@PublicEndpoint` et `AttachementSignatureService.resolveAttachementId` renvoie le jeton tel quel : *le jeton **est** l'identifiant de l'attachement*. N'importe qui connaissant un id peut donc signer au nom du MOE. C'était supportable tant que la signature n'engageait rien ; **AC-15 vient d'en faire la pièce qui fait foi pour facturer**. On ne peut pas élever un document au rang de preuve contractuelle et laisser sa serrure ouverte dans le même contrat.

## Hors périmètre (dette nommée, pas AC)

- **La situation et ses retenues** — sous-lot voisin [`../situation-et-retenues/`](../situation-et-retenues/00-PLAN.md). Ce contrat s'arrête à l'attachement signé (AC-15) ; le décompte cumulatif, la valorisation au client, RG, avance, pénalités et RAS s'y branchent.
  **À reprendre là-bas, constaté ici :** la situation se calcule aujourd'hui sur les **lots seuls** (`quantite × prixUnitaireHt`), jamais sur les postes — donc elle ne peut pas consommer des lignes d'attachement rattachées à un nœud (AC-12) tant que ce n'est pas corrigé.
- **Le planning et l'imputation à l'activité** — palier 2. Activités, WBS, quotités, remontée de l'avancement depuis l'activité : rien n'est livré ici. AC-9 **pose** seulement la règle qui empêchera les deux portes.
- **Les avenants et travaux supplémentaires.** AC-5 nomme la sortie du dépassement ; il ne la construit pas. C'est la seule porte future qui aura le droit d'augmenter la quantité prévue d'un nœud.
- **Le jeton du lien de signature.** `SignaturePublicController` accepte aujourd'hui l'**identifiant de l'attachement comme jeton** (stub assumé dans le code). Ce contrat garde le lien tel quel et ne durcit pas le jeton — voir `## Question`.
- **Le contreseing MOA** (`EN_ATTENTE_MOA`, `CONTRESIGNE_MOA`, `CONTESTE`, `CLOS`). Le workflow existe et n'est pas retouché : AC-15 ne parle que de la signature MOE.
- **Les faits quotidiens portés par l'attachement** — météo, température, effectif présent. `JournalChantier` ne les porte pas encore ; leur bascule au journal de chantier est un autre chapitre, pas celui-ci. Ils restent où ils sont.
- **La valeur acquise et la marge.** [`../budget-et-marge/CONTRAT.md`](../budget-et-marge/CONTRAT.md) AC-13 **consomme** l'avancement de nœud posé ici (AC-3) ; il ne se définit pas ici.
- **Le référentiel de zones comme axe de planning** (regroupement, ligne d'équilibre, chemin de fer). AC-14 le crée pour l'attachement, facultatif et vide par défaut — il ne le branche nulle part ailleurs. **Un seul référentiel de zones dans le produit**, tenu par le chantier : personne n'en crée un second.
- **Les photos de l'avancement.** Elles restent où elles sont, facultatives ; ce contrat ne les touche pas.
- **Migration de données.** Lab métier : schéma clean + re-seed. Les pourcentages stockés et les lignes d'attachement au `posteCode` libre ne sont pas repris.

---

## Scénarios e2e (noms) + état initial

L'exec implémente ; le QA joue. Ne pas choisir des valeurs qui passent toutes seules.

| Scénario | Couvre |
|----------|--------|
| `avancement-declaration-quantite-seule` | AC-1 |
| `avancement-aucun-pourcentage-stocke` | AC-2 |
| `avancement-pourcentage-derive-fait-sur-prevu` | AC-3 |
| `avancement-lot-pondere-par-le-vendu` | AC-4 |
| `avancement-depassement-refuse` | AC-5 |
| `avancement-noeud-sans-quantite-prevue` | AC-6 |
| `avancement-correction-puis-annulation` | AC-7 |
| `avancement-sans-aucun-planning` | AC-8 |
| `attachement-periodes-sans-chevauchement` | AC-10 |
| `attachement-lignes-lues-de-la-periode` | AC-11, AC-12 |
| `attachement-noeud-interne-exclu` | AC-13 |
| `attachement-zone-du-referentiel` | AC-14 |
| `attachement-signe-fige-la-periode` | AC-15, AC-7 |
| `attachement-quantite-attachee-une-seule-fois` | AC-16 |
| `attachement-contestation-retour-a-la-declaration` | AC-17 |
| `attachement-vocabulaire-chantier` | AC-18 |

**AC-9 n'a pas de scénario e2e** : aucune activité ne peut exister au palier 1. Sa preuve est **unitaire** — un nœud fabriqué comme couvert, une déclaration directe refusée.

**État initial requis :**

- Tenant `qa-local`.
- **Un chantier issu d'une conversion** (contrat voisin) : **≥ 2 lots**, **1 sous-lot**, **≥ 6 postes `VENDU`** aux **unités, quantités et prix unitaires distincts** — sans ça, ni la pondération d'AC-4 ni le `fait / prévu` d'AC-3 ne prouvent quoi que ce soit.
- **Au moins 1 nœud `INTERNE`** avec une quantité prévue et des quantités déclarées, dans un lot qui contient aussi du vendu (AC-4, AC-13).
- **Un nœud sans quantité prévue** (ou à zéro) pour AC-6.
- Des déclarations réparties sur **deux périodes distinctes** : un nœud avancé **partiellement** (ni 0 %, ni 100 %), un nœud amené **exactement** à sa quantité prévue, un nœud **jamais déclaré**.
- Une déclaration qui **dépasse** le reste à faire d'un nœud, à jouer pour AC-5.
- **Deux attachements** sur le chantier : le premier **signé MOE** par le lien public, le second monté sur la période suivante (AC-15, AC-16).
- **Un chantier avec un référentiel de zones** d'au moins 2 zones sur 2 niveaux, et **un chantier sans aucune zone** — les deux doivent produire leurs attachements (AC-14).
- **Aucune activité, aucune quotité** nulle part. Tous les scénarios doivent passer sans.
