# 02 - Contrats et manifests

## Deux décisions séparées

| Décision | Porteur | Moment | Contenu |
|---|---|---|---|
| Composition technique | application | build et déploiement | modules, versions, dépendances satisfaites |
| Entitlement et accès | tenant | administration runtime | capacités activées, options, rôles vers permissions |

Un tenant n'ajoute jamais une dépendance de code. Une application ne redéfinit jamais une permission appartenant à un module.

## Schéma de manifeste

Le premier format est TypeScript, validé en CI. Une projection JSON ou YAML peut venir plus tard pour les outils de catalogue, sans changer le modèle.

```ts
export type NafuraManifest = {
  apiVersion: 'nafura.io/v1';
  kind: 'foundation' | 'capability' | 'business-context' | 'application';
  metadata: {
    id: string;
    version: `${number}.${number}.${number}`;
    owner: string;
    lifecycle: 'experimental' | 'production' | 'deprecated';
    labels?: Record<string, string>;
  };
  spec: {
    provides?: CapabilityContract[];
    requires?: CapabilityRequirement[];
    permissions?: PermissionDeclaration[];
    i18n?: { namespace: string; locales: string[] };
  };
};

export type CapabilityRequirement = {
  id: string;
  version: `^${number}.${number}.${number}`;
  optional?: boolean;
};
```

Le resolver de CI doit refuser : identifiants dupliqués, cycles, dépendances obligatoires absentes et incompatibilités de version majeure. Les contraintes de version sont des contrats de consommation, non une promesse de mise à jour automatique.

## Exemples

```ts
export const sektorManifest: NafuraManifest = {
  apiVersion: 'nafura.io/v1',
  kind: 'business-context',
  metadata: {
    id: 'bc.sektor',
    version: '1.0.0',
    owner: 'sektor',
    lifecycle: 'production',
  },
  spec: {
    requires: [
      { id: 'cap.documents', version: '^1.0.0' },
      { id: 'cap.approval', version: '^1.0.0', optional: true },
    ],
    permissions: [
      { id: 'sektor.chantier.read' },
      { id: 'sektor.chantier.write' },
    ],
    i18n: { namespace: 'bc.sektor', locales: ['fr', 'en'] },
  },
};
```

## Permissions et rôles

Une permission est atomique, namespacée et déclarée par le module qui effectue le contrôle. Exemple : `documents.template.write` appartient à `cap.documents`; `sektor.chantier.write` appartient à `bc.sektor`.

Le tenant définit les rôles et leurs affectations :

```text
role "conducteur-travaux" -> sektor.chantier.read, sektor.chantier.write
role "lecteur-documents" -> documents.file.read
```

Les rôles BTP ne sont donc pas exportés dans la plateforme. Le contrôle backend reste la source d'autorité; le frontend ne fait que masquer ou désactiver des actions pour améliorer l'expérience.

## I18n : ownership et composition

Chaque module livre ses packs avec son namespace exclusif :

| Module | Namespace |
|---|---|
| Foundation | `platform.*` |
| Capability documents | `capability.documents.*` |
| BC Sektor | `bc.sektor.*` |
| Application Sektor | `app.sektor.*` |

L'application compose les packs de ses modules au démarrage. Une clé d'un namespace ne peut être remplacée que par son propriétaire; des personnalisations tenant, si nécessaires, sont une couche explicitement auditée et limitée au namespace de l'application ou du BC concerné.

## Évolution des contrats

- Correctif interne : patch.
- Ajout rétrocompatible à une API : minor.
- Suppression ou changement incompatible : major avec chemin de migration.
- Toute SPI est plus stricte qu'une API de consommation, car les implémenteurs doivent évoluer avec elle.
