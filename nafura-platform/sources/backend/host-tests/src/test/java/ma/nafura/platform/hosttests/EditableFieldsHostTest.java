package ma.nafura.platform.hosttests;

import static org.assertj.core.api.Assertions.assertThat;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.env.Environment;

/**
 * Lifecycle {@code editableFields}: a status outside {@code editable} stays partially writable;
 * fields outside the allow-list are ignored on PUT (same silence as managed fields); {@code /lifecycle} exposes them.
 */
@SpringBootTest(classes = AllCapabilitiesApplication.class, webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class EditableFieldsHostTest {

    private static final Pattern ACCESS_TOKEN = Pattern.compile("\"accessToken\"\\s*:\\s*\"([^\"]+)\"");
    private static final Pattern ID = Pattern.compile("\"id\"\\s*:\\s*\"([0-9a-f-]{36})\"");
    private static final Pattern VERSION = Pattern.compile("\"version\"\\s*:\\s*(\\d+)");
    private static final String RECORDS = "/api/v1/probe/records";

    private final HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();

    @Autowired
    private Environment environment;

    @Test
    void submittedAllowsOnlyAmountAndLifecycleExposesAllowList() throws Exception {
        String admin = admin();
        String id = null;
        try {
            // amount > 1000 keeps the row in SUBMITTED (approval pending); below that, submit auto-approves.
            Response created = send(admin, "POST", RECORDS, "{\"code\":\"edit-fields-1\",\"amount\":2000}");
            assertThat(created.status()).as(created.body()).isEqualTo(201);
            id = id(created);
            long version = version(created);

            Response lifecycle = send(admin, "GET", RECORDS + "/lifecycle", null);
            assertThat(lifecycle.status()).as(lifecycle.body()).isEqualTo(200);
            assertThat(lifecycle.body()).contains("\"editableFields\"").contains("SUBMITTED").contains("amount");

            Response submitted = send(admin, "POST", RECORDS + "/" + id + "/transitions/submit", null);
            assertThat(submitted.status()).as(submitted.body()).isEqualTo(200);
            assertThat(submitted.body()).contains("\"status\":\"SUBMITTED\"");
            version = version(submitted);

            Response put = send(admin, "PUT", RECORDS + "/" + id,
                    "{\"code\":\"EDITED\",\"amount\":2500,\"version\":" + version + "}");
            assertThat(put.status()).as(put.body()).isEqualTo(200);
            assertThat(put.body()).contains("\"status\":\"SUBMITTED\"");
            assertThat(put.body()).containsPattern("\"amount\":2500(\\.0+)?[,}]");
            // beforeSave uppercases code on create; editableFields must keep that value on PUT.
            assertThat(put.body()).contains("\"code\":\"EDIT-FIELDS-1\"");
        } finally {
            if (id != null) {
                send(admin, "DELETE", RECORDS + "/" + id, null);
            }
        }
    }

    private static String id(Response response) {
        Matcher matcher = ID.matcher(response.body());
        assertThat(matcher.find()).as(response.body()).isTrue();
        return matcher.group(1);
    }

    private static long version(Response response) {
        Matcher matcher = VERSION.matcher(response.body());
        assertThat(matcher.find()).as(response.body()).isTrue();
        return Long.parseLong(matcher.group(1));
    }

    private Response send(String token, String method, String path, String body) throws Exception {
        HttpRequest request = HttpRequest.newBuilder(uri(path))
                .timeout(Duration.ofSeconds(20))
                .header("Authorization", "Bearer " + token)
                .header("Content-Type", "application/json")
                .method(method, body == null ? HttpRequest.BodyPublishers.noBody() : HttpRequest.BodyPublishers.ofString(body))
                .build();
        HttpResponse<String> response = http.send(request, HttpResponse.BodyHandlers.ofString());
        return new Response(response.statusCode(), response.body());
    }

    private String admin() throws Exception {
        HttpRequest request = HttpRequest.newBuilder(uri("/api/public/lab/session"))
                .timeout(Duration.ofSeconds(20))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString("{\"email\":\"admin@host.local\"}"))
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

    private record Response(int status, String body) {
    }
}
