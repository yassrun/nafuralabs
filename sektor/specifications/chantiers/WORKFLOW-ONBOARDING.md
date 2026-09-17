# Chantier — onboarding et cycle de vie

Date : 15 septembre 2026. Proposition UX et fonctionnelle issue du brainstorming et de la lecture du code. Ce document prépare l'implémentation ; il ne décrit pas une fonctionnalité déjà livrée.

## 1. Décision de parcours

Le point d'entrée principal est **Chantiers → Nouveau chantier → Choisir l'étude**.
L'utilisateur prépare puis suit le cycle de vie dans une même fiche à stepper, selon le modèle des études. Le cockpit conserve sa fonction de pilotage quotidien ; sa refonte est hors de ce cadrage.

Depuis l'étude, « Créer le chantier » devient « Préparer un chantier » et ouvre ce même parcours avec l'étude présélectionnée. Ouvrir le parcours ou sélectionner une étude ne crée pas de chantier. Si un chantier est déjà lié, proposer « Ouvrir le chantier ».

Hypothèse de cette version : un chantier issu d'une étude validée, avec une seule conversion par étude, conformément au chaînage actuel. La création sans étude et les conversions partielles ne font pas partie de ce parcours.

## 2. Les trois états à ne pas confondre

- **Étape affichée** : endroit où l'utilisateur consulte ou travaille.
- **Complétude** : éléments renseignés, manquants ou à vérifier dans cette étape.
- **Statut métier** : situation officielle de la fiche, modifiée par une action autorisée.

Cliquer « Suivant », consulter une étape passée ou compléter un formulaire ne change pas le statut métier. La barre d'actions de l'en-tête porte les décisions, comme dans l'étude.

## 3. Stepper permanent

**Préparation → Démarrage → Exécution → Réception provisoire → Réception définitive → Garanties & clôture**

Six étapes visibles sur desktop. Sur petit écran : étape courante, précédent/suivant et menu des étapes. Les étapes futures restent consultables pour comprendre les prérequis ; leurs décisions sont indisponibles tant que les conditions ne sont pas remplies.

La préparation contient des sections, sans second stepper horizontal : **Étude source, Dossier chantier, Périmètre et budget, Responsables, Vérification**. Une liste de complétude donne accès directement aux sections à corriger.

Une coche de jalon signifie que le jalon a été validé, pas que l'utilisateur a visité l'écran. La dernière étape peut rester à suivre après clôture si des garanties sont encore actives.

## 4. Préparation, écran par écran

### A. Choisir l'étude source

- Recherche par référence, objet ou client ; filtres de statut.
- Résultats : référence, objet, client, statut d'étude, devis associé et chantier éventuellement lié.
- Sélection : aperçu du périmètre, du montant de vente HT, du déboursé initial, de la marge et de la version commerciale source.
- Les études non éligibles expliquent pourquoi : validation définitive absente, devis non conforme aux conditions de conversion, incohérence commerciale ou chantier déjà créé.
- Action « Utiliser cette étude » : préremplit le dossier sans créer d'enregistrement.
- En cas d'erreur de chargement : conserver la sélection, afficher l'erreur et proposer de réessayer.

L'éligibilité vient du serveur. Réutiliser les conditions de conversion existantes : étude `FINAL_APPROVED`, client, complétude, devis requis et cohérence des montants. Ne pas reconstruire une règle concurrente dans l'interface.

### B. Dossier chantier

Informations préremplies et vérifiables : nom, client, localisation, référence commerciale. Compléments : adresse, ville, nature du marché, intervenants et dates prévisionnelles.

Le montant commercial ne devient pas un budget libre modifiable. La référence de devis reste distincte de la référence du marché. Sélectionner une étude ne vaut pas notification d'un marché.

Après sélection d'une étude éligible et saisie du nom : **« Enregistrer la préparation »** crée la fiche en `EN_PREPARATION`, lie l'étude et conserve les données sources. Les informations d'équipe, l'OS et les pièces futures ne bloquent pas cette sauvegarde.

Avant cette première sauvegarde, changer d'étude actualise l'aperçu ; prévenir si des données saisies vont être remplacées. Après sauvegarde, la source est verrouillée : pas de remplacement silencieux de l'étude ou du budget initial.

