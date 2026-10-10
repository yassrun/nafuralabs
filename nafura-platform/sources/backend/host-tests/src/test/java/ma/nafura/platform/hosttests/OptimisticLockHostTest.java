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
 * Optimistic lock on record updates: stale or missing {@code version} → 409 {@code OPTIMISTIC_LOCK};
 * a matching version → 200 and an incremented version.
 */
@SpringBootTest(classes = AllCapabilitiesApplication.class, webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class OptimisticLockHostTest {

    private static final Pattern ACCESS_TOKEN = Pattern.compile("\"accessToken\"\\s*:\\s*\"([^\"]+)\"");
    private static final Pattern ID = Pattern.compile("\"id\"\\s*:\\s*\"([0-9a-f-]{36})\"");
    private static final Pattern VERSION = Pattern.compile("\"version\"\\s*:\\s*(\\d+)");
    private static final String RECORDS = "/api/v1/probe/records";

    private final HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();

    @Autowired
    private Environment environment;

    @Test
    void staleVersionYields409AndCurrentVersionSucceeds() throws Exception {
        String admin = admin();
        Response created = send(admin, "POST", RECORDS, "{\"code\":\"lock-1\",\"amount\":10}");
        assertThat(created.status()).as(created.body()).isEqualTo(201);
        assertThat(created.body()).contains("\"version\":0");
        String id = id(created);
        long version = version(created);

        Response first = send(admin, "PUT", RECORDS + "/" + id,
                "{\"code\":\"LOCK-1\",\"amount\":11,\"version\":" + version + "}");
        assertThat(first.status()).as(first.body()).isEqualTo(200);
        assertThat(first.body()).contains("\"version\":1");
        long next = version(first);

        Response stale = send(admin, "PUT", RECORDS + "/" + id,
                "{\"code\":\"LOCK-1\",\"amount\":12,\"version\":" + version + "}");
        assertThat(stale.status()).as(stale.body()).isEqualTo(409);
        assertThat(stale.body()).contains("OPTIMISTIC_LOCK", "modified by someone else");

        Response missing = send(admin, "PUT", RECORDS + "/" + id, "{\"code\":\"LOCK-1\",\"amount\":12}");
        assertThat(missing.status()).as(missing.body()).isEqualTo(409);
        assertThat(missing.body()).contains("OPTIMISTIC_LOCK");

        Response ok = send(admin, "PUT", RECORDS + "/" + id,
                "{\"code\":\"LOCK-1\",\"amount\":12,\"version\":" + next + "}");
        assertThat(ok.status()).as(ok.body()).isEqualTo(200);
        assertThat(ok.body()).contains("\"version\":2").containsPattern("\"amount\":12(\\.0+)?[,}]");

        // Do not leave rows that would skew shared-DB host-tests (aggregates, seed counts).
        assertThat(send(admin, "DELETE", RECORDS + "/" + id, null).status()).isEqualTo(204);
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
