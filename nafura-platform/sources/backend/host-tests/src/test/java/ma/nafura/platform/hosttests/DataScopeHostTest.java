package ma.nafura.platform.hosttests;

import static org.assertj.core.api.Assertions.assertThat;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.env.Environment;

/**
 * A role granted on a scope node covers that node and its descendants, not the rest of the organisation.
 * Fixture: probe groups G1, CHILD (parent G1), G2; records R-1 on G1, R-2 on G2.
 */
@SpringBootTest(classes = AllCapabilitiesApplication.class, webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class DataScopeHostTest {

    private static final Pattern ACCESS_TOKEN = Pattern.compile("\"accessToken\"\\s*:\\s*\"([^\"]+)\"");

    private final HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();
    private final ObjectMapper json = new ObjectMapper();

    @Autowired
    private Environment environment;

    @Test
    void aGrantLimitsARoleToANodeAndItsDescendants() throws Exception {
        String admin = token("admin@host.local");
        String outsider = token("outsider@host.local");
        JsonNode groups = json.readTree(body(admin, "GET", "/api/v1/probe/groups?size=50", null)).path("content");
        String g1 = idOf(groups, "G1");
        String child = idOf(groups, "CHILD");
        String g2 = idOf(groups, "G2");
        JsonNode records = json.readTree(body(admin, "GET", "/api/v1/probe/records?size=50", null)).path("content");
        String onG1 = idOf(records, "R-1");
        String onG2 = idOf(records, "R-2");
        String userId = memberId(admin, "outsider@host.local");

        assertThat(send(outsider, "GET", "/api/v1/probe/groups", null)).isEqualTo(403);

        String created = body(admin, "POST", "/api/v1/platform/admin/scope-grants",
                "{\"userId\":\"" + userId + "\",\"roleCode\":\"PROBE_NODE\",\"entity\":\"probe.group\",\"recordId\":\"" + g1 + "\"}");
        String grantId = json.readTree(created).path("id").asText();
        try {
            String visible = body(outsider, "GET", "/api/v1/probe/groups?size=50", null);
            assertThat(visible).contains("G1", "CHILD").doesNotContain("\"code\":\"G2\"");
            assertThat(send(outsider, "GET", "/api/v1/probe/groups/" + g2, null)).isEqualTo(404);
            assertThat(send(outsider, "GET", "/api/v1/probe/groups/" + child, null)).isEqualTo(200);
            String rows = body(outsider, "GET", "/api/v1/probe/records?size=50", null);
            assertThat(rows).contains("R-1").doesNotContain("R-2");
            assertThat(send(outsider, "GET", "/api/v1/probe/records/" + onG2, null)).isEqualTo(404);
            assertThat(send(outsider, "GET", "/api/v1/probe/records/" + onG1, null)).isEqualTo(200);
        } finally {
            send(admin, "DELETE", "/api/v1/platform/admin/scope-grants/" + grantId, null);
        }
    }

    private String memberId(String admin, String email) throws Exception {
        JsonNode options = json.readTree(body(admin, "GET",
                "/api/v1/platform/admin/members/options?q=" + email, null));
        for (JsonNode option : options) {
            if (option.path("label").asText().contains(email)) {
                return option.path("value").asText();
            }
        }
        throw new AssertionError("No member " + email + " in " + options);
    }

    private static String idOf(JsonNode rows, String code) {
        for (JsonNode row : rows) {
            if (code.equals(row.path("code").asText())) {
                return row.path("id").asText();
            }
        }
        throw new AssertionError("No row " + code + " in " + rows);
    }

    private String body(String token, String method, String path, String payload) throws Exception {
        HttpResponse<String> response = exchange(token, method, path, payload);
        assertThat(response.statusCode()).as(method + " " + path + " " + response.body()).isIn(200, 201);
        return response.body();
    }

    private int send(String token, String method, String path, String payload) throws Exception {
        return exchange(token, method, path, payload).statusCode();
    }

    private HttpResponse<String> exchange(String token, String method, String path, String payload) throws Exception {
        HttpRequest.Builder request = HttpRequest.newBuilder(uri(path))
                .timeout(Duration.ofSeconds(30))
                .header("Authorization", "Bearer " + token);
        if (payload != null) {
            request.header("Content-Type", "application/json");
        }
        request.method(method, payload == null ? HttpRequest.BodyPublishers.noBody() : HttpRequest.BodyPublishers.ofString(payload));
        return http.send(request.build(), HttpResponse.BodyHandlers.ofString());
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
