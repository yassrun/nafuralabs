# Architecture modulaire Nafura

Ce dossier est le canon de la modularisation de la plateforme Nafura. Il guide les agents et les équipes qui concrétisent la vision sans créer un nouveau runtime de plugins, ni placer du métier dans `nafura-platform/`.

## Documents

1. [01 - Modèle cible](01-target-model.md) : frontières, responsabilités et règles de dépendance.
2. [02 - Contrats et manifests](02-contracts-and-manifests.md) : modèle déclaratif, permissions, i18n et composition.
3. [03 - Roadmap de concrétisation](03-delivery-roadmap.md) : tranches d'implémentation, preuves attendues et ordre de migration.

## Décision figée

Nafura progresse comme un **monolithe modulaire contract-first** : les packages sont composés statiquement à la compilation et au déploiement, tandis que les applications et tenants choisissent les capacités autorisées par configuration.

Il n'y a pas de micro-frontend, de chargement de code dynamique ou de registre de plugins à implémenter dans cette phase. Une capacité pourra être extraite plus tard seulement si son autonomie opérationnelle est démontrée.

## Principes directeurs

- Le métier reste dans son projet pair, par exemple `sektor/`, jamais dans `nafura-platform/`.
- Une dépendance cible un contrat de capacité stable, pas les internes d'un autre module.
- Les rôles sont propres au tenant. Les permissions sont déclarées et possédées par les modules.
- Les traductions sont propres à leur module et utilisent un namespace réservé.
- Chaque tranche préserve ou ajoute une preuve exécutable ciblée.

## Références de conception

- [Spring Modulith - Application Modules](https://docs.spring.io/spring-modulith/reference/fundamentals.html) pour les frontières vérifiables et les interfaces nommées.
- [OSGi - Capability and Requirement model](https://docs.osgi.org/specification/osgi.core/8.0.0/framework.module.html) pour `provides` / `requires`, les contraintes et le versioning, sans adopter son runtime.
- [Backstage - Descriptor Format](https://backstage.io/docs/features/software-catalog/descriptor-format) pour les manifests versionnés, l'identité stable et l'ownership.
- [OpenTelemetry - Traces](https://opentelemetry.io/docs/concepts/signals/traces/) pour les attributs de contexte transverses.
