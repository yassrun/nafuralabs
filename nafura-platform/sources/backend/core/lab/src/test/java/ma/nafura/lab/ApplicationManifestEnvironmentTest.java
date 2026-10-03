package ma.nafura.lab;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

class ApplicationManifestEnvironmentTest {

    @Test
    void namesTheApplicationAndItsLabFromTheManifest() throws Exception {
        Map<String, Object> properties = ApplicationManifestEnvironment.properties(new ObjectMapper().readTree("""
                { "metadata": { "id": "app.acme-erp" },
                  "spec": { "product": { "name": "Acme ERP" },
                            "local": { "ports": { "api": 8095, "web": 4405 },
                                       "users": [ { "email": "a@acme.local", "givenName": "A", "familyName": "B", "role": "SUPER_ADMIN" } ] } } }
                """));

        assertThat(properties)
                .containsEntry("spring.application.name", "acme-erp")
                .containsEntry("nafura.application.id", "acme-erp")
                .containsEntry("nafura.application.name", "Acme ERP")
                .containsEntry("nafura.security.tenant.mode", "single")
                .containsEntry("nafura.security.oidc.client-id", "acme-erp")
                .containsEntry("nafura.lab.issuer", "acme-erp-lab")
                .containsEntry("server.port", 8095)
                .containsEntry("nafura.lab.users[0].email", "a@acme.local")
                .containsEntry("nafura.lab.users[0].role", "SUPER_ADMIN");
    }
}