### C. Périmètre et budget initial

- Présenter l'arbre de lots/postes repris de l'étude et les éventuels placements à résoudre.
- Afficher séparément vente HT, déboursé initial et marge initiale.
- Conserver la référence et la version du devis source ainsi qu'une copie figée des montants initiaux.
- Les évolutions ultérieures de l'étude ne réécrivent pas le chantier automatiquement.
- Présenter les pièces reprises et celles à compléter ; ne pas obliger à téléverser à nouveau un document déjà disponible.

### D. Responsables et conditions contractuelles

- Affecter conducteur de travaux et chef de chantier ; ingénieur et autres rôles selon besoin.
- Renseigner les dates prévisionnelles cohérentes. Le planning détaillé reste hors des prérequis de démarrage actuels.
- Recenser les garanties applicables et leurs pièces disponibles, avec « À constituer » si nécessaire.
- Les valeurs de retenue, avance et garanties doivent provenir du dossier ou d'une saisie explicite ; ne pas présenter une valeur arbitraire comme une condition acquise.

### E. Vérification de préparation

Récapitulatif avec compteurs « À compléter », « À vérifier » et « Conforme » ; chaque blocage ouvre le champ ou le document concerné.

Action principale : **« Valider la préparation »**. Conditions proposées : source et référence commerciale cohérentes, client, identité/localisation, périmètre exploitable, budget initial, responsables requis et dates prévisionnelles. Les pièces contractuelles supplémentaires dépendent du paramétrage applicable.

Résultat : statut `PRET_A_DEMARRER`, libellé **Prêt à démarrer** ; ouverture de l'étape Démarrage. L'absence d'OS ne bloque pas cette validation.

## 5. Démarrage par ordre de service

La fiche affiche « Préparation validée — en attente du démarrage par OS ».

Formulaire OS : référence, date du document, date de notification si applicable, date d'effet, pièce jointe et commentaire. La référence et la date d'effet sont déjà requises par le serveur ; les exigences documentaires supplémentaires sont à configurer.

- **Enregistrer l'OS** conserve le document et ne démarre pas prématurément les travaux.
- Date d'effet future : garder `PRET_A_DEMARRER`, afficher « Démarrage prévu le … ».
- À partir de la date d'effet : action **« Démarrer le chantier »**, avec contrôle serveur des prérequis et des droits.
- Proposition V1 : déclenchement explicite par une personne autorisée ; aucun démarrage automatique à minuit.
- Date d'effet passée : conserver la date métier et horodater séparément l'enregistrement ; demander le motif de saisie tardive.

La transition vers `EN_COURS` enregistre l'OS, l'acteur et les dates dans l'historique. Recontrôler la préparation au démarrage, même si elle a déjà été validée.

Si une correction de préparation est nécessaire avant le démarrage : action « Reprendre la préparation », motivée et historisée, vers `EN_PREPARATION`. L'OS déjà enregistré reste conservé et doit être revérifié.

## 6. Exécution — périmètre du workflow

Cette étape contient le résumé de situation, le démarrage enregistré, les arrêts/reprises et la prochaine échéance. Une action « Ouvrir le cockpit » donne accès à l'espace existant.

Actions de cycle de vie :

- **Suspendre** : motif, date d'effet et document associé si applicable ; `EN_COURS → SUSPENDU`.
- **Reprendre** : date, référence/document de reprise si applicable ; `SUSPENDU → EN_COURS`.
- **Déclarer les travaux terminés** : date de fin effective et éléments justificatifs ; `EN_COURS → EN_ATTENTE_RECEPTION_PROVISOIRE`.

« Suspendu » apparaît sur l'étape Exécution, sans ajouter une étape au stepper. La suspension ne décale pas les échéances contractuelles automatiquement.

## 7. Réception provisoire

Préparer la réception : date prévue, participants, documents requis. Enregistrer le résultat avec la date effective et le PV.

Action **« Enregistrer la réception provisoire »** : choisir explicitement « Sans réserves » ou « Avec réserves ». Dans les deux cas, le statut devient `RECEPTIONNE_PROVISOIRE` une fois le PV validé dans l'application par une personne autorisée.

