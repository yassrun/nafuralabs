# Contrat — raffinement Études : du dossier brut à la décision

> Ce lot rend le parcours Études fiable, explicable et rapide, avec ou sans IA.
> Il respecte [`../../../DECISIONS-PRODUIT.md`](../../../DECISIONS-PRODUIT.md) : poste ≠ article, composant réutilisable = Item tenant lié à une identité Sektor, recette = ouvrage.
> Plan : [`00-PLAN.md`](00-PLAN.md). Référence UX : [`ux/raffinement-etude-wireframe.md`](ux/raffinement-etude-wireframe.md).

**Qualification : BUG + RAFFINEMENT FONCTIONNEL + UX.** Audit Mode B du **26/08/2026** :

- une étude `CONVERTIE` affiche BDP et CPS « obligatoires » non déposés, mais `Anomalies étape 1 : 0` ;
- la même étude annonce `Anomalies étape 4 : 0` tout en signalant 26 % de coûts non établis et 4 composants libres ;
- la liste porte deux paginations concurrentes (`25` en français et `20` en anglais) et la recherche testée ne réduit pas les lignes ;
- la colonne `Type AO` reste `—` sur des études créées avec un parcours arrivé jusqu'au gain ;
- l'étape nommée **Coût** affiche surtout `PU HT` et `Total HT` de vente ;
- le drawer répète deux fois « Extraire les composants » et « Ajouter depuis le catalogue » ;
- une extraction IA sans résultat est présentée comme « aucun composant détecté », sans distinguer absence métier, indisponibilité et échec technique ;
- la création Catalogue peut réussir alors que le tarif échoue silencieusement, puis renvoyer malgré tout `sourcePrix = TARIF`.

Gelé le **26/08/2026**.

---

## Résultat attendu

À tout instant, le chargé d'étude sait :

1. ce qui est acquis et d'où cela vient ;
2. ce qui manque réellement pour avancer ;
3. ce que l'IA propose sans l'avoir encore engagé ;
4. quels coûts et prix restent fragiles ;
5. quelle décision prendre ensuite.

Le parcours a quatre phases UI :

| Phase | Objet | Sortie attendue |
|---|---|---|
| **1. Cadrage & documents** | identité AO, échéance, pièces et provenance | dossier suffisamment cadré pour construire le bordereau |
| **2. Bordereau** | arbre vendu, unités et quantités | structure contrôlée et figée explicitement |
| **3. Chiffrage** | déboursé, frais, marge et prix de vente par poste | chaque poste a une origine de coût explicite |
| **4. Décision & devis** | risques, qualité, montants et approbation | décision soumettre/corriger, puis devis versionné |

La phase UI n'est pas un statut métier. Un unique moteur backend produit complétude, anomalies, blocages et prochaine action ; liste, header, phases et synthèse lisent ce même résultat.

---

## Critères d'acceptation gelés

### Cohérence du parcours

**AC-1 — Une anomalie est un fait structuré.** Chaque contrôle retourne `code`, phase, sévérité `BLOCKING | WARNING | INFO`, message, faits observés et action de résolution. Les codes sont stables et testables. Le frontend ne recalcule pas les contrôles.

**AC-2 — Un seul compteur partout.** Le badge de phase, le bandeau, la synthèse et le blocage de transition affichent exactement les mêmes anomalies actives. Une alerte visible ne peut coexister avec un compteur zéro pour le même périmètre.

**AC-3 — Les gates réutilisent les contrôles.** Une transition refusée cite les codes bloquants du moteur. Une transition autorisée ne peut être refusée ensuite par une règle cachée équivalente. Les warnings demandent une décision explicite seulement lorsqu'un AC le prévoit.

**AC-4 — Deux voies documentaires restent possibles.**

