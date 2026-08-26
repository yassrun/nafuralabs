# Contrat — cockpit chantier : préparer, piloter, agir

> Le cockpit est la porte d'entrée du chantier. En moins de dix secondes il répond : **où en est-on, qu'est-ce qui dérive, quelle action faire maintenant ?**
> Il consomme le contrat [`../continuite-etude-devis-chantier/CONTRAT.md`](../continuite-etude-devis-chantier/CONTRAT.md) et les agrégats des sous-lots métier ; il n'en recrée pas les règles.
> Plan : [`00-PLAN.md`](00-PLAN.md). Wireframe de référence : [`ux/cockpit-wireframe.md`](ux/cockpit-wireframe.md).

**Qualification : REFONTE FONCTIONNELLE.** La fiche actuelle expose des onglets et des tuiles, mais ne hiérarchise ni les prérequis de préparation, ni les alertes, ni la prochaine action. L'audit Mode B du **26/08/2026** montre aussi le code en double dans l'en-tête, un statut budget divergent et des KPI financiers ambigus.

Gelé le **26/08/2026**.

---

## Principes

1. **Une synthèse, pas un second métier.** Le cockpit lit des faits calculés par arbre, budget, planning, avancement et situations. Il ne possède pas un deuxième statut, une deuxième marge ou un deuxième avancement.
2. **Le palier 1 marche sans planning.** Une absence d'activité est une recommandation de préparation, pas un blocage technique ni un écran cassé.
3. **Chaque alerte mène à une action.** Une carte sans responsable, cause et destination n'est pas une alerte.
4. **Chaque rôle voit ce qu'il peut traiter.** Une action interdite n'est pas proposée ; une donnée financière non autorisée n'est pas remplacée par zéro.
5. **L'absence est explicite.** « Non renseigné » et « Non disponible » ont un sens ; aucune donnée n'est inventée.

---

## Read model contractuel

`GET /api/v1/chantiers/{id}/cockpit` appartient au BC Chantiers et compose un instantané de lecture :

```text
identity        code, nom, client, statut, provenance commerciale
schedule        dates contractuelles, date OS, fin prévue, retard calculable
finance         vente active HT, déboursé initial, budget révisé, engagé,
                réel, marge projetée valeur/taux, source et disponibilité
progress        avancement physique, facturé HT, encaissé HT, période courante
preparation[]   code, état BLOQUANT|A_FAIRE|OK|NON_APPLICABLE, libellé, action
alerts[]        code stable, sévérité, fait source, message, action autorisée
nextActions[]   priorité, libellé, route/action, permission requise
activityFeed[]  derniers faits métier audités, sans reconstituer un journal parallèle
```

Les métriques gardent montant, devise, base HT/TTC, date de fraîcheur et état `AVAILABLE | NOT_AVAILABLE | FORBIDDEN`. Le endpoint n'importe pas les domaines Études, Devis ou Achats : il lit les instantanés détenus par Chantiers et les ports de lecture déjà autorisés. Aucun agrégat de cockpit n'est stocké comme nouvelle vérité.

### Priorité déterministe

Pour une même priorité, l'élément le plus ancien passe en premier :

1. blocage de démarrage ou intégrité métier ;
2. dérive de marge / budget ;
3. retard contractuel ou activité critique ;
4. préparation incomplète ;
5. avancement, attachement, situation ou encaissement à traiter ;
6. recommandation documentaire ou de planification.

Une alerte a une sévérité `CRITICAL`, `WARNING` ou `INFO`, un code stable et une donnée source. Le frontend ne réimplémente pas l'ordre ni les seuils.

---

## Critères d'acceptation gelés

### En-tête et vérité de synthèse

**AC-1 — Une seule identité de page.** Le code et le nom du chantier n'apparaissent qu'une fois dans l'en-tête principal. On y lit statut métier, client, source commerciale et dernière fraîcheur ; aucun second H1 ni code dupliqué dans le contenu.

**AC-2 — Le statut affiché est le statut chantier.** Liste, en-tête, cockpit et sections spécialisées affichent le même statut. Les libellés et actions varient selon `EN_PREPARATION`, `EN_COURS`, `SUSPENDU`, `TERMINE`, `RECEPTIONNE`, `CLOTURE`, sans état local de présentation.