Si la réception n'est pas prononcée, conserver le statut d'attente et enregistrer le résultat. Si de nouveaux travaux sont nécessaires, une action motivée « Reprendre les travaux » permet le retour à `EN_COURS` et conserve l'historique.

Chaque réserve possède : description, localisation/lot, responsable, échéance, preuves et statut **Ouverte → Traitée, à vérifier → Levée**. Une réserve non conforme peut être renvoyée à Ouverte avec motif.

Afficher « Réceptionné provisoirement · 4 réserves ouvertes ». Traiter une réserve ne la lève pas automatiquement. Lever la dernière réserve ne prononce pas la réception définitive.

## 8. Réception définitive

Afficher le PV provisoire, les réserves et leur validation, les pièces attendues et la date d'éligibilité si une règle contractuelle est renseignée.

Action **« Enregistrer la réception définitive »** : date effective, référence et PV ; passage à `RECEPTIONNE_DEFINITIF` après vérification des conditions applicables.

Proposition par défaut : aucune réserve ouverte et pièces requises présentes. Les éventuelles exceptions doivent être définies explicitement dans le cadre contractuel ; elles ne sont pas un bouton de contournement libre.

L'interface ne présume aucun délai légal universel entre les deux réceptions. Les dates, conditions et types de garanties restent des paramètres du marché à préciser.

## 9. Garanties & clôture

L'étape finale comporte deux sections indépendantes.

**Clôture du dossier** : pièces finales, bilan administratif/financier, obligations restantes et action « Clôturer le chantier ». Les points bloquants sont nommés et rattachés aux conditions du dossier.

**Garanties** : registre accessible dès la préparation et toujours accessible après clôture. Pour chaque garantie : type, bénéficiaire/organisme, montant si applicable, référence, pièce, dates, conditions de libération et responsable de suivi.

Deux suivis adaptés :

- Caution/retenue : À constituer → Active → Libération à demander → Libération demandée → Libérée.
- Couverture à durée : À renseigner → Active → Expirée, avec suivi séparé des demandes ou incidents ouverts.

Ne jamais assimiler automatiquement une date d'expiration à une libération obtenue. Ne pas effacer une demande ouverte lorsque la garantie expire.

La clôture du chantier ne ferme pas les garanties. Exemple : **Clôturé · 2 garanties actives · 1 libération à demander**. Les alertes et actions autorisées sur ces garanties continuent sur les chantiers clôturés.

## 10. Matrice des statuts et actions

| Statut | Étape de référence | Action principale | Résultat |
|---|---|---|---|
| En préparation | Préparation | Valider la préparation | Prêt à démarrer |
| Prêt à démarrer | Démarrage | Enregistrer l'OS, puis démarrer lorsque permis | En cours |
| En cours | Exécution | Déclarer les travaux terminés | En attente de réception provisoire |
| Suspendu | Exécution | Reprendre | En cours |
| En attente de réception provisoire | Réception provisoire | Enregistrer la réception provisoire | Réceptionné provisoirement |
| Réceptionné provisoirement | Réception définitive | Enregistrer la réception définitive | Réceptionné définitivement |
| Réceptionné définitivement | Garanties & clôture | Clôturer le chantier | Clôturé |
| Clôturé | Garanties & clôture | Suivre les garanties restantes | Statut chantier inchangé |
| Annulé | Étape d'abandon conservée | Consulter le motif et les obligations restantes | Terminal pour le chantier |

L'annulation est proposée avant démarrage, avec motif et droits dédiés. Après démarrage, une fin anticipée nécessite un traitement contractuel à cadrer ; ne pas offrir une annulation générique qui contourne réceptions et obligations.

## 11. Comportements UX repris de l'étude

