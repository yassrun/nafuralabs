# Sektor BTP Backend — build from nafuralabs root:
#   docker build -t sektor-btp-backend:staging -f sektor/ops/Dockerfile .

FROM eclipse-temurin:21-jdk AS build
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends curl unzip \
  && rm -rf /var/lib/apt/lists/*
COPY . .
RUN sed -i 's/\r$//' sektor/sources/backend/gradlew && chmod +x sektor/sources/backend/gradlew
RUN sektor/sources/backend/gradlew -p sektor/sources/backend :sektor:app:bootJar --no-daemon

FROM eclipse-temurin:21-jre
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends curl \
  && rm -rf /var/lib/apt/lists/*
COPY --from=build /app/sektor/sources/backend/app/build/libs/*.jar app.jar
EXPOSE 8082
HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:8082/actuator/health || exit 1
ENTRYPOINT ["java", "-jar", "app.jar"]
