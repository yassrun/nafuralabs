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

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.env.Environment;

/**
 * A method-level @RequirePermission is enforced even when its controller has no @SecuredResource
 * (it used to be ignored: any authenticated user could change tenant settings or AI providers).
 */
@SpringBootTest(classes = AllCapabilitiesApplication.class, webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class PermissionEnforcementHostTest {

    private static final Pattern ACCESS_TOKEN = Pattern.compile("\"accessToken\"\\s*:\\s*\"([^\"]+)\"");

    private final HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();

    @Autowired
    private Environment environment;

    @Test
    void tenantSettingsWritesNeedThePermissionReadsStayOpenToMembers() throws Exception {
        assumeThat(disabled()).doesNotContain("cap.app-settings");
        String outsider = token("outsider@host.local");
        String admin = token("admin@host.local");
        String body = "{\"companyName\":\"Probe\"}";

        assertThat(send(outsider, "GET", "/api/v1/app-settings/general", null)).isEqualTo(200);
        assertThat(send(outsider, "GET", "/api/v1/app-settings/branding", null)).isEqualTo(200);
        assertThat(send(outsider, "PUT", "/api/v1/app-settings/general", body)).isEqualTo(403);
        assertThat(send(admin, "PUT", "/api/v1/app-settings/general", body)).isNotEqualTo(403);
    }

    @Test
    void aiProvidersAdministrationNeedsAdministrationAiPermissions() throws Exception {
        assumeThat(disabled()).doesNotContain("cap.ai");
        String outsider = token("outsider@host.local");

        assertThat(send(outsider, "GET", "/api/v1/platform/admin/ai-providers", null)).isEqualTo(403);
        assertThat(send(outsider, "GET", "/api/v1/platform/admin/ai-providers/limits", null)).isEqualTo(403);
        assertThat(send(outsider, "PUT", "/api/v1/platform/admin/ai-providers", "{}")).isEqualTo(403);
        assertThat(send(outsider, "PUT", "/api/v1/platform/admin/ai-providers/limits", "{}")).isEqualTo(403);
        assertThat(send(outsider, "PUT", "/api/v1/platform/admin/ai-providers/credentials/gemini", "{\"secret\":\"x\"}")).isEqualTo(403);
        assertThat(send(outsider, "DELETE", "/api/v1/platform/admin/ai-providers/credentials/gemini", null)).isEqualTo(403);
        assertThat(send(outsider, "POST", "/api/v1/platform/admin/ai-providers/test", "{}")).isEqualTo(403);
        assertThat(send(token("admin@host.local"), "GET", "/api/v1/platform/admin/ai-providers", null)).isEqualTo(200);
    }

    @Test
    void subscriptionAndOrganizationIdentityNeedTheirPermissions() throws Exception {
        String outsider = token("outsider@host.local");
        if (!disabled().contains("cap.subscriptions")) {
            assertThat(send(outsider, "GET", "/api/v1/administration/subscriptions", null)).isEqualTo(403);
        }
        if (!disabled().contains("cap.organization-identity")) {
            assertThat(send(outsider, "PUT", "/api/v1/organization/identity", "{}")).isEqualTo(403);
        }
    }

    @Test
    void scheduledJobsAreAdministrationOnly() throws Exception {
        String outsider = token("outsider@host.local");

        assertThat(send(outsider, "GET", "/api/v1/platform/admin/scheduled-jobs", null)).isEqualTo(403);
        assertThat(send(outsider, "POST", "/api/v1/platform/admin/scheduled-jobs/by-key/any/trigger", null)).isEqualTo(403);
        assertThat(send(token("admin@host.local"), "GET", "/api/v1/platform/admin/scheduled-jobs", null)).isEqualTo(200);
    }

    @Test
    void everyMemberReadsTheirOwnNotifications() throws Exception {
        assumeThat(disabled()).doesNotContain("cap.notifications");
        String outsider = token("outsider@host.local");

        assertThat(send(outsider, "GET", "/api/v1/platform/collaboration/notifications/unread-count", null)).isEqualTo(200);
        assertThat(send(outsider, "POST", "/api/v1/platform/collaboration/notifications/read-all", null)).isIn(200, 204);
    }

    @Test
    void anApiKeyKeepsThePermissionsItsCreatorHoldsEvenThroughAWildcard() throws Exception {
        String body = "{\"name\":\"probe\",\"permissions\":[\"probe.items.item.read\"]}";
        HttpRequest request = HttpRequest.newBuilder(uri("/api/v1/platform/admin/api-keys"))
                .timeout(Duration.ofSeconds(20))
                .header("Authorization", "Bearer " + token("admin@host.local"))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(body))
                .build();
        HttpResponse<String> response = http.send(request, HttpResponse.BodyHandlers.ofString());

        assertThat(response.statusCode()).as(response.body()).isEqualTo(201);
        assertThat(response.body()).contains("\"permissions\":[\"probe.items.item.read\"]", "\"plainKey\":\"").doesNotContain("keyHash");
    }

    @Test
    void anApiKeyIsRevokedBeforeItCanBeDeletedAndNeverShowsItsKeyAgain() throws Exception {
        String admin = token("admin@host.local");
        String created = sendForBody(admin, "POST", "/api/v1/platform/admin/api-keys", "{\"name\":\"revoke-me\",\"permissions\":[]}");
        Matcher id = Pattern.compile("\"id\"\\s*:\\s*\"([^\"]+)\"").matcher(created);
        assertThat(id.find()).as(created).isTrue();
        String path = "/api/v1/platform/admin/api-keys/" + id.group(1);

        assertThat(sendForBody(admin, "GET", path, null)).doesNotContain("plainKey").doesNotContain("keyHash").contains("\"state\":\"Active\"");
        assertThat(send(admin, "DELETE", path, null)).as("an active key is revoked first").isEqualTo(409);
        assertThat(sendForBody(admin, "POST", path + "/revoke", null)).contains("\"active\":false");
        assertThat(send(admin, "DELETE", path, null)).isEqualTo(204);
    }

    @Test
    void testingAnUnreachableWebhookReportsAFailedDeliveryAndKeepsTheSecretOnUpdate() throws Exception {
        assumeThat(disabled()).doesNotContain("cap.webhooks");
        String admin = token("admin@host.local");
        String created = sendForBody(admin, "POST", "/api/v1/platform/admin/webhooks",
                "{\"name\":\"probe\",\"url\":\"http://127.0.0.1:9/hook\",\"secret\":\"s3cret\",\"events\":[\"ENTITY_UPDATED\"],\"active\":true}");
        Matcher id = Pattern.compile("\"id\"\\s*:\\s*\"([^\"]+)\"").matcher(created);
        assertThat(id.find()).as(created).isTrue();
        String path = "/api/v1/platform/admin/webhooks/" + id.group(1);

        assertThat(created).doesNotContain("s3cret");
        assertThat(sendForBody(admin, "POST", path + "/test", null)).contains("\"success\":false");
        assertThat(send(admin, "PUT", path,
                "{\"name\":\"probe\",\"url\":\"http://127.0.0.1:9/hook\",\"secret\":\"\",\"events\":[\"ENTITY_UPDATED\"],\"active\":false}"))
                .as("a blank secret on update keeps the current one").isEqualTo(200);
        assertThat(send(admin, "DELETE", path, null)).isEqualTo(204);
    }

    @Test
    void aNumberingSequenceKeepsItsFormat() throws Exception {
        assumeThat(disabled()).doesNotContain("cap.sysconfig");
        String admin = token("admin@host.local");
        String created = sendForBody(admin, "POST", "/api/v1/numbering-sequences",
                "{\"name\":\"Factures\",\"code\":\"HOSTTEST_FMT\",\"prefix\":\"FAC\",\"separator\":\"-\",\"yearFormat\":\"YYYY\","
                        + "\"resetPolicy\":\"YEARLY\",\"currentNumber\":1,\"incrementBy\":1,\"padLength\":4}");

        assertThat(created).contains("\"separator\":\"-\"", "\"yearFormat\":\"YYYY\"", "\"resetPolicy\":\"YEARLY\"");
        assertThat(created).contains("\"preview\"");
        assertThat(sendForBody(admin, "GET", "/api/v1/numbering-sequences/properties", null))
                .contains("\"code\"", "\"name\"", "\"currentNumber\"", "\"preview\"", "\"resetLabel\"");
    }

    private String sendForBody(String token, String method, String path, String json) throws Exception {
        HttpRequest.Builder request = HttpRequest.newBuilder(uri(path))
                .timeout(Duration.ofSeconds(30))
                .header("Authorization", "Bearer " + token)
                .header("Content-Type", "application/json")
                .method(method, json == null ? HttpRequest.BodyPublishers.noBody() : HttpRequest.BodyPublishers.ofString(json));
        HttpResponse<String> response = http.send(request.build(), HttpResponse.BodyHandlers.ofString());
        assertThat(response.statusCode()).as(method + " " + path + " " + response.body()).isIn(200, 201);
        return response.body();
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
