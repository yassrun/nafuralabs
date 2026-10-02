package ma.nafura.platform.hosttests;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assumptions.assumeThat;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import ma.nafura.platform.authorization.domain.model.RolePermission;
import ma.nafura.platform.authorization.repository.RolePermissionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.DefaultApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.env.Environment;

/**
 * Roles are configuration: bc.probe declares PROBE_VIEWER/PROBE_WRITER, the application composes PROBE_LEAD
 * (test resources nafura/ and META-INF/nafura/bc). The platform seeds them and enforces the permissions the BC declares.
 */
@SpringBootTest(classes = AllCapabilitiesApplication.class, webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class DeclaredRolesHostTest {

    private static final Pattern ACCESS_TOKEN = Pattern.compile("\"accessToken\"\\s*:\\s*\"([^\"]+)\"");
    private static final String ITEMS = "/api/v1/probe/items";

    private final HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();
    private final ObjectMapper json = new ObjectMapper();

    @Autowired
    private Environment environment;

    @Autowired
    private ObjectProvider<RolePermissionRepository> rolePermissions;

    @Autowired
    private ObjectProvider<ApplicationRunner> runners;

    @BeforeEach
    void requiresIam() {
        assumeThat(disabledCapabilities()).as("roles are seeded by cap.iam").doesNotContain("cap.iam");
    }

    @Test
    void businessContextAndApplicationRolesAreSeeded() {
        RolePermissionRepository repository = rolePermissions.getObject();

        assertThat(permissionsOf(repository, "PROBE_VIEWER")).containsExactly("probe.items.item.read");
        assertThat(permissionsOf(repository, "PROBE_WRITER")).containsExactly("probe.items.item.create");
        assertThat(permissionsOf(repository, "PROBE_LEAD"))
                .containsExactlyInAnyOrder("probe.items.item.read", "probe.items.item.create");
    }

    @Test
    void permissionsDeclaredByTheBusinessContextAreEnforced() throws Exception {
        String lead = token("lead@host.local");
        String viewer = token("viewer@host.local");
        String outsider = token("outsider@host.local");

        assertThat(send(lead, "GET")).isEqualTo(200);
        assertThat(send(lead, "POST")).isEqualTo(200);
        assertThat(send(viewer, "GET")).isEqualTo(200);
        assertThat(send(viewer, "POST")).isEqualTo(403);
        assertThat(send(outsider, "GET")).isEqualTo(403);
    }

    @Test
    void seedingIsIdempotentAndRemovesPermissionsNoLongerDeclared() throws Exception {
        RolePermissionRepository repository = rolePermissions.getObject();
        repository.save(RolePermission.builder().roleCode("PROBE_VIEWER").permission("probe.items.item.create").build());

        seedDeclaredRoles();
        seedDeclaredRoles();

        assertThat(permissionsOf(repository, "PROBE_VIEWER")).containsExactly("probe.items.item.read");
        assertThat(send(token("viewer@host.local"), "POST")).isEqualTo(403);
    }

    /** By name: the seeder class is absent from the variants without cap.iam. */
    private void seedDeclaredRoles() throws Exception {
        runners.orderedStream().filter(runner -> runner.getClass().getSimpleName().equals("DeclaredRolesSeeder"))
                .findFirst().orElseThrow().run(new DefaultApplicationArguments());
    }

    @Test
    void assigningDeclaredRolesToAMemberChangesWhatTheMemberCanDo() throws Exception {
        String admin = token("admin@host.local");
        String tenant = tenantId("admin@host.local");
        String member = memberId(admin, tenant, "assignee@host.local");
        String roles = "/api/tenants/" + tenant + "/members/" + member + "/roles";

        assertThat(patch(admin, roles, "{\"roles\":[\"PROBE_VIEWER\"]}")).isEqualTo(200);
        assertThat(send(token("assignee@host.local"), "GET")).isEqualTo(200);
        assertThat(send(token("assignee@host.local"), "POST")).isEqualTo(403);

        // Overlapping replacement: the kept role must not collide with itself.
        assertThat(patch(admin, roles, "{\"roles\":[\"PROBE_VIEWER\",\"PROBE_WRITER\"]}")).isEqualTo(200);
        assertThat(send(token("assignee@host.local"), "POST")).isEqualTo(200);

        assertThat(patch(admin, roles, "{\"roles\":[\"PROBE_VIEWER\"]}")).isEqualTo(200);
        assertThat(send(token("assignee@host.local"), "POST")).isEqualTo(403);
        assertThat(patch(admin, roles, "{\"roles\":[\"NOT_A_ROLE\"]}")).isEqualTo(400);
    }

    @Test
    void aDisabledBusinessContextRefusesItsApiToEveryoneUntilEnabledAgain() throws Exception {
        String admin = token("admin@host.local");
        String lead = token("lead@host.local");
        String domains = "/api/tenants/" + tenantId("admin@host.local") + "/domains";

        JsonNode probe = domain(admin, domains, "probe");
        assertThat(probe.path("enabled").asBoolean()).as("declared BCs are on by default").isTrue();
        assertThat(probe.path("name").asText()).as("label from the BC manifest").isEqualTo("Sonde");
        assertThat(probe.path("icon").asText()).isEqualTo("radar");
        assertThat(json.readTree(get(lead, "/api/v1/me/permissions")).path("permissions").toString())
                .contains("\"probe.items.item.read\"");
        try {
            assertThat(patch(admin, domains + "/probe", "{\"enabled\":false}")).isEqualTo(200);
            assertThat(domain(admin, domains, "probe").path("enabled").asBoolean()).isFalse();
            assertThat(send(lead, "GET")).isEqualTo(403);
            assertThat(send(admin, "GET")).as("even a super admin").isEqualTo(403);
            assertThat(json.readTree(get(lead, "/api/v1/me/permissions")).path("disabledDomains").toString())
                    .contains("\"probe\"");
        } finally {
            assertThat(patch(admin, domains + "/probe", "{\"enabled\":true}")).isEqualTo(200);
        }
        assertThat(send(lead, "GET")).isEqualTo(200);
        assertThat(patch(admin, domains + "/not-a-bc", "{\"enabled\":false}")).isEqualTo(400);
    }

    private JsonNode domain(String token, String domains, String code) throws Exception {
        for (JsonNode domain : json.readTree(get(token, domains))) {
            if (code.equals(domain.path("code").asText())) {
                return domain;
            }
        }
        throw new AssertionError(code + " is not listed in " + domains);
    }

    private String get(String token, String path) throws Exception {
        HttpRequest request = HttpRequest.newBuilder(uri(path)).header("Authorization", "Bearer " + token).build();
        HttpResponse<String> response = http.send(request, HttpResponse.BodyHandlers.ofString());
        assertThat(response.statusCode()).as(path + " " + response.body()).isEqualTo(200);
        return response.body();
    }

    private int patch(String token, String path, String json) throws Exception {
        HttpRequest request = HttpRequest.newBuilder(uri(path))
                .timeout(Duration.ofSeconds(20))
                .header("Authorization", "Bearer " + token)
                .header("Content-Type", "application/json")
                .method("PATCH", HttpRequest.BodyPublishers.ofString(json))
                .build();
        return http.send(request, HttpResponse.BodyHandlers.discarding()).statusCode();
    }

    private String tenantId(String email) throws Exception {
        HttpRequest request = HttpRequest.newBuilder(uri("/api/public/lab/session"))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString("{\"email\":\"" + email + "\"}"))
                .build();
        return json.readTree(http.send(request, HttpResponse.BodyHandlers.ofString()).body()).path("tenant").path("id").asText();
    }

    private String memberId(String token, String tenant, String email) throws Exception {
        HttpRequest request = HttpRequest.newBuilder(uri("/api/tenants/" + tenant + "/members?size=50"))
                .header("Authorization", "Bearer " + token)
                .build();
        for (JsonNode member : json.readTree(http.send(request, HttpResponse.BodyHandlers.ofString()).body()).path("items")) {
            if (email.equals(member.path("email").asText())) {
                return member.path("userId").asText();
            }
        }
        throw new AssertionError(email + " is not a member of " + tenant);
    }

    private static List<String> permissionsOf(RolePermissionRepository repository, String role) {
        return repository.findByRoleCode(role).stream().map(RolePermission::getPermission).toList();
    }

    private List<String> disabledCapabilities() {
        String value = System.getProperty("nafura.test.disabled-capabilities", "");
        return value.isBlank() ? List.of() : List.of(value.split(","));
    }

    private int send(String token, String method) throws Exception {
        HttpRequest request = HttpRequest.newBuilder(uri(ITEMS))
                .timeout(Duration.ofSeconds(20))
                .header("Authorization", "Bearer " + token)
                .method(method, HttpRequest.BodyPublishers.noBody())
                .build();
        return http.send(request, HttpResponse.BodyHandlers.discarding()).statusCode();
    }

    private String token(String email) throws Exception {
        HttpRequest request = HttpRequest.newBuilder(uri("/api/public/lab/session"))
                .timeout(Duration.ofSeconds(20))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString("{\"email\":\"" + email + "\"}"))
                .build();
        HttpResponse<String> response = http.send(request, HttpResponse.BodyHandlers.ofString());
        assertThat(response.statusCode()).as(response.body()).isEqualTo(200);
        Matcher matcher = ACCESS_TOKEN.matcher(response.body());
        assertThat(matcher.find()).isTrue();
        return matcher.group(1);
    }

    private URI uri(String path) {
        return URI.create("http://localhost:" + environment.getProperty("local.server.port") + path);
    }
}