**AC-3 — Les KPI ont un sens stable.** La première ligne montre au plus cinq décisions : vente active HT, budget révisé HT, marge projetée valeur/taux, avancement physique, échéance/retard. Chaque KPI expose définition/source au survol ou à l'aide contextuelle. Un coût n'est jamais libellé vente.

**AC-4 — Une donnée absente ne devient pas zéro.** `NOT_AVAILABLE` affiche « Non disponible » et sa cause ; `FORBIDDEN` retire la valeur et indique seulement que l'accès est restreint si nécessaire. Zéro n'est affiché que si le domaine atteste réellement zéro.

### Préparation et démarrage

**AC-5 — La préparation est une checklist calculée.** Pour `EN_PREPARATION`, le cockpit expose exactement ces contrôles :

| Contrôle | Bloque le démarrage | Règle |
|---|---:|---|
| identité et client | oui | valeurs présentes et valides |
| référence de vente | oui si chantier issu d'étude | snapshot cohérent du contrat voisin ; non applicable en création directe |
| arbre chantier | oui | au moins un nœud exploitable |
| budget initial | oui | déboursé initial disponible et cohérent avec les nœuds |
| responsables | oui | au moins conducteur **et** chef de chantier affectés |
| dates prévues | oui | début et fin prévues valides, fin postérieure au début |
| ordre de service | oui | numéro/référence et date d'effet saisis lors du démarrage |
| planning d'activités | **non** | `A_FAIRE` recommandé si vide, jamais bloquant au palier 1 |

Le cockpit reçoit l'état calculé et la raison de chaque contrôle ; le frontend ne devine pas un prérequis.

**AC-6 — Le démarrage passe uniquement par l'ordre de service.** Aucun bouton générique ne force `EN_COURS`. L'action « Enregistrer l'OS et démarrer » apparaît seulement à un rôle autorisé quand tous les bloqueurs hors OS sont levés ; elle demande référence et date d'effet, effectue une commande atomique, journalise l'acteur et rend le chantier `EN_COURS`.

**AC-7 — Un échec de préparation est actionnable.** Chaque contrôle non satisfait pointe vers l'écran, le drawer ou l'action qui le résout, avec retour au cockpit. Aucun lien mort et aucune simple phrase « compléter les informations ».

**AC-8 — L'absence de planning reste saine.** Sans activité, le chantier peut être démarré, avancé sur son arbre, attaché et facturé selon les contrats voisins. Le cockpit affiche « Planning non créé — recommandé » et une action autorisée, pas `0 % de retard`, pas une erreur et pas un blocage.

### Alertes et prochaine action

**AC-9 — Les alertes viennent de faits.** Chaque alerte retourne code, sévérité, date, valeur observée, règle/seuil et identifiant source. Fermer visuellement une alerte ne change pas le fait source ; elle disparaît lorsque le fait est corrigé, ou porte un acquittement audité si le domaine l'autorise.

**AC-10 — La prochaine action est unique et déterministe.** Le cockpit met en avant une action primaire issue de l'ordre de priorité contractuel, puis au plus trois actions secondaires. À données et rôle identiques, API et UI produisent le même ordre.

**AC-11 — Les actions respectent statut et permission.** Une action indique permission et statuts admissibles. Le backend les revérifie à l'exécution. L'UI ne montre pas une action impossible ; si l'état change entre lecture et clic, le refus explique le nouvel état et recharge le cockpit.

**AC-12 — Les dérives financières sont lisibles.** Une marge projetée négative est `CRITICAL`; une baisse par rapport à la marge initiale est au moins `WARNING` et montre l'écart en MAD et points. Un budget ou une vente indisponible produit une alerte d'intégrité, jamais une marge `0 %`.

**AC-13 — Le temps n'est calculé que sur des dates réelles.** Retard = date de référence moins fin prévue, uniquement quand les dates nécessaires existent. Avant échéance, afficher jours restants ; après, jours de retard. Sans date, signaler la donnée manquante. La date du jour ne remplace jamais une date chantier.

### Parcours de pilotage

**AC-14 — Le cockpit ouvre les flux, il ne les duplique pas.** Les blocs arbre, budget, planning et facturation montrent un résumé et un CTA vers leur écran spécialisé, en conservant chantier et contexte de période. Les formulaires métier restent dans les modules propriétaires.

