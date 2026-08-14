# Venue Catalog Backend — build from nafuralabs root:
#   docker build -t venue-catalog-backend:staging -f venue-catalog/Dockerfile .

FROM eclipse-temurin:21-jdk AS build
WORKDIR /src
RUN apt-get update && apt-get install -y --no-install-recommends curl unzip \
  && rm -rf /var/lib/apt/lists/*
COPY venue-catalog /src/venue-catalog
COPY nafura-platform /src/nafura-platform
WORKDIR /src/venue-catalog/sources/backend
RUN sed -i 's/\r$//' gradlew && chmod +x gradlew
RUN ./gradlew :venue-catalog:app:bootJar --no-daemon

FROM eclipse-temurin:21-jre
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends curl \
  && rm -rf /var/lib/apt/lists/*
COPY --from=build /src/venue-catalog/sources/backend/app/build/libs/*.jar app.jar
EXPOSE 8085
HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:8085/actuator/health || exit 1
ENTRYPOINT ["java", "-jar", "app.jar"]
