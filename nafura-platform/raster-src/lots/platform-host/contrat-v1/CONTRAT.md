# Contrat — contrat-v1

> Un seul format pour décrire une app et un BC. La plateforme le lit et le valide. Rien d’autre n’est nécessaire pour monter un produit.

## Décision de format

Base : `NafuraManifest` `apiVersion: nafura.io/v1` (`nafura-platform/sources/web/platform/manifest.ts`), déjà typé, validé et testé.

- `app.nafura.json` = manifeste `kind: application`.
- `bc.manifest.json` = manifeste `kind: business-context`.
- `sandbox/app.nafura.example.json` et `sandbox/bc.manifest.example.json` sont réécrits dans ce format ; plus de second format.

## Application

```json
{
  "apiVersion": "nafura.io/v1",
  "kind": "application",
  "metadata": { "id": "app.demo-erp", "version": "0.1.0", "owner": "demo", "lifecycle": "experimental" },
  "spec": {
    "product": { "name": "Demo ERP", "tagline": "…", "logoUrl": "/assets/brand/logo.svg" },
    "runtime": { "requiresTenant": true, "defaultRoute": "/home", "auth": { "mode": "keycloak" } },
    "shell": {
      "topBar": { "enabled": true, "pageContext": true },
      "userMenu": { "enabled": true, "userSettings": true },
      "tenantMenu": { "enabled": true, "tenantSettings": true, "organizationIdentity": true },
      "notifications": { "enabled": true },
      "ai": { "enabled": true },
      "contextRail": { "enabled": true }
    },
    "requires": [
      { "id": "cap.administration", "version": "^0.1.0" },
      { "id": "cap.notifications", "version": "^0.1.0", "optional": true }
    ],
    "businessContexts": ["bc.achats", "bc.chantiers"],
    "i18n": { "namespace": "app.demo-erp", "locales": ["fr"] }
  }
}
```

## Business context

```json
{
  "apiVersion": "nafura.io/v1",
  "kind": "business-context",
  "metadata": { "id": "bc.achats", "version": "0.1.0", "owner": "demo", "lifecycle": "experimental" },
  "spec": {
    "routesPrefix": "/achats",
    "permissions": [
      { "id": "achats.commande.read" },
      { "id": "achats.commande.write" }
    ],
    "defaultRoles": [
      { "code": "ACHETEUR", "permissions": ["achats.commande.read", "achats.commande.write"] }
    ],
    "navigation": [
      { "id": "achats-home", "label": "achats.nav.home", "route": "/achats", "icon": "shopping-cart", "permission": "achats.commande.read" }
    ],
    "contextRail": { "label": "achats.rail", "icon": "shopping-cart" },
    "requires": [{ "id": "cap.approvals", "version": "^0.1.0", "optional": true }],
    "i18n": { "namespace": "bc.achats", "locales": ["fr"] }
  }
}
```

## Critères d’acceptation

- **AC-1** Un seul format. `NafuraManifest` porte les champs `application` et `business-context` ci-dessus ; les deux fichiers exemple sandbox sont réécrits et valides.
- **AC-2** `spec.shell` d’une application se projette sans perte vers `AppShellFeatureConfig` (`provideAppShell`). La navigation n’y figure pas : elle est dérivée des BCs.
- **AC-3** `spec.runtime` se projette vers `ApplicationConfig` (`registerApplicationConfig`).
- **AC-4** Le validateur rejette, avec un code d’issue dédié :
  - `unknown-business-context` — l’app référence un BC sans manifeste ;
  - `route-prefix-collision` — deux BCs partagent un préfixe ou l’un préfixe l’autre ;
  - `permission-outside-namespace` — une permission de BC hors `<suffixe-id-bc>.` ;
  - `role-unknown-permission` — un rôle par défaut cite une permission non déclarée par son BC ;
  - `navigation-outside-prefix` — une entrée de nav hors `routesPrefix`.
- **AC-5** Schémas JSON `app.nafura.schema.json` et `bc.manifest.schema.json` publiés par la plateforme ; les exemples les référencent via `$schema`.
- **AC-6** Aucun état runtime tenant dans un manifeste : pas de `enabled` par BC, pas de section opérateur. L’activation tenant reste hors contrat (D-2).
- **AC-7** Rétrocompatibilité : `SANDBOX_MANIFEST` et `PLATFORM_CAPABILITY_MANIFESTS` restent valides sans modification.

## Interdit

- Un champ qui exprime une condition, une boucle ou une règle métier.
- Un champ qui duplique ce que la plateforme déduit (navigation app, préfixe de permission).
- Un import de code BC depuis un manifeste d’application (référence par id uniquement).