- En-tête stable : référence, nom, client, étude liée, statut, enregistrement et action principale.
- Réutiliser `nf-wizard-shell` pour les étapes et `StatusActionBarConfig` pour les transitions.
- Les actions disponibles et les contrôles de complétude viennent du serveur. Une liste absente ou en erreur ne doit pas autoriser toutes les actions.
- Expliquer les blocages et donner un accès direct à leur résolution ; distinguer blocage métier et droit insuffisant.
- « Enregistrer » et « Suivant » sauvegardent/naviguent ; seules les actions métier valident un jalon.
- Sauvegarde partielle possible pendant la préparation ; indicateurs Enregistrement / Enregistré / Échec, sans perdre les saisies en erreur.
- Lorsqu'un autre utilisateur a modifié la fiche, actualiser les actions et prévenir avant d'écraser une modification concurrente.
- Chaque transition conserve ancien/nouveau statut, acteur, date de saisie, date d'effet, motif et pièces.
- Une fiche consultée reste sur l'étape choisie ; aucun changement de statut provoqué par la navigation.
- Le listing propose « Reprendre la préparation », « Enregistrer l'OS », « Préparer la réception » ou « Suivre les garanties » selon la situation.

## 12. Appuis existants et écarts à implémenter

Constats vérifiés dans le code :

- `sources/web/app/etudes/dossiers/dossier-detail/dossier-detail.page.html` : stepper partagé, navigation et affichage des contrôles.
- `sources/web/app/etudes/dossiers/config/dossier-etude.workflow.ts` : statuts, transitions, commandes et accès.
- `sources/web/app/chantiers/create/chantier-create.page.ts` : assistant actuel en cinq écrans, statut sélectionnable et sauvegarde « brouillon » conditionnée à toute la validation ; à remplacer par la préparation décrite ici.
- `sources/backend/etudes/src/main/java/ma/nafura/etudes/service/DossierEtudeService.java` : conversion verrouillée, retour du chantier déjà lié, contrôles commerciaux et copie initiale. Réutiliser ces garanties depuis le nouveau point d'entrée ; ne pas dupliquer la conversion côté navigateur.
- `sources/backend/chantiers/src/main/java/ma/nafura/chantiers/service/ChantierService.java` : OS et checklist de préparation existants. Actuellement, la commande passe directement de préparation à en cours sans différer le démarrage d'un OS futur. Les réceptions changent le statut ; compléter leurs commandes avec les PV, dates et contrôles décrits.

Écarts principaux : statuts `PRET_A_DEMARRER`, `EN_ATTENTE_RECEPTION_PROVISOIRE`, `ANNULE` ; préparation partielle ; OS enregistré séparément du démarrage ; gestion documentée des réceptions/réserves ; registre des garanties et accès après clôture.

Conserver les codes existants `RECEPTIONNE_DEFINITIF` et `CLOS`, en affichant les libellés français retenus. Ne pas transformer les chantiers existants à partir de simples suppositions : prévoir une reprise des données qui signale les preuves manquantes.

## 13. Scénarios d'acceptation pour l'implémentation

1. Ouvrir Nouveau chantier et sélectionner une étude ne crée aucune fiche.
2. Une étude non éligible expose un motif ; le serveur refuse aussi la conversion directe.
3. Enregistrer avec une source valide et un nom conserve une préparation sans exiger équipe complète ni OS.
4. Deux créations concurrentes depuis la même étude donnent un seul chantier lié.
5. Une évolution de l'étude ne modifie pas les montants initiaux du chantier enregistré.
6. Suivant et navigation dans le stepper ne changent jamais le statut métier.
7. La validation de préparation explique chaque blocage et reste distincte du démarrage.
8. Un OS futur reste enregistré sans passage anticipé à En cours.
9. Un démarrage non autorisé ou incomplet est refusé côté serveur sans écriture partielle.
10. Suspension et reprise conservent documents, motifs et dates.
11. Une réception provisoire avec réserves crée des réserves suivies individuellement ; leur levée n'enregistre pas de réception définitive.
12. La réception définitive conserve son PV et ses dates et vérifie les conditions configurées.
13. Clôturer laisse les garanties actives visibles, modifiables selon les droits et couvertes par les alertes.
14. Une erreur de sauvegarde n'affiche pas Enregistré et conserve les données saisies.

## 14. Points métier à préciser avant de figer les règles contractuelles

- Marchés privés, publics ou les deux ; règles applicables par type de marché.
- Pièces obligatoires pour chaque décision et personnes habilitées à les enregistrer/valider.
- Types de garanties, conditions et dates de libération ; critères financiers de clôture.
- Traitement d'une fin anticipée après démarrage.

Ces choix précisent les contrôles ; ils ne changent pas l'organisation UX proposée.
