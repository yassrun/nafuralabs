# Onboarding chantier — état de livraison

## Implémenté

- `/chantiers/new` propose le choix d'une étude et reprend la conversion existante, ses contrôles commerciaux, son verrou anti-doublon et le placement des postes orphelins.
- L'action de l'étude ouvre cette page avec l'étude présélectionnée.
- `/chantiers/:id/workflow` expose les six étapes, la préparation persistante, les actions de statut, les justificatifs, les réserves et les garanties.
- En-tête et stepper reposent sur les composants partagés de l'étude. Les étapes consultées ne valent pas validation.
- Les OS futurs sont enregistrables sans démarrer. Le démarrage est explicite, soumis aux contrôles serveur et à la date d'effet.
- Les PV de réception sont rattachés à des documents du chantier. La réception définitive exige des réserves levées et un événement de réception provisoire documenté.
- La clôture conserve les garanties, leur suivi et les alertes d'échéance dans la fiche.
- Les modifications du workflow utilisent un verrou tenant/chantier et une révision pour détecter les mises à jour concurrentes.
- Les actions existantes du cockpit renvoient vers le cycle de vie ; son pilotage quotidien n'est pas refondu.
- Le listing affiche les statuts détaillés et ouvre le workflow hors exécution.

## Vérifications effectuées

- Compilation Angular complète via le serveur de développement `cursor` : réussie. Un avertissement préexistant concerne un import RouterLink inutilisé dans la liste d'attachements.
- Compilation Java ciblée des classes modifiées avec JDK 21 et les dépendances du dépôt : réussie.
- `ChantierWorkflowServiceTest` : 12 tests exécutés, 12 réussis, dont réception complète, refus d'OS futur, réserves bloquantes, cloisonnement des documents, droits, conflit de révision et garanties après clôture.
- `node sektor/e2e/scripts/verify-chantier-workflow-unit.mjs` : 9 contrôles réussis.
- `node sektor/e2e/scripts/verify-chantier-workflow-ui.mjs` : navigateur Chromium, APIs simulées. Choix d'étude sans création, création explicite unique, navigation sans transition, coches de jalons, hauteur du formulaire et absence de débordement mobile vérifiés.
- Captures ordinateur/mobile inspectées ; la compression initiale du formulaire par le conteneur du stepper a été corrigée.

## Activation serveur et limites de validation

Migration ajoutée : `chantiers/src/main/resources/db/changelog/schema/v1.18/001_chantier_workflow.sql` (données et révision du workflow). Elle doit être appliquée avant de démarrer le backend modifié, via le processus lifecycle habituel.

Le lancement Mode B n'a pas abouti sur cette machine : `make` absent dans Git Bash. Gradle échoue sur une connexion loopback ; les tests Java ont donc été exécutés avec JUnit Platform après compilation ciblée, sans Gradle.

Aucune migration n'a été appliquée sur une base réelle et aucun déploiement n'a été effectué. Les tests navigateur utilisent des données simulées : ils ne constituent pas une validation de bout en bout sur la base métier.

## Cadre fonctionnel

Les conditions contractuelles variables (délais légaux, matrice des signataires, exigences particulières de libération) ne sont pas présumées universelles. La version fournit le registre, les pièces et les décisions explicites. La clôture administrative/financière est confirmée par une note ; elle n'effectue pas un rapprochement comptable automatique.

Les anciennes réceptions dépourvues de pièces historiques ne sont pas converties silencieusement en événements documentés. Leur reprise de données reste à organiser avant de poursuivre ce nouveau parcours jusqu'à la réception définitive.

Les alertes de garantie sont affichées dans la fiche ; aucune notification périodique externe n'est créée.
