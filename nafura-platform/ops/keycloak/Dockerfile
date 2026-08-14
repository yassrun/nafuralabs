# Nafura Labs branded Keycloak (theme baked in for Kubernetes / prod).
FROM quay.io/keycloak/keycloak:26.0

USER root
COPY themes/nafuralabs /opt/keycloak/themes/nafuralabs
COPY start-with-bootstrap.sh /opt/keycloak/bin/start-with-bootstrap.sh
RUN sed -i 's/\r$//' /opt/keycloak/bin/start-with-bootstrap.sh \
    && chown -R keycloak:root /opt/keycloak/themes/nafuralabs \
    && chmod +x /opt/keycloak/bin/start-with-bootstrap.sh
USER keycloak
