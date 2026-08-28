# Scénario directeur — Groupe scolaire Al Qods

> Une STE marocaine gère un lot de gros œuvre, de l'étude à la réception provisoire.
> Palier 1 : **aucun planning**. Finance (lettrage, encaissement, RAS comptable) : après.
> Contrat d'attente ERP : [`CONTRAT.md`](CONTRAT.md).

Ce n'est pas un test de présence d'écran. Chaque mois a un **fait discriminant** : une quantité, un BL, un devis fournisseur, un contrat ST, un attachement signé. Si le fait n'existe pas dans Sektor, le scénario échoue.

Documents à jouer (CPS, BDP, devis import magique, DA, BL, photos) : [`FIXTURES.md`](FIXTURES.md) · [`sektor/e2e/fixtures/al-qods/CAS.md`](../../../../e2e/fixtures/al-qods/CAS.md).

---

## Les acteurs

| Rôle | Qui | Ce qu'il fait dans Sektor |
|---|---|---|
| Chargé d'étude | `ingenieur` | Bordereau, DPU, consultations, devis, gain |
| Conducteur | `conducteur` | Prépare, OS, DA, ST, attachement, situation, marché |
| Chef de chantier | `chef-chantier` | Avancement quotidien, documents, réception BL sur site |
| Magasinier | `magasinier` | Réception BL, magasin si on stocke (ici : livraison directe) |
| DAF | `daf` | Voit budget/marge, n'exécute pas le terrain |
| DG / owner | `dg` / owner | Décisions commerciales, notification, réception |

Entreprise : **STE Al Binaa**. MOA : commune. MOE : BET Atlas.

---

## L'ouvrage vendu

Lot **Gros œuvre** du groupe scolaire Al Qods, Rabat. Unités et quantités volontairement hétérogènes.

| Code | Poste | Qté | Unité | Comment on le vit |
|---|---|---|---|---|
| 1 | Terrassement général | 1 | fft | Forfait, **non décomposé**, exécuté en régie interne |
| 2.1 | Béton B25 fondations | 180 | m³ | DPU matière + MO. Ciment **consulté** chez 2 fournisseurs |
| 2.2 | Acier HA | 25 | t | DPU matière. Acier consulté (1 devis ; min N du tenant = 1) |
| 2.3 | Coffrage | 850 | m² | **Sous-traité** — on n'a pas la ressource |
| 3 | Étanchéité toiture | 420 | m² | **Sous-traité** — métier que la STE n'exerce pas |

Après conversion, le conducteur ajoute un nœud **interne** : *Installation de chantier* (base vie, clôture). Coût seul, jamais dans une situation.

Le DPU de 2.1, à l'étude :

| Composant | Nature | Origine | Décision Catalogue |
|---|---|---|---|
| Ciment CPJ 45 | MATIERE | Catalogue, tarif tenant | déjà Item |
| Sable 0/5 | MATIERE | Catalogue | déjà Item |
| Gravier 15/25 | MATIERE | LIBRE puis créé et lié | CREE_ET_LIE |
| Équipe coffrage/coulage | MAIN_DOEUVRE | LIBRE, poste seulement | POSTE_SEULEMENT |

Le DPU de 2.3 et 3 : une ligne `SOUS_TRAITANCE` (forfait ou PU), pas une fausse matière.

---

## Acte 0 — Étude (fabrique le chantier, on n'y retouche pas)

1. Créer le dossier, client commune, chargé `ingenieur`, type AO, échéance.
2. Saisir le bordereau ci-dessus (voie manuelle, sans PDF obligatoire).
3. Décomposer 2.1 et 2.2. 2.3 et 3 : nature ST, pas de faux DPU matière.
4. **Consultation Achats** liée à l'étude, **un fournisseur = un paquet** :
   - Lafarge + Holcim sur le ciment → 2 devis importés → composant ciment **CONSULTÉ**.
   - Un fournisseur acier → 1 devis → CONSULTÉ si le min N du tenant le permet.
5. Générer le devis client, le figer, marquer **gagné** (attribution = total devis).
6. **Convertir** : chantier `EN_PREPARATION`, **aucun marché**. Vente = devis.

L'étude n'est plus le sujet. Elle a laissé : un arbre vendu, un déboursé par nœud, des articles catalogue, des flags CONSULTÉ, deux postes ST identifiés.

---

## Acte 1 — Préparer et démarrer (semaine 0)

Le conducteur ouvre le **cockpit**, pas cinq menus.

Faits à poser, sinon l'OS refuse :

- conducteur **et** chef affectés ;
- dates début / fin, fin > début ;
- budget initial présent (copie DPU).

Puis **ordre de service** : référence + date d'effet → `EN_COURS`.

Documents de la semaine : OS scanné, plans MOE, PPS (même sans HSE : un PDF dans Documents). Le planning n'est **pas** demandé.

**Marché** : si le MOA notifie, le conducteur crée / notifie le marché **depuis le chantier**. Référence, cautions, délais. À partir de là la vente active = le marché. Si le MOA n'a pas notifié, on reste sur le devis — cas normal, pas un trou.

