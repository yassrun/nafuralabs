# Sandbox backend

Backend Spring Boot + **H2** du produit `sandbox`.

## Lancer (recommandé)

Un seul script pour **back + front** :

```powershell
cd sandbox
.\showroom-up.ps1          # back :8082 + front :4300  (Windows / agents)
.\showroom-up.ps1 back     # back seul
.\showroom-up.ps1 stop
.\showroom-up.ps1 status
```

Équivalent bash (Git Bash / Linux) : [`../../showroom-up.sh`](../../showroom-up.sh).

**Ne pas** passer par `./gradlew … bootRun` sur cette machine : proxy plugins Gradle **407**. Le script utilise `build/offline-classes` + `build/offline-classpath.txt`.

## Ports / données

- API : `http://127.0.0.1:8082`
- H2 fichier : `./data/showroom` (cwd = ce dossier `app/`)
- Console H2 : `http://127.0.0.1:8082/h2-console`  
  JDBC `jdbc:h2:file:./data/showroom`, user `sa`, password vide
- Logs back (script) : `build/showroom-backend.log`

## Endpoints

- `GET /api/showroom/products`
- `GET /api/showroom/products/{id}`
- `POST /api/showroom/products`
- `PUT /api/showroom/products/{id}`
- `DELETE /api/showroom/products/{id}`
- `GET /api/showroom/products/lookup`
- `POST /api/showroom/products/batch`
- `DELETE /api/showroom/products/batch`
- `GET /actuator/health`
