# Anatomy Showroom backend

Petit backend Spring Boot + **H2** pour le showroom `sandbox-web`.

## Lancer

```bash
cd nafura-platform/sources/backend
./gradlew :platform:app:bootRun
```

Le service écoute sur `http://127.0.0.1:8082`.

Base H2 fichier : `./data/showroom` (relatif au cwd du process). Console : `http://127.0.0.1:8082/h2-console`
(JDBC URL `jdbc:h2:file:./data/showroom`, user `sa`, password vide).

## Endpoints

- `GET /api/showroom/catalog`
- `GET /api/showroom/products`
- `GET /api/showroom/products/{id}`
- `POST /api/showroom/products`
- `PUT /api/showroom/products/{id}`
- `DELETE /api/showroom/products/{id}`
- `GET /actuator/health`
