# Planning unifié Sektor — dossier de conception

Atelier du 8 septembre 2026 · version 0.1.

## Livrables

- [Spécification détaillée](SPECIFICATION.md) : décisions acquises, audit de l'existant, règles métier, calculs, vues, droits, parcours UX, modèle de données, migration, 31 critères de recette et arbitrages.
- [Maquette navigable](prototype.html) : ouvrir dans un navigateur ; aucune installation nécessaire. Six vues, données fictives, aucun appel au backend.
- [Aperçu exécution](previews/execution.png), [semaine](previews/semaine.png), [publication client](previews/client.png), [semaine sur mobile](previews/mobile-semaine.png).
- [Dates, prédécesseurs, liaisons et chemin critique](previews/chemin-critique.png) : activer « Chemin critique » dans la vue Exécution ; valeurs illustratives explicitement identifiées.
- [Panneau Affichage](previews/affichage.png) : choix des colonnes, repères, chronologie et catégories de lignes.
- [Rapport de vérification](previews/verification.json).

## Parcours de revue conseillé

1. **Exécution** : filtrer Travaux, enregistrer la vue puis la retrouver ; ouvrir une activité.
2. **Client** : choisir les éléments ; figer la publication R03.
3. **Exécution** : ouvrir Bétonnage → Simuler un décalage → renseigner un motif → Appliquer à la maquette. Le scénario est illustratif, pas un calcul réel du réseau.
4. **Client** : constater que R03 conserve le contenu et les dates précédents.
5. **Ma semaine** : Préparer la semaine → répartir une activité existante. Un créneau hors de sa fenêtre est refusé dans ce parcours illustré.
6. **Calendrier chantier** : activer le samedi ; constater l'ouverture du jour dans Ma semaine. Les anciennes réservations ne sont pas recalculées par cette maquette.
7. **Financier** : ouvrir la situation n° 03 et distinguer montant, règlement partiel, solde et dates.
8. **Ressources** : examiner le conflit de grue et le parcours d'arbitrage.

Les réglages sont conservés uniquement pendant la session de page. Recharger réinitialise la démonstration. Les rôles, données ERP, réservations et exports PDF réels ne sont pas implémentés dans ce prototype. La navigation globale latérale sert uniquement de contexte visuel.

## Vérification effectuée

52 assertions d'interaction/affichage réussies avec Playwright et Microsoft Edge sans interface graphique. Aucune erreur JavaScript capturée. Les six vues ont été contrôlées à 1024 et 390 px pour le débordement de page ; captures également produites à 1440 px et examinées visuellement. Ces vérifications concernent le prototype, pas l'application Sektor ni le futur moteur de planning.

Rejouer depuis la racine du workspace :

```powershell
node sektor/specifications/planning-unifie/verify-prototype.mjs
```

Le script utilise les dépendances Playwright déjà présentes dans `sektor/sources/web`, Edge installé sur la machine et un serveur temporaire sur l'interface locale, fermé à la fin. Il ne contacte pas l'ERP.

## Périmètre des changements

Ce dossier contient uniquement la conception, la maquette et sa vérification. Aucun fichier de l'application, aucune migration et aucune donnée métier n'ont été modifiés pour cette livraison. Les fichiers déjà en cours de modification dans le workspace sont préservés.

La section 19 de la spécification regroupe les règles proposées à confirmer en atelier ; elle évite de présenter comme décidés le circuit de validation hebdomadaire, l'auto-approbation, les reports ou la pondération globale.
