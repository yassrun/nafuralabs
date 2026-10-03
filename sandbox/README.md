# Sandbox

Produit de démonstration et de validation des composants et archetypes UI Nafura.

## Runtimes

- `sources/backend/`: API Spring Boot locale sur `:8082` — **Layer 0 + Layer 1**
  (`framework` + `multi-tenant` = tenancy, identity, authorization, scope).
- `sources/web/`: application Angular Sandbox sur `:4300` — session lab via
  `POST /api/public/sandbox/session` (JWT HS256).

## Lancer localement

Depuis Git Bash ou Linux, lancer les deux runtimes et attendre leurs health checks :

```bash
./sandbox-up.sh
```

Le script sélectionne automatiquement le JDK 25 local documenté et utilise le proxy Gradle configuré.

Le script vérifie `GET /actuator/health` sur le backend et une réponse HTTP sur le frontend avant de terminer.
Les logs sont écrits dans `sources/backend/build/sandbox-backend.log` et `sources/web/.sandbox-web.log`.

Pour arrêter les deux processus :

```bash
./sandbox-up.sh stop
```

Pour vérifier leur état :

```bash
./sandbox-up.sh status
```

Lancement manuel, dans deux terminaux :

```powershell
$env:JAVA_HOME = 'C:\nf\nafuralabs\deps\jdk-25.0.4.1+1'
$env:Path = 'C:\Users\karkafiy\Desktop\tools\gradle-9.7.1\bin;' + $env:Path
cd sandbox\sources\backend
gradle bootRun
```

Dans un second terminal:

```powershell
cd sandbox\sources\web
npm start
```

Le backend s'appuie sur le framework de `nafura-platform`; le web consomme ses bibliothèques UI via les alias `@platform`.
