# Sandbox backend

Backend Spring Boot + **H2** du produit `sandbox`.

## Lancer

```powershell
$env:JAVA_HOME = 'C:\Users\karkafiy\Desktop\tools\jdk-25.0.4.1+1'
$env:Path = 'C:\Users\karkafiy\Desktop\tools\gradle-9.7.1\bin;' + $env:Path
gradle bootRun
```

Sur la machine avec proxy, les réglages Gradle vivent dans le profil utilisateur, pas dans ce dépôt.

## Ports / données

- API : `http://127.0.0.1:8082`
- H2 fichier : `./data/sandbox` (cwd = ce dossier)
- Console H2 : `http://127.0.0.1:8082/h2-console`  
  JDBC `jdbc:h2:file:./data/sandbox`, user `sa`, password vide
- Logs Spring Boot : sortie du terminal `bootRun`

## Endpoints

- `GET /api/sandbox/products`
- `GET /api/sandbox/products/{id}`
- `POST /api/sandbox/products`
- `PUT /api/sandbox/products/{id}`
- `DELETE /api/sandbox/products/{id}`
- `GET /api/sandbox/products/lookup`
- `POST /api/sandbox/products/batch`
- `DELETE /api/sandbox/products/batch`
- `GET /actuator/health`