- voie **automatique** : un BDP source est requis avant extraction et sa provenance reste liée au brouillon puis au DPGF validé ;
- voie **manuelle** : aucun PDF n'est requis, mais la phase indique clairement « Bordereau saisi manuellement » ;
- le CPS est optionnel par défaut et n'est marqué obligatoire que si la configuration ou le type d'AO le demande ;
- une pièce affichée « obligatoire » absente produit nécessairement un blocage et ne permet pas gain/conversion.

**AC-5 — Les champs structurants sont protégés côté API.** Objet, MOA, chargé d'étude, date limite et type AO respectent les mêmes obligations que le formulaire. Les créations API, imports et scripts QA ne peuvent fabriquer silencieusement un dossier avancé avec `Type AO = —` ou date obligatoire absente.

**AC-6 — La prochaine action est explicite.** Chaque phase expose une action primaire issue du moteur : déposer/choisir la voie, corriger l'arbre, chiffrer le prochain poste, traiter un blocage, demander validation ou générer le devis. À données identiques, liste et détail pointent vers la même action.

**AC-7 — Les statuts terminaux sont honnêtes.** Une étude `GAGNE` ou `CONVERTIE` reste en lecture seule, mais ses pièces, anomalies historiques, hypothèses et sources restent consultables. Elle ne montre aucune action d'écriture qui aboutit à un refus technique.

### Extraction documentaire et assistance IA

**AC-8 — Les états IA ne sont jamais confondus.** Toute extraction/proposition porte un état parmi `QUEUED`, `RUNNING`, `REVIEW`, `NO_RESULT`, `FAILED`, `UNAVAILABLE`, `VALIDATED`, `DISCARDED`. `NO_RESULT` signifie appel réussi sans proposition exploitable ; `FAILED` expose une erreur relançable ; `UNAVAILABLE` propose le chemin manuel.

**AC-9 — Une proposition garde ses entrées.** Elle conserve type de geste, identifiants et empreintes des documents, version du poste/descriptif, sections CPS utilisées, date, fournisseur/modèle technique et version du schéma de sortie. Modifier une entrée rend la proposition « à actualiser » ; elle ne se présente pas comme fraîche.

**AC-10 — Les preuves accompagnent les suggestions.** Une métadonnée extraite cite page/zone ou extrait source. Un composant proposé cite le libellé/descriptif et, si utilisé, la section CPS qui le justifie. Une hypothèse générique sans source est marquée « connaissance métier IA », jamais « issue du CPS ».

**AC-11 — La confiance n'autorise rien.** L'indicateur affiché est `faible | moyenne | élevée`, calculé côté serveur à partir de validité du schéma, présence de source, cohérence unité/type et qualité du rapprochement. La confiance brute déclarée par le modèle est conservée au diagnostic mais ne valide ni champ, ni identité, ni prix.

**AC-12 — Toute sortie IA passe par une revue.** Bordereau, champs du marché, descriptif et composants restent en brouillon. L'utilisateur peut accepter/refuser/corriger chaque champ ou ligne, puis valide explicitement. Une régénération montre les différences et ne remplace pas une correction humaine sans confirmation.

**AC-13 — L'IA n'invente pas les vérités référentielles.** Aucun prix, devise, `itemId`, `cleStable`, fournisseur ou unité inconnue n'est accepté parce que le modèle l'a renvoyé. Identité et prix sont résolus par Catalogue ; unité par le référentiel actif ; l'IA peut seulement proposer un besoin et un rendement.

**AC-14 — L'incertain a une sortie.** Pour chaque match `INCERTAIN`, l'utilisateur peut choisir un candidat avec fiche/source visible, rechercher un autre article, ajouter au poste seulement, ou lancer la création Catalogue. Ignorer exige un motif court si le composant a été sélectionné comme nécessaire. Aucun meilleur score n'est choisi silencieusement.

**AC-15 — Le travail asynchrone est récupérable.** Quitter/recharger la page ne perd ni job ni brouillon serveur. Un seul job actif par document/geste/idempotency key ; relancer un échec ne crée pas deux brouillons. Progression et dernière étape connue sont visibles.

