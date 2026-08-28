# Scénario — Al Qods mois 1 (septembre)

> Suite directe de [`../vie-de-chantier/SCENARIO.md`](../vie-de-chantier/SCENARIO.md) acte 2.c–2.d.
> Chantier **CH Al Qods** déjà `EN_COURS`, vente = devis (pas de marché notifié).

## Personas

| Rôle | Alias QA | Ce mois |
|---|---|---|
| Chef de chantier | `chef-chantier` | Déclare les quantités terrain |
| Conducteur | `conducteur` | Attachement, situation, soumission MOA |
| DAF | `daf` | Lit marge / situation, ne réceptionne pas |

## État initial (fin août → début septembre)

- Nœud **2.1** béton : DA + BL ciment livré (40 t → 40 m³ prévus au DPU).
- Nœud **2.3** coffrage : contrat ST engagé, 0 m² avant septembre.
- Nœud **interne** *Installation de chantier* : existe, coût seul.
- Poste **3** étanchéité : contrat ST créé, **0 m²** — ne doit pas apparaître au client.
- Pas de marché notifié : référence de vente active = **devis**.

## Septembre — terrain (2.c)

Le chef déclare :

| Nœud | Quantité | Date | Unité |
|---|---|---|---|
| 2.1 | 40 | 12/09 | m³ |
| 2.3 | 120 | 18/09 | m² |

Refus attendu si quelqu’un tente **181 m³** sur 2.1 (dépassement → avenant, pas écrêtage).

Optionnel : 1 fft terrassement si terminé — hors attachement si lot interne ou non vendu selon graphe.

PV de coulage : document chantier (hors preuve situation).

## Septembre — fin de mois (2.d)

### Attachement période 01/09–30/09

1. Le conducteur ouvre **Attachement** depuis le cockpit (`chantierId` connu).
2. Période **01/09 → 30/09**.
3. Les lignes **arrivent** :
   - 2.1 · 40 m³ · PU vendu lu sur le nœud
   - 2.3 · 120 m² · PU vendu lu sur le nœud
4. **Aucune** ligne *Installation* (interne).
5. **Aucune** ligne étanchéité (0 m² déclaré).
6. Le conducteur ne retape code, unité ni quantité.
7. Lien public MOE → attachement **SIGNE_MOE**.

### Situation n°1

1. Depuis la fiche chantier (sans marché notifié) : **Générer situation**.
2. La situation consomme **uniquement** l’attachement signé de septembre.
3. Lignes = mêmes nœuds / quantités / PU vendu.
4. Cascade **RG + avance** (taux du chantier) ; net à payer HT/TTC cohérent.
5. Pas de situation si l’attachement n’est pas signé.

### Cockpit lendemain

- Prochaine action ≠ « saisir l’avancement de septembre ».
- Elle pointe un trou réel : BL acier en attente, ST étanchéité, situation à soumettre au MOA, etc.

## Discriminants QA (obligatoires)

1. **Attachement lu, pas retapé** — modifier une quantité dans l’attachement est impossible ; correction = déclaration terrain.
2. **Interne absent** — nœud installation déclaré au budget mais **absent** de l’attachement et de la situation.
3. **ST sans avancement client** — étanchéité contrat ST existant, 0 m² : **absent** de la situation.
4. **Sans signature, pas de situation** — attachement `EN_ATTENTE_MOE` → génération refusée.
5. **Devis sans marché** — situation n°1 générée avec référence de vente active = devis (AC-M8).
6. **Rôles** — chef : avancement ; conducteur : attachement + situation ; daf : pas réception BL.

## Hors scénario (rappel)

- Octobre / BL partiel acier : prouvé en SEKTOR-226 acte 3.
- Panne Achats cockpit : SEKTOR-227.
- Planning, engins, RH datés : palier 2 § SCENARIO parent.