**AC-15 — Le flux mensuel est visible sans imposer le planning.** Le cockpit rend la séquence `avancement → attachement → situation` et l'état de la période courante. Le premier geste disponible est actionnable. Le calcul repose sur l'arbre vendu quand aucun planning n'existe.

**AC-16 — La navigation garde une structure courte.** La route par défaut devient **Pilotage**. Les accès spécialisés restent : Équipe, Arbre, Budget, Planning, Situations, Documents, Photos. Aucun ancien écran placeholder ou doublon de détail ne revient.

**AC-17 — Les états terminaux deviennent lecture et clôture.** `TERMINE`, `RECEPTIONNE` et `CLOTURE` gardent synthèse, alertes résiduelles et historique, mais ne proposent pas de saisie opérationnelle interdite. `SUSPENDU` met la suspension en tête et n'offre que les gestes compatibles.

### Portefeuille, rôles et responsive

**AC-18 — La liste aide à choisir où agir.** Chaque ligne expose code/nom, statut, responsable, avancement, échéance/retard, vente active, budget révisé, marge projetée, alerte principale et prochaine action. Colonnes financières absentes pour un rôle non autorisé ; la géométrie reste lisible.

**AC-19 — Le portefeuille se filtre par décision.** Filtres serveur : statut, sévérité d'alerte, responsable, en retard, marge négative. Tri serveur sur alerte, échéance, marge et avancement. Pagination et filtres survivent à l'aller-retour depuis une fiche.

**AC-20 — Quatre profils sont prouvés.** `owner` voit et agit sur tout ; `conducteur` traite préparation/opérationnel sans actions financières réservées ; `chef-chantier` voit prioritairement avancement et terrain ; `daf` voit budget, situations et encaissement sans commandes terrain. Les autorisations exactes restent celles du backend.

**AC-21 — Mobile sans cockpit amputé.** À largeur 390 px : KPI en pile/scroll contrôlé, aucune troncature de montant ou statut, cible tactile minimale 44 px, action primaire persistante sans masquer le contenu, tableaux transformés en cartes ou scroll explicite. Les mêmes faits et permissions qu'au desktop sont conservés.

**AC-22 — Les erreurs partielles ne mentent pas.** Si l'identité/statut échoue, la page est en erreur bloquante. Si une section secondaire échoue, son bloc dit « Indisponible » avec réessai et les autres blocs restent utilisables ; aucune ancienne valeur n'est affichée comme fraîche.

---

## Hors périmètre

- Refaire les moteurs Planning/Gantt, Budget, Attachement, Situation, Documents ou Photos.
- Générer automatiquement des activités ou rendre le planning obligatoire.
- Créer le domaine marché, avenant, réception ou HSE.
- Application mobile native, mode hors ligne et notifications push.
- Nouvel entrepôt analytique ou agrégats de cockpit persistés.

---

## Scénarios de preuve Mode B

| Scénario | Données discriminantes | Couvre |
|---|---|---|
| `cockpit-preparation-checklist-et-os` | chantier converti incomplet, puis complété et démarré | AC-2, AC-5, AC-6, AC-7 |
| `cockpit-sans-planning-reste-actionnable` | zéro activité, avancement/attachement/situation possibles | AC-8, AC-15 |
| `cockpit-kpi-canoniques` | vente `737106`, budget `582600`, marge `154506`, avancement `37 %` | AC-1, AC-3, AC-4 |
| `cockpit-alerte-marge-negative` | vente `500000`, budget révisé `582600` | AC-9, AC-10, AC-12 |
| `cockpit-retard-et-date-absente` | un chantier en retard, un sans fin prévue | AC-13 |
| `cockpit-navigation-vers-modules` | période mensuelle partiellement traitée | AC-14, AC-16 |
| `cockpit-etats-suspendu-et-clos` | chantiers `SUSPENDU` et `CLOTURE` | AC-17 |
| `cockpit-portefeuille-filtres-et-retour` | au moins 8 chantiers, alertes et responsables distincts | AC-18, AC-19 |
| `cockpit-rbac-quatre-profils` | jouer `owner`, `conducteur`, `chef-chantier`, `daf` | AC-11, AC-20 |
| `cockpit-mobile-390` | viewport 390 × 844 sur préparation et en cours | AC-21 |
| `cockpit-erreur-section-sans-faux-zero` | simuler indisponibilité de la section finance | AC-22 |

