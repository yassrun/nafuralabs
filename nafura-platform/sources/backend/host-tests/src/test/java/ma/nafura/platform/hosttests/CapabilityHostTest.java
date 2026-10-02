package ma.nafura.platform.hosttests;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.InputStream;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeSet;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.env.Environment;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.servlet.mvc.method.RequestMappingInfo;
import org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerMapping;

/**
 * Boots the platform with every capability except {@code nafura.test.disabled-capabilities},
 * then proves each capability is on or off through its catalog probe, and that no GET answers 5xx.
 */
@SpringBootTest(classes = AllCapabilitiesApplication.class, webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class CapabilityHostTest {

    private static final Pattern PATH_VARIABLE = Pattern.compile("\\{[^}]+}");
    private static final Pattern ACCESS_TOKEN = Pattern.compile("\"accessToken\"\\s*:\\s*\"([^\"]+)\"");

    private final HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();

    @Autowired
    private Environment environment;

    @Autowired
    @Qualifier("requestMappingHandlerMapping")
    private RequestMappingHandlerMapping handlerMapping;

    @Test
    void healthIsUp() throws Exception {
        HttpResponse<String> response = send(get("/actuator/health").build());

        assertThat(response.statusCode()).isEqualTo(200);
        assertThat(response.body()).contains("\"status\":\"UP\"");
    }

    @Test
    void protectedApisRejectAnonymousCallers() throws Exception {
        assertThat(send(get("/api/v1/listing-views").build()).statusCode()).isEqualTo(401);
    }

    @Test
    void everyCapabilityIsOnOrOffAsConfigured() throws Exception {
        Set<String> disabled = disabledCapabilities();
        String token = labToken();
        List<String> wrong = new ArrayList<>();

        for (JsonNode capability : catalog().path("capabilities")) {
            String id = capability.path("id").asText();
            boolean expectedOn = !disabled.contains(id);
            JsonNode probe = capability.path("probe");
            boolean actualOn;
            if (probe.has("class")) {
                actualOn = classPresent(probe.path("class").asText());
            } else {
                int status = send(get(probe.path("get").asText()).header("Authorization", "Bearer " + token).build())
                        .statusCode();
                actualOn = status != 404;
                if (status >= 500) {
                    wrong.add(id + ": probe answered " + status);
                }
            }
            if (actualOn != expectedOn) {
                wrong.add(id + ": expected " + (expectedOn ? "on" : "off") + " but is " + (actualOn ? "on" : "off"));
            }
        }

        assertThat(wrong).as("capabilities not matching configuration (disabled=%s)", disabled).isEmpty();
    }

    @Test
    void everyGetEndpointAnswersWithoutServerError() throws Exception {
        String token = labToken();
        List<String> paths = getPaths();
        List<String> failures = new ArrayList<>();

        for (String path : paths) {
            HttpRequest request = get(path).header("Authorization", "Bearer " + token).build();
            try {
                HttpResponse<InputStream> response = http.send(request, HttpResponse.BodyHandlers.ofInputStream());
                try (InputStream body = response.body()) {
                    if (response.statusCode() >= 500) {
                        failures.add(response.statusCode() + " GET " + path + " " + new String(body.readNBytes(300)));
                    }
                }
            } catch (java.net.http.HttpTimeoutException timeout) {
                failures.add("timeout GET " + path);
            }
        }

        assertThat(paths).as("GET endpoints discovered").hasSizeGreaterThan(10);
        assertThat(failures).as("GET endpoints answering 5xx with a lab token").isEmpty();
    }

    static Set<String> disabledCapabilities() {
        return Arrays.stream(System.getProperty("nafura.test.disabled-capabilities", "").split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toCollection(TreeSet::new));
    }

    private static JsonNode catalog() throws Exception {
        return new ObjectMapper().readTree(Files.readString(Path.of(System.getProperty("nafura.test.catalog"))));
    }

    private static boolean classPresent(String name) {
        try {
            Class.forName(name, false, CapabilityHostTest.class.getClassLoader());
            return true;
        } catch (ClassNotFoundException absent) {
            return false;
        }
    }

    private List<String> getPaths() {
        TreeSet<String> paths = new TreeSet<>();
        Map<RequestMappingInfo, ?> methods = handlerMapping.getHandlerMethods();
        methods.keySet().forEach((RequestMappingInfo info) -> {
            var verbs = info.getMethodsCondition().getMethods();
            if (!verbs.isEmpty() && !verbs.contains(RequestMethod.GET)) {
                return;
            }
            if (info.getPathPatternsCondition() == null) {
                return;
            }
            // Server-sent event streams stay open by design.
            if (info.getProducesCondition().getProducibleMediaTypes().contains(MediaType.TEXT_EVENT_STREAM)) {
                return;
            }
            for (String pattern : info.getPathPatternsCondition().getPatternValues()) {
                if (pattern.contains("*") || pattern.equals("/error")) {
                    continue;
                }
                paths.add(PATH_VARIABLE.matcher(pattern).replaceAll(UUID.randomUUID().toString()));
            }
        });
        return new ArrayList<>(paths);
    }

    private String labToken() throws Exception {
        HttpRequest request = HttpRequest.newBuilder(uri("/api/public/lab/session"))
                .timeout(Duration.ofSeconds(20))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString("{\"email\":\"admin@host.local\"}"))
                .build();
        HttpResponse<String> response = send(request);
        assertThat(response.statusCode()).isEqualTo(200);
        Matcher matcher = ACCESS_TOKEN.matcher(response.body());
        assertThat(matcher.find()).isTrue();
        return matcher.group(1);
    }

    private HttpRequest.Builder get(String path) {
        return HttpRequest.newBuilder(uri(path)).timeout(Duration.ofSeconds(20)).GET();
    }

    private HttpResponse<String> send(HttpRequest request) throws Exception {
        return http.send(request, HttpResponse.BodyHandlers.ofString());
    }

    private URI uri(String path) {
        return URI.create("http://127.0.0.1:" + environment.getProperty("local.server.port") + path);
    }
}
