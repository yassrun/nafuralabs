# 03 - Roadmap de concrétisation

Cette roadmap est séquencée pour rendre chaque règle exécutable avant de déplacer largement le code. Les travaux se réalisent dans les projets concernés et leurs `sources/`; ce dossier ne crée pas de programme Raster transverse.

## Tranche 0 - Baseline et garde-fous

**But :** rendre les frontières observables sans changement d'architecture massif.

- Inventorier les modules réellement consommés de `nafura-platform` et de Sektor.
- Définir les identifiants canoniques `platform.*`, `cap.*`, `bc.*`, `app.*`.
- Ajouter des tests de dépendances backend et web qui interdisent les imports vers les internes.
- Produire un premier graphe de dépendances dans la CI.

**Preuve :** le build échoue sur un import illégal et produit le graphe actuel.

## Tranche 1 - Foundations stabilisées

**But :** retirer des foundations tout élément spécifique à un vertical.

- Isoler identité, tenant, authorization/policy, configuration, i18n, audit, observabilité, design system et shell.
- Déplacer les rôles BTP, les libellés ERP et les seeds BTP vers Sektor ou une capability explicitement spécialisée.
- Normaliser l'instrumentation avec les attributs Nafura.

**Preuve :** Sektor reste exécutable après retrait du vocabulaire BTP des foundations.

## Tranche 2 - Capabilities contractuelles

**But :** rendre les capacités partagées réellement consommables.

- Démarrer par documents/fichiers, notifications, puis workflow/approbation.
- Pour chaque capability : `api`, `internal`, manifest, permissions et pack i18n namespacé.
- Remplacer les couplages directs par contrat, événement ou SPI.

**Preuve :** une application de démonstration peut composer la capability sans importer les internes Sektor.

## Tranche 3 - Composition application et tenant

**But :** matérialiser les deux décisions séparées.

- Ajouter les manifests d'application et leur validation au build.
- Ajouter le registre de packs i18n qui compose platform, capabilities, BC et application.
- Modéliser les entitlements tenant indépendamment de la composition technique.
- Mapper rôles tenant vers permissions de module.

**Preuve :** une capacité absente de l'application est rejetée au build; une capacité présente mais non activée est refusée au runtime.

## Tranche 4 - Generalisation des surfaces UI

**But :** faire des patterns Anatomy les consommateurs naturels des contrats.

- Intégrer `nf-tree-select` au modèle de filtres, aux chips et au contrat de requête backend.
- Généraliser les détails master/slaves via `nf-entity-detail` et des configurations déclaratives.
- Compléter la migration Lucide dans les composants partagés.

**Preuve :** les démonstrations Showroom, les tests ciblés et une application consommatrice couvrent les contrats publics.

## Tranche 5 - Extraction seulement si justifiée

Une capability ne devient un service séparé que si tous ces critères sont observés : besoin de déploiement indépendant, montée en charge distincte, frontière de données claire, contrat stable, ownership opérationnel et preuves de compatibilité. Sans ces critères, elle reste un module du monolithe.

## Règles d'exécution pour les agents

1. Choisir une seule tranche et une seule frontière à la fois.
2. Chercher d'abord le propriétaire réel de l'API ou des données à modifier.
3. Ajouter le contrat et sa preuve avant de faire migrer les consommateurs.
4. Ne pas déplacer du code pour simuler une frontière : interdire l'accès aux internes et vérifier le graphe.
5. Ne pas mélanger cette roadmap avec des migrations de dossiers non liées.