### Création Catalogue depuis Extraire

**AC-16 — Le choix humain reste obligatoire et non ambigu.** Chaque composant absent propose deux actions distinctes : **Ajouter au poste seulement** ou **Créer dans le catalogue et lier**. Le bouton final n'ajoute pas implicitement au poste tous les manquants non tranchés.

**AC-17 — La création respecte l'identité 1–1.** Avant création, Catalogue résout la `cleStable` : identité Sektor existante → créer/réutiliser seulement l'Item tenant ; identité absente → publier Sektor puis créer l'Item. Un retry ou double clic réutilise le même résultat. Tiny spec, couleur, RAL ou marque équivalente restent sur l'emploi DPU, jamais dans une nouvelle identité.

**AC-18 — Item et tarif ont un résultat transactionnel explicite.** La commande Catalogue accepte :

- **créer avec tarif** : prix strictement positif, devise, type et date d'effet obligatoires ; Item + `ItemPrice` réussissent ensemble ou aucun des deux n'est annoncé créé ;
- **créer sans tarif** : choix explicite, Item créé `à compléter`, aucun faux `TARIF`.

Une exception silencieuse est interdite. Le résultat retourne `created/reused`, identifiants, tarif réellement persisté et sa source.

**AC-19 — Le rattachement DPU est récupérable.** Après succès Catalogue, Études rattache le composant avec `referenceType = ITEM`, `itemId`, rendement et snapshot du tarif réel. Si cette seconde écriture échoue, l'UI dit « article créé, non rattaché » et offre **Rattacher maintenant** avec la même clé d'idempotence ; elle ne recrée rien.

**AC-20 — La publication est autorisée et auditée.** La permission backend dédiée contrôle la création depuis Études. L'audit porte acteur, étude/poste, proposition IA, identité créée ou réutilisée et tarif. L'absence de permission laisse toujours « Ajouter au poste seulement » disponible.

### Chiffrage et décision

**AC-21 — L'étape s'appelle Chiffrage.** Dans l'arbre, les colonnes distinguent `Déboursé unitaire`, `Prix de vente unitaire HT` et `Total vente HT`. Un libellé `PU HT` seul est interdit. Lot/sous-lot remontent coûts et vente séparément.

**AC-22 — Un poste explique son prix.** Le drawer montre dans l'ordre : contexte/descriptif, origine du coût, composants, déboursé, frais généraux, marge, prix de vente unitaire et total. Le « prix visé » est nommé comme tel, éditable avec sa provenance, et ne peut être confondu avec le total courant.

**AC-23 — Une action par intention.** À l'état vide, un seul CTA primaire **Proposer avec l'IA**, puis les alternatives Catalogue et Manuel. Les mêmes boutons ne sont pas répétés dans l'en-tête et le corps. Après proposition, l'écran bascule en revue plutôt que d'empiler un deuxième dialogue sans contexte.

**AC-24 — Les modifications ont un statut clair.** `Enregistré`, `Modifications non enregistrées`, `Enregistrement…`, `Erreur` reflètent la réalité. Fermer avec du brouillon demande conserver/abandonner ; une autosauvegarde réussie met à jour arbre, synthèse et anomalies sans rechargement.

**AC-25 — La synthèse est une décision, pas un rapport passif.** Elle affiche : complétude et bloqueurs, vente HT, déboursé établi, marge, part estimée/forfait/décomposée, pièces et provenance, composants libres/incertains, couverture consultation, puis l'action recommandée. Chaque risque ouvre directement son poste ou sa phase.

**AC-26 — Les warnings commerciaux sont assumés.** Coûts non établis, marge sous seuil tenant, absence de consultation obligatoire ou écart avec estimation MOA ne disparaissent pas à la génération du devis. Les warnings non bloquants acceptés gardent acteur, date et motif.

**AC-27 — La capitalisation reste après validation et opt-in.** La synthèse indique le nombre de postes capitalisables et propose l'accès au geste Ouvrage après validation. Aucun article « poste » n'est créé et aucune capitalisation n'a lieu automatiquement.