---

## Acte 2 — Premier mois : matière et avancement

### 2.a Ciment — acheter pour le poste 2.1

Depuis le cockpit, sur le nœud **2.1** :

1. **Demande d'achat** : 40 t de CPJ 45, date de besoin, chantier + **nœud** (pas seulement le nom du chantier).
2. Achats approuve → **bon de commande** Lafarge, mêmes lignes, `chantierId` + nœud.
3. Livraison **directe chantier** (pas de magasin). Le chef saisit la **réception BL** : n° BL, date, quantités. Écart BL vs BC refusé ou écart tracé, jamais un « OK » silencieux.
4. Le coût reçu s'impute au nœud 2.1 (budget réel / engagé), pas dans un pot anonyme.

Sans nœud, la DA est un besoin chantier générique — autorisé, mais le scénario 2.1 **exige** le nœud.

### 2.b Coffrage — engager le ST

Poste 2.3 : on n'achète pas de contreplaqué pour coffrer nous-mêmes.

1. Depuis le nœud 2.3 (ou le cockpit) : **contrat ST** Achats — fournisseur coffreur, BPU (850 m²), montant, retenue, dates.
2. Le contrat porte le **poste 2.3**, pas une activité (il n'y en a pas).
3. L'avancement du coffrage se déclare **sur le nœud 2.3** (quantité faite). L'attachement ST (situation du sous-traitant) n'est **pas** exigé pour facturer le client ce mois-ci ; il est nommé comme suite, pas comme trou palier 1.

L'étanchéité (poste 3) attend : contrat ST créé, 0 m² faits ce mois.

### 2.c Avancement terrain

Le chef déclare, au téléphone :

- 2.1 : **40 m³** faits le 12/09 (unité du nœud, pas un %).
- 2.3 : **120 m²** de coffrage le 18/09.
- Terrassement : 1 fft si terminé, ou rien.

Interdit : saisir 181 m³ sur 2.1 (dépassement). Sortie = avenant, pas un écrêtage.

Photos / PV de coulage : documents rattachés au **chantier**, idéalement au nœud ; pas un dump Drive.

### 2.d Attachement et situation

Fin de mois : le conducteur ouvre l'attachement **période 01/09–30/09**. Les lignes **arrivent** : 40 m³ béton, 120 m² coffrage. Il ne retape rien. Le MOE signe (lien public).

Puis situation n°1 : relit **cet** attachement signé, valorise au PU vendu, cascade RG / avance. Pas de ligne interne *Installation*. Pas de situation si rien n'est signé.

Le cockpit, le lendemain : prochaine action ≠ « saisir l'avancement de septembre » ; elle pointe le trou réel (BL acier, ST étanchéité, situation à soumettre, etc.).

---

## Acte 3 — Deuxième mois : le trou qu'un QA superficiel râte

Discriminants **obligatoires** — si l'un passe « vert » sans le fait, la preuve est superficielle.

1. **BL partiel.** DA acier 25 t, BC 25 t, premier BL **12 t**. Le reste à livrer reste visible. On n'avance pas 25 t d'acier.
2. **Quantité déjà attachée.** Rejouer septembre dans un attachement octobre est refusé.
3. **Nœud interne.** Déclarer 1 fft d'installation : visible au budget, **absent** de l'attachement octobre.
4. **ST sans avancement.** Le contrat étanchéité existe ; 0 m² ; la situation client n'invente pas le lot 3.
5. **Rôle.** `chef-chantier` saisit l'avancement ; `daf` voit la marge, n'a pas « Réceptionner le BL » ; `magasinier` réceptionne, ne signe pas l'attachement MOE.
6. **Cockpit après panne.** Une source Achats down : le chantier reste lisible, la tuile DA dit indisponible, **pas** « 0 DA ».

---

## Acte 4 — Livraison (réception provisoire)

Quand les nœuds vendus sont à 100 % attachés (ou le reste est un avenant / réserve) :

- documents : PV de réception provisoire dans Documents ;
- `EN_COURS` → réception provisoire — **pas** un clore sauvage depuis `EN_COURS` ;
- le cockpit passe en lecture d'exécution : plus de DA / avancement opérationnels.

Réception définitive (levée de réserves, RG) : **après ce sous-lot**, avec la finance.

---

## Ce que ce scénario n'est pas

- Un Gantt. Le conducteur n'en a pas besoin pour facturer.
- Une clôture comptable. Pas de lettrage, pas de RAS en écriture, pas de paie.
- Un rejeu d'Extraire / IA / garde-fous études (`finition-parcours` reste de côté).
- Un seed `DE-0103` déjà converti. Le graphe **se fabrique** dans la preuve, avec les 180 m³ / 25 t / 850 m² ci-dessus.
- Un **plan de charge** (engins, équipes, besoins matière datés). Ça existe déjà comme palier 2 — voir ci-dessous. Palier 1 les ignore **exprès**.

---

## Palier 2 — Al Qods avec les ressources (pas ce sous-lot)

Gel : [capacité vs engagement](../../../DECISIONS-PRODUIT-CHANTIER.md). Lots : `planning-activites` → `capacite-et-engagement` → `pointage-impute`.

Deux familles. On **nivele** la capacité (MO, engins). On **date** l'engagement (matière, ST) et Achats / Catalogue décident l'acte.

### Activités du mois 1 (exemples, WBS libre + zone)

| Activité | Zone | Du → au | Nœud (quotité) |
|---|---|---|---|
| Terrassement semelle | Fondations | 01–05/09 | 1 · 1 fft |
| Ferraillage longrines | Fondations | 06–11/09 | 2.2 · 8 t / 25 |
| Coffrage semelles | Fondations | 08–18/09 | 2.3 · 120 m² / 850 |
| Coulage B25 | Fondations | **12/09** | 2.1 · 40 m³ / 180 |

L'avancement se saisit **sur l'activité**. Il remonte au nœud (40 m³, 120 m²). On ne retape pas le bordereau.

### Capacité — RH (chez nous, calendrier)

La personne reste à `rh/` (contrat, absences, habilitations, **pointage**). Le chantier **affecte** une charge sur l'activité. Un seul planning de ressources, pas le `PlanningController` RH en doublon.

| Qui | Activité | Charge | Discriminant |
|---|---|---|---|
| Chef de chantier (déjà affecté palier 1) | toutes, présence | 100 % semaine | identité OS ≠ plan de charge |
| 4 coffreurs internes | Coffrage semelles | 4 × 8 j | conflit si les mêmes partent sur un autre chantier le 12/09 |
| Équipe coulage (DPU 2.1 `POSTE_SEULEMENT`) | Coulage B25 | 1 journée | au palier 1 c'est un **coût** DPU ; ici c'est un **créneau** |
| Conducteur | — | pas pointé au jour | il pilote, il n'est pas une ressource nivelée |

Pointage : le chef pointe **l'activité**, pas la ligne 2.1 du BDP. Interdit : second pointage dans `chantiers/`.

### Capacité — engins / matériel (chez nous, calendrier)

Même famille que la MO. Conflit = deux chantiers, **une** grue.

| Engin | Activité | Créneau | Discriminant |
|---|---|---|---|
| Pelle 20 t (parc ou location) | Terrassement | 01–05/09 | si elle est sur un autre site le 03/09 → conflit, pas un ST |
| Pompe à béton | Coulage B25 | **12/09** | 1 jour. Sans elle on ne coule pas 40 m³ |
| Camion toupie | Coulage B25 | 12/09 | souvent **prestation** (engagement), pas un engin du parc — ne pas niveler comme la pelle |
| Grue à tour | — | **pas mois 1** | Al Qods fondations : pas de grue. L'inventer serait du théâtre |

Location d'engin : contrat / BC **Achats**, l'affectation **date** le besoin. On n'achète pas la pelle depuis le Gantt.

### Engagement — matière datée (pas du nivellement)

Le planning ne commande pas. Il pousse un **besoin** : article, qté, date, nœud / activité. Achats en fait une DA.

| Besoin | Qté | Date besoin | Aval palier 1 déjà vécu |
|---|---|---|---|
| Ciment CPJ 45 | 40 t | **10/09** (J-2 du coulage) | DA-01 → BL-01 le 12/09 |
| Acier HA | 12 t (1er lot) | **05/09** avant ferraillage | DA-02 / BL-02 **12 t** — le planning ne livre pas 25 t |
| Sable / gravier | selon DPU 40 m³ | 11/09 | même chaîne DA, pas dans les fixtures palier 1 |

Si le BL ciment arrive le 13/09, l'activité Coulage du 12/09 est en retard **matériel**. Palier 1 ne voit que « 40 t reçues ». Palier 2 voit l'échéance ratée.

ST coffrage / étanchéité : engagement, **pas** une équipe interne à niveler. Le contrat reste Achats (AC-8). Le planning **date** le lot confié ; il ne le crée pas.

### Ce que palier 1 a déjà, qu'il ne faut pas confondre

| Palier 1 | ≠ palier 2 |
|---|---|
| Conducteur + chef **affectés** (checklist OS) | Plan de charge hebdo, conflits, absences RH |
| DPU MO `POSTE_SEULEMENT` (coût) | Affectation d'ouvriers sur une activité |
| DA née du **nœud** | DA née d'un **besoin daté** d'activité (même DA, autre naissance) |
| BL 12 t / 25 t | Besoin ferraillage 8 t semaine 1 — le reste du BC n'est pas « en retard d'activité » |
| Installation interne (coût, hors situation) | Activité interne planifiée (clôture, base vie) qui **consomme** RH / engins |

Pas de fixtures engins / planning RH dans `e2e/fixtures/al-qods/` tant que `capacite-et-engagement` n'est pas ouvert. Les faits ci-dessus sont le gold de cette vague-là.
