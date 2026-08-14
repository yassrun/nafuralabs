# ERP Backend - Multi-stage Docker build
#
# Build from backend directory:
#   docker build -t erp-backend:dev -f applications/erp/Dockerfile .

FROM eclipse-temurin:21-jdk AS build
WORKDIR /app

# Install tools needed by Gradle wrapper
RUN apt-get update && apt-get install -y --no-install-recommends curl unzip \
  && rm -rf /var/lib/apt/lists/*

# Copy repository and build target application module
COPY . .
RUN sed -i 's/\r$//' gradlew && chmod +x gradlew
RUN ./gradlew :applications:erp:bootJar --no-daemon

FROM eclipse-temurin:21-jre
WORKDIR /app

# curl is used by healthcheck
RUN apt-get update && apt-get install -y --no-install-recommends curl \
  && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/applications/erp/build/libs/*.jar app.jar
EXPOSE 8082

HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8082/actuator/health || exit 1

ENTRYPOINT ["java", "-jar", "app.jar"]
