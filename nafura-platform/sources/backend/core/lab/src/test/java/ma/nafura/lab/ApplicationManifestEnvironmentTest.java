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
                .containsEntry("nafura.lab.users[0].role", "SUPER_ADMIN")
                .containsEntry("nafura.runtime.signup", "operator");
    }

    @Test
    void readsMultiOrganizationsOperatorsAndSignup() throws Exception {
        Map<String, Object> properties = ApplicationManifestEnvironment.properties(new ObjectMapper().readTree("""
                { "metadata": { "id": "app.acme-erp" },
                  "spec": { "runtime": { "tenancy": "multi", "signup": "open" },
                            "local": { "organizations": [ { "key": "org-a", "name": "A" } ],
                                       "users": [ { "email": "a@acme.local", "givenName": "A", "familyName": "B", "role": "OWNER",
                                                    "organizations": [ { "key": "org-a", "role": "OWNER" }, "org-b" ] } ] },
                            "deploy": { "lab": { "operators": [ "op@acme.local" ] } } } }
                """));

        assertThat(properties)
                .containsEntry("nafura.security.tenant.mode", "multi")
                .containsEntry("nafura.runtime.signup", "open")
                .containsEntry("nafura.lab.organizations[0].key", "org-a")
                .containsEntry("nafura.lab.users[0].organizations[0].role", "OWNER")
                .containsEntry("nafura.lab.users[0].organizations[1].key", "org-b")
                .containsEntry("nafura.access.operators[0]", "op@acme.local");
    }
}
