package ma.nafura.platform.hosttests;

import static org.assertj.core.api.Assertions.assertThat;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import ma.nafura.platform.scope.security.scope.DefaultScopeService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.env.Environment;
import org.springframework.jdbc.core.JdbcTemplate;

/**
 * The record descriptor drives the list API: declared properties, the filter grammar (400 on what the
 * descriptor does not allow), relations crossed once and only inside the organisation, 403 when the target
 * cannot be read, search across a relation, and aggregates over the whole filtered result.
 * Fixture: probe.group (G1, G2) with {@code records} (1-N via groupId), probe.record R-1 (50, G1), R-2 (80, G2).
 */
@SpringBootTest(classes = AllCapabilitiesApplication.class, webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class RecordFilterHostTest {

    private static final Pattern ACCESS_TOKEN = Pattern.compile("\"accessToken\"\\s*:\\s*\"([^\"]+)\"");
    private static final String GROUPS = "/api/v1/probe/groups";
    private static final String RECORDS = "/api/v1/probe/records";

    private final HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();

    @Autowired
    private Environment environment;

    @Autowired
    private JdbcTemplate jdbc;

    @Autowired
    private DefaultScopeService scopes;

    @Test
    void propertiesAreTheDescriptors() throws Exception {
        Response response = get(admin(), RECORDS + "/properties");
        assertThat(response.status()).isEqualTo(200);
        assertThat(response.body()).contains("\"amount\"", "\"money\"", "\"groupId\"", "\"relation\"", "\"endpoint\":\"" + GROUPS + "\"");
        assertThat(get(admin(), GROUPS + "/properties").body()).contains("\"records\"", "\"relations\"", "\"via\":\"groupId\"");
    }

    @Test
    void theGrammarFiltersAndRefusesWhatTheDescriptorDoesNotAllow() throws Exception {
        String admin = admin();
        assertThat(list(admin, RECORDS, "{\"amount\":{\"gte\":60}}").body()).contains("R-2").doesNotContain("R-1");
        assertThat(list(admin, RECORDS, "{\"or\":[{\"code\":{\"is\":\"R-1\"}},{\"amount\":{\"gt\":70}}]}").body()).contains("R-1", "R-2");
        assertThat(list(admin, RECORDS, "{\"createdAt\":{\"before\":\"today+1d\"}}").status()).isEqualTo(200);

        assertThat(list(admin, RECORDS, "{\"nope\":{\"is\":\"x\"}}").status()).isEqualTo(400);
        assertThat(list(admin, RECORDS, "{\"amount\":{\"contains\":\"5\"}}").status()).isEqualTo(400);
        assertThat(list(admin, RECORDS, "{\"and\":[{\"and\":[{\"and\":[{\"code\":{\"is\":\"R-1\"}}]}]}]}").status()).isEqualTo(400);
        assertThat(get(admin, RECORDS + "?sort=" + encode("nope,asc")).status()).isEqualTo(400);
    }

    @Test
    void relationsAreCrossedOnceInBothDirections() throws Exception {
        String admin = admin();
        // 1-N: groups having a record over 60, groups without any record.
        assertThat(list(admin, GROUPS, "{\"records\":{\"any\":{\"amount\":{\"gt\":60}}}}").body()).contains("G2").doesNotContain("G1");
        assertThat(list(admin, GROUPS, "{\"records\":{\"none\":{\"amount\":{\"gt\":60}}}}").body()).contains("G1").doesNotContain("G2");
        assertThat(list(admin, GROUPS, "{\"records\":{\"empty\":false}}").body()).contains("G1", "G2");
        // N-1: records whose group is G1.
        assertThat(list(admin, RECORDS, "{\"groupId\":{\"where\":{\"code\":{\"is\":\"G1\"}}}}").body()).contains("R-1").doesNotContain("R-2");
        // One hop only.
        assertThat(list(admin, GROUPS, "{\"records\":{\"any\":{\"groupId\":{\"where\":{\"code\":{\"is\":\"G1\"}}}}}}").status()).isEqualTo(400);
    }

    @Test
    void aRelationTargetTheCallerCannotReadIsForbidden() throws Exception {
        String groups = token("groups@host.local");
        assertThat(list(groups, GROUPS, "{\"code\":{\"is\":\"G1\"}}").status()).isEqualTo(200);
        assertThat(list(groups, GROUPS, "{\"records\":{\"empty\":true}}").status()).isEqualTo(403);
        // Search skips the path it cannot read instead of failing.
        assertThat(get(groups, GROUPS + "?q=R-2").status()).isEqualTo(200);
    }

    @Test
    void aRelationNeverReachesAnotherOrganisation() throws Exception {
        UUID home = scopes.resolveDefaultScopeId();
        UUID g1 = jdbc.queryForObject("SELECT id FROM probe_group WHERE tenant_id = ? AND code = 'G1'", UUID.class, home);
        jdbc.update("INSERT INTO probe_record (tenant_id, code, group_id, amount) VALUES (?, 'X-OTHER', ?, 999)", UUID.randomUUID(), g1);

        String admin = admin();
        assertThat(list(admin, GROUPS, "{\"records\":{\"any\":{\"code\":{\"is\":\"X-OTHER\"}}}}").body()).doesNotContain("G1");
        assertThat(get(admin, GROUPS + "?q=X-OTHER").body()).doesNotContain("G1");
    }

    @Test
    void searchCrossesARelationAndAggregatesCoverTheWholeFilteredResult() throws Exception {
        String admin = admin();
        assertThat(get(admin, GROUPS + "?q=R-2").body()).contains("G2").doesNotContain("G1");
        Response sum = get(admin, RECORDS + "/aggregate?sum=amount&size=1&filter=" + encode("{\"amount\":{\"gt\":0}}"));
        assertThat(sum.status()).isEqualTo(200);
        assertThat(sum.body()).containsPattern("\"amount\"\\s*:\\s*130");
    }

    private Response list(String token, String path, String filter) throws Exception {
        return get(token, path + "?filter=" + encode(filter));
    }

    private Response get(String token, String path) throws Exception {
        HttpRequest request = HttpRequest.newBuilder(uri(path))
                .timeout(Duration.ofSeconds(20))
                .header("Authorization", "Bearer " + token)
                .GET()
                .build();
        HttpResponse<String> response = http.send(request, HttpResponse.BodyHandlers.ofString());
        return new Response(response.statusCode(), response.body());
    }

    private String admin() throws Exception {
        return token("admin@host.local");
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
        assertThat(matcher.find()).as(response.body()).isTrue();
        return matcher.group(1);
    }

    private URI uri(String path) {
        return URI.create("http://localhost:" + environment.getProperty("local.server.port") + path);
    }

    private static String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }

    private record Response(int status, String body) {
    }
}
