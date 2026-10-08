package ma.nafura.platform.hosttests;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assumptions.assumeThat;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.env.Environment;

/**
 * Approvals designate holders of a permission (never a role).
 * Without the permission → 403; the requester cannot self-approve.
 */
@SpringBootTest(classes = AllCapabilitiesApplication.class, webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class ApprovalPermissionHostTest {

    private static final Pattern ACCESS_TOKEN = Pattern.compile("\"accessToken\"\\s*:\\s*\"([^\"]+)\"");
    private static final Pattern ID = Pattern.compile("\"id\"\\s*:\\s*\"([0-9a-f-]{36})\"");
    private static final String APPROVALS = "/api/v1/platform/collaboration/approvals";
    private static final String APPROVE_PERM = "collaboration.collaboration.approval.read";

    private final HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();

    @Autowired
    private Environment environment;

    @Test
    void withoutThePermissionTheDecisionIsForbidden() throws Exception {
        assumeThat(disabled()).doesNotContain("cap.approvals");
        String admin = token("admin@host.local");
        String outsider = token("outsider@host.local");
        String id = openAs(admin);

        assertThat(send(outsider, "POST", APPROVALS + "/" + id + "/approve", "{}")).isEqualTo(403);
    }

    @Test
    void theRequesterCannotSelfApprove() throws Exception {
        assumeThat(disabled()).doesNotContain("cap.approvals");
        String admin = token("admin@host.local");
        String id = openAs(admin);

        assertThat(send(admin, "POST", APPROVALS + "/" + id + "/approve", "{}")).isEqualTo(403);
    }

    private String openAs(String token) throws Exception {
        HttpRequest request = HttpRequest.newBuilder(uri(APPROVALS + "/request"))
                .timeout(Duration.ofSeconds(20))
                .header("Authorization", "Bearer " + token)
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(
                        "{\"entityType\":\"host-test.approval\",\"entityId\":\"" + UUID.randomUUID()
                                + "\",\"title\":\"Host approval\",\"workflow\":[{\"stepNumber\":1,\"approverPermission\":\""
                                + APPROVE_PERM + "\"}]}"))
                .build();
        HttpResponse<String> response = http.send(request, HttpResponse.BodyHandlers.ofString());
        assertThat(response.statusCode()).as(response.body()).isEqualTo(201);
        Matcher matcher = ID.matcher(response.body());
        assertThat(matcher.find()).as(response.body()).isTrue();
        return matcher.group(1);
    }

    private List<String> disabled() {
        String value = System.getProperty("nafura.test.disabled-capabilities", "");
        return value.isBlank() ? List.of() : List.of(value.split(","));
    }

    private int send(String token, String method, String path, String json) throws Exception {
        HttpRequest.Builder request = HttpRequest.newBuilder(uri(path))
                .timeout(Duration.ofSeconds(20))
                .header("Authorization", "Bearer " + token);
        if (json != null) {
            request.header("Content-Type", "application/json").method(method, HttpRequest.BodyPublishers.ofString(json));
        } else {
            request.method(method, HttpRequest.BodyPublishers.noBody());
        }
        return http.send(request.build(), HttpResponse.BodyHandlers.discarding()).statusCode();
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