### Portefeuille et responsive

**AC-28 — Une seule table, une seule pagination.** La liste possède une pagination serveur unique, en français, avec taille et total cohérents. Recherche et filtres agissent sur le même dataset avant pagination ; aucun second paginator Material n'est rendu.

**AC-29 — La recherche et les filtres sont vérifiables.** Recherche serveur sur numéro, objet et MOA/client avec debounce ; filtres statut, phase, chargé d'étude, type AO, échéance dépassée et anomalie bloquante. Le résultat, le compteur et l'URL reflètent les critères ; Réinitialiser les efface réellement.

**AC-30 — La liste montre la décision utile.** Colonnes desktop : numéro/objet, MOA ou client, type AO, échéance avec retard, phase/statut, qualité du chiffrage, alerte principale et prochaine action. `—` n'est utilisé que pour une absence autorisée et expliquée.

**AC-31 — Mobile devient une liste de cartes.** À 390 px, aucune table de 1260 px à balayer. Chaque carte montre identité, échéance, phase/statut, alerte et action. Filtres en drawer, CTA Nouveau accessible, cibles tactiles ≥ 44 px.

**AC-32 — Le détail reste utilisable au clavier et sur mobile.** Les quatre phases deviennent un stepper compact/scrollable ; drawer poste plein écran sous 720 px ; dialogues de revue n'excèdent pas le viewport ; focus initial, retour de focus, Échap et libellés accessibles sont prouvés.

---

## Hors périmètre

- Refaire l'objet Consultation Achats, déjà porté par le lot `consultation` ; ce lot consomme seulement sa couverture.
- Créer un chatbot général dans Études. L'IA reste attachée à des gestes métier bornés.
- Modifier le contrat Étude–Devis–Chantier porté par `chantiers/continuite-etude-devis-chantier`.
- Auto-capitaliser des ouvrages, générer automatiquement un devis ou choisir automatiquement un match incertain.
- Console éditoriale G2, variantes d'achat/stock et reprise douce de données historiques.

---

## Scénarios de preuve Mode B

Le graphe est créé par API dans `qa-local`. Les fichiers tests couvrent un tableur propre, un PDF texte, un PDF scanné, un CPS et un document sans bordereau.

| Scénario | Point discriminant | Couvre |
|---|---|---|
| `etude-voie-manuelle-sans-pdf` | aucun document, mention manuelle explicite | AC-1 à AC-6 |
| `etude-voie-auto-bdp-revue-puis-validation` | brouillon corrigé avant DPGF | AC-4, AC-8 à AC-12, AC-15 |
| `etude-ia-no-result-failed-unavailable` | trois réponses distinctes, fallback manuel | AC-8, AC-15 |
| `etude-ia-provenance-et-regeneration` | modification du descriptif après proposition | AC-9 à AC-12 |
| `etude-extraire-incertain-resolu` | deux identités candidates, choix humain | AC-13, AC-14 |
| `etude-extraire-creer-catalogue-avec-tarif` | identité absente puis double clic/retry | AC-16 à AC-20 |
| `etude-extraire-tarif-echoue-sans-mensonge` | échec ItemPrice contrôlé | AC-18, AC-19 |
| `etude-chiffrage-cout-vente-sans-ambiguite` | coût 582 600, vente 737 106, marge 154 506 | AC-21 à AC-24 |
| `etude-synthese-risques-actionnables` | 26 % estimé, composants libres, consultation partielle | AC-25 à AC-27 |
| `etude-liste-recherche-pagination-unique` | au moins 33 dossiers et recherche `DE-0002` | AC-28 à AC-30 |
| `etude-mobile-390` | liste, détail, drawer et revue IA | AC-31, AC-32 |
| `etude-gate-api-egale-ui` | tentative API avec pièce obligatoire absente | AC-2, AC-3, AC-5 |

