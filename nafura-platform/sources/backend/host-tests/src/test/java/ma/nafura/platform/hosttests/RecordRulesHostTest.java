package ma.nafura.platform.hosttests;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import ma.nafura.platform.framework.domain.TenantEntity;
import ma.nafura.platform.framework.record.RecordController;
import ma.nafura.platform.framework.record.RecordRepository;
import ma.nafura.platform.scope.security.scope.DefaultScopeService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.env.Environment;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;

/**
 * The rules of a record (validate, beforeSave, afterSave, beforeDelete, readOnlyFields) run on every write of the
 * API and of the seed, inside the transaction. Fixture: ProbeRecordController (code without spaces, upper-cased,
 * {@code reference} computed and read-only, amount never lowered, FAIL-AFTER* fails after the save, KEEP-* kept).
 */
@SpringBootTest(classes = AllCapabilitiesApplication.class, webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class RecordRulesHostTest {

    private static final Pattern ACCESS_TOKEN = Pattern.compile("\"accessToken\"\\s*:\\s*\"([^\"]+)\"");
    private static final Pattern ID = Pattern.compile("\"id\"\\s*:\\s*\"([0-9a-f-]{36})\"");
    private static final Pattern VERSION = Pattern.compile("\"version\"\\s*:\\s*(\\d+)");
    private static final String RECORDS = "/api/v1/probe/records";

    private final HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();

    @Autowired
    private Environment environment;

    @Autowired
    private JdbcTemplate jdbc;

    @Autowired
    private DefaultScopeService scopes;

    @Test
    void createRunsTheRulesAndIgnoresReadOnlyFields() throws Exception {
        Response created = send(admin(), "POST", RECORDS, "{\"code\":\"r-10\",\"amount\":5,\"reference\":\"HACK\"}");
        assertThat(created.status()).as(created.body()).isEqualTo(201);
        assertThat(created.body()).contains("\"code\":\"R-10\"", "\"reference\":\"REF-R-10\"").doesNotContain("HACK");
    }

    @Test
    void validateRefusesWithFieldErrorsAndStoresNothing() throws Exception {
        Response refused = send(admin(), "POST", RECORDS, "{\"code\":\"a b\",\"amount\":5}");
        assertThat(refused.status()).isEqualTo(422);
        assertThat(refused.body()).contains("\"fieldErrors\"", "\"field\":\"code\"", "Sans espace");
        assertThat(count("A B")).isZero();
    }

    @Test
    void updateComparesWithTheStoredRecordAndKeepsReadOnlyFields() throws Exception {
        String admin = admin();
        Response created = send(admin, "POST", RECORDS, "{\"code\":\"r-11\",\"amount\":10}");
        String id = id(created);
        long version = version(created);

        Response lowered = send(admin, "PUT", RECORDS + "/" + id,
                "{\"code\":\"R-11\",\"amount\":5,\"version\":" + version + "}");
        assertThat(lowered.status()).isEqualTo(422);
        assertThat(lowered.body()).contains("\"field\":\"amount\"", "Ne peut pas baisser");

        Response raised = send(admin, "PUT", RECORDS + "/" + id,
                "{\"code\":\"R-11\",\"amount\":20,\"reference\":\"HACK\",\"version\":" + version + "}");
        assertThat(raised.status()).as(raised.body()).isEqualTo(200);
        assertThat(raised.body()).containsPattern("\"amount\":20(\\.0+)?[,}]").contains("\"reference\":\"REF-R-11\"");
    }

    @Test
    void afterSaveRunsInTheTransaction() throws Exception {
        Response failed = send(admin(), "POST", RECORDS, "{\"code\":\"fail-after-1\",\"amount\":5}");
        assertThat(failed.status()).isEqualTo(409);
        assertThat(failed.body()).contains("RECORD_REFUSED", "afterSave a échoué");
        assertThat(count("FAIL-AFTER-1")).isZero();
    }

    @Test
    void beforeDeleteCanKeepTheRecord() throws Exception {
        String admin = admin();
        String kept = id(send(admin, "POST", RECORDS, "{\"code\":\"keep-1\",\"amount\":5}"));
        Response refused = send(admin, "DELETE", RECORDS + "/" + kept, null);
        assertThat(refused.status()).isEqualTo(409);
        assertThat(refused.body()).contains("RECORD_REFUSED", "Enregistrement protégé");
        assertThat(count("KEEP-1")).isEqualTo(1);

        String deleted = id(send(admin, "POST", RECORDS, "{\"code\":\"r-12\",\"amount\":5}"));
        assertThat(send(admin, "DELETE", RECORDS + "/" + deleted, null).status()).isEqualTo(204);
        assertThat(count("R-12")).isZero();
    }

    @Test
    void theSeedGoesThroughTheSameRules() {
        UUID tenant = scopes.resolveDefaultScopeId();
        assertThat(jdbc.queryForObject("SELECT reference FROM probe_record WHERE tenant_id = ? AND code = 'R-1'", String.class, tenant))
                .isEqualTo("REF-R-1");
    }

    @Test
    void redefiningAnEndpointFailsStartup() throws Exception {
        Method refuse = RecordController.class.getDeclaredMethod("refuseRedefinedWriteEndpoints");
        refuse.setAccessible(true);
        assertThatThrownBy(() -> {
            try {
                refuse.invoke(new RedefinesCreate());
            } catch (InvocationTargetException e) {
                throw e.getCause();
            }
        }).isInstanceOf(IllegalStateException.class).hasMessageContaining("redefines the endpoint create()");
    }

    /** A controller that redefines an endpoint instead of using the rules. */
    static class RedefinesCreate extends RecordController<TenantEntity> {
        @Override
        protected RecordRepository<TenantEntity> repository() {
            return null;
        }

        @Override
        public ResponseEntity<TenantEntity> create(TenantEntity body) {
            return null;
        }
    }

    private int count(String code) {
        UUID tenant = scopes.resolveDefaultScopeId();
        Integer found = jdbc.queryForObject("SELECT count(*) FROM probe_record WHERE tenant_id = ? AND code = ?", Integer.class, tenant, code);
        return found == null ? 0 : found;
    }

    private static String id(Response response) {
        assertThat(response.status()).as(response.body()).isEqualTo(201);
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
