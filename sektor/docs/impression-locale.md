# Impression locale Sektor

Le rendu utilise les modèles HTML/Thymeleaf existants et Gotenberg. Aucun moteur supplémentaire n'est nécessaire.

## Démarrage

Le service Kubernetes n'est pas accessible par son nom DNS depuis le backend Windows.
Dans un terminal conservé ouvert, exécuter :

```powershell
.\sektor\scripts\start-local-print.ps1
```

Avant de démarrer le backend, charger `NAFURA_GOTENBERG_URL=http://127.0.0.1:3000`
dans son environnement. Cette valeur est configurée dans le fichier local ignoré
`secrets/dev-staging-local.env`. Le port-forward écoute uniquement sur loopback.

## Personnalisation

1. Administration → Identité société → **Identité utilisée sur les documents** : renseigner les coordonnées et identifiants de l'émetteur. Ce formulaire persiste les clés `company.*` du tenant connecté en base, contrairement aux anciens champs d'extras stockés localement.
2. **Importer ou remplacer le logo** ouvre les paramètres d'image de marque. Enregistrer le logo choisi ; le moteur l'incorpore au PDF sans URL externe.
3. Administration → Personnalisation des documents : configurer les blocs d'en-tête et de pied de page, puis enregistrer.
4. Administration → Modèles d'impression : consulter un modèle système, ou le dupliquer pour modifier son HTML. **Aperçu PDF** utilise le moteur réel.

L'aperçu HTML conserve les styles et reste isolé : aucun script, accès à l'origine de l'application ou ressource réseau n'est autorisé. Il sert à vérifier le contenu ; le PDF demeure la référence pour la pagination.

## API d'identité

`GET /api/v1/socle/company-document-identity` et `PUT` au même emplacement.
Permissions existantes : `tenant.settings.read` et `tenant.settings.write`.
Le tenant vient du contexte authentifié ; le client ne fournit aucun tenant ID.
Les champs acceptés sont ceux du catalogue `SektorTenantIdentityProvider`, hors logo.
Le stockage réutilise `tenant_setting`, sans migration.

## Vérifications

- Tests du module `:platform:impression:test`, dont le rendu avec identité incomplète.
- `:sektor:socle:test --tests '*CompanyDocumentIdentityControllerTest'` : clés autorisées et isolation du tenant.
- TypeScript : `tsc -p tsconfig.app.json --rootDir ../../.. --noEmit` depuis `sektor/sources/web`.

Sur ce poste Windows, Gradle peut échouer avec `Unable to establish loopback connection`
si les sockets Java utilisent le répertoire temporaire long du lanceur. Un répertoire court
existant via `JAVA_TOOL_OPTIONS=-Djdk.net.unixdomain.tmpdir=C:/Temp/sektor-print`
permet d'exécuter les tests.
