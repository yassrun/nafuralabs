# Nafura Lifecycle - Liquibase CLI
#
# Database migration image based on Liquibase CLI.
#
# Build:
#   cd backend && ./gradlew :tools:lifecycle:collectMigrations
#   docker build -t nafura-lifecycle:dev -f tools/lifecycle/Dockerfile tools/lifecycle/
#
# Run (use app DB e.g. nafura_socle):
#   docker run nafura-lifecycle:dev \
#     --url=jdbc:postgresql://localhost:5432/nafura_socle \
#     --username=seyrura \
#     --password=seyrura \
#     update

FROM liquibase/liquibase:4.31

# Copy generated changelog and SQL payload from Gradle build output
COPY build/changelog/db.changelog-master.yaml /liquibase/changelog/db.changelog-master.yaml
COPY build/migrations/ /liquibase/migrations/

# Default changelog location (relative to /liquibase search path)
ENV LIQUIBASE_COMMAND_CHANGELOG_FILE=changelog/db.changelog-master.yaml

# Default command: update
# Connection details are passed through runtime args/env in K8s.
ENTRYPOINT ["liquibase"]
CMD ["update"]
