package ma.nafura.usageops.federation.client;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.nafura.usageops.federation.config.UsageOpsProperties;
import ma.nafura.usageops.federation.dto.FederatedUsageDtos.AiFeatureRow;
import ma.nafura.usageops.federation.dto.FederatedUsageDtos.AiSummary;
import ma.nafura.usageops.federation.dto.FederatedUsageDtos.AiTenantRow;
import ma.nafura.usageops.federation.dto.FederatedUsageDtos.AiTimeseriesPoint;
import ma.nafura.usageops.federation.dto.FederatedUsageDtos.StorageSummary;
import ma.nafura.usageops.federation.dto.FederatedUsageDtos.StorageTenantRow;
import ma.nafura.usageops.federation.dto.FederatedUsageDtos.TenantInfo;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class ProductUsageClient {

    private final UsageOpsProperties properties;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .build();

    public List<TenantInfo> listTenants(String productId, String authorizationHeader) {
        UsageOpsProperties.ProductSource source = requireSource(productId);
        List<Map<String, Object>> rows = getList(source, "/api/v1/platform/usage/tenants", authorizationHeader);
        return rows.stream()
                .map(row -> new TenantInfo(
                        toUuid(row.get("id")),
                        asString(row.get("key")),
                        asString(row.get("name")),
                        asString(row.get("applicationId")),
                        productId
                ))
                .toList();
    }

    public AiSummary aiSummary(String productId, String tenantId, Instant from, Instant to, String authorizationHeader) {
        UsageOpsProperties.ProductSource source = requireSource(productId);
        String path = "/api/v1/platform/usage/ai/summary" + query(tenantId, from, to);
        Map<String, Object> row = getObject(source, path, authorizationHeader);
        return new AiSummary(
                toLong(row.get("requestCount")),
                toLong(row.get("tokensIn")),
                toLong(row.get("tokensOut")),
                toLong(row.get("tokensTotal")),
                toBigDecimal(row.get("costUsd")),
                from,
                to
        );
    }

    public List<AiTenantRow> aiByTenant(String productId, Instant from, Instant to, String authorizationHeader) {
        UsageOpsProperties.ProductSource source = requireSource(productId);
        String path = "/api/v1/platform/usage/ai/by-tenant" + query(null, from, to);
        return getList(source, path, authorizationHeader).stream()
                .map(row -> new AiTenantRow(
                        asString(row.get("tenantId")),
                        toLong(row.get("requestCount")),
                        toLong(row.get("tokensIn")),
                        toLong(row.get("tokensOut")),
                        toLong(row.get("tokensTotal")),
                        toBigDecimal(row.get("costUsd"))
                ))
                .toList();
    }

    public List<AiTimeseriesPoint> aiTimeseries(String productId, String tenantId, Instant from, Instant to,
                                                String authorizationHeader) {
        UsageOpsProperties.ProductSource source = requireSource(productId);
        String path = "/api/v1/platform/usage/ai/timeseries" + query(tenantId, from, to);
        return getList(source, path, authorizationHeader).stream()
                .map(row -> new AiTimeseriesPoint(
                        toInstant(row.get("day")),
                        toLong(row.get("requestCount")),
                        toLong(row.get("tokensTotal")),
                        toBigDecimal(row.get("costUsd"))
                ))
                .toList();
    }

    public List<AiFeatureRow> aiByFeature(String productId, String tenantId, Instant from, Instant to,
                                          String authorizationHeader) {
        UsageOpsProperties.ProductSource source = requireSource(productId);
        String path = "/api/v1/platform/usage/ai/by-feature" + query(tenantId, from, to);
        return getList(source, path, authorizationHeader).stream()
                .map(row -> new AiFeatureRow(
                        asString(row.get("applicationId")),
                        asString(row.get("featureKey")),
                        toLong(row.get("requestCount")),
                        toLong(row.get("tokensTotal")),
                        toBigDecimal(row.get("costUsd"))
                ))
                .toList();
    }

    public StorageSummary storageSummary(String productId, UUID tenantId, String authorizationHeader) {
        UsageOpsProperties.ProductSource source = requireSource(productId);
        StringBuilder path = new StringBuilder("/api/v1/platform/usage/storage/summary");
        if (tenantId != null) {
            path.append("?tenantId=").append(tenantId);
        }
        Map<String, Object> row = getObject(source, path.toString(), authorizationHeader);
        return new StorageSummary(
                toLong(row.get("documentsBytes")),
                toLong(row.get("attachmentsBytes")),
                toLong(row.get("totalBytes"))
        );
    }

    public List<StorageTenantRow> storageByTenant(String productId, String authorizationHeader) {
        UsageOpsProperties.ProductSource source = requireSource(productId);
        return getList(source, "/api/v1/platform/usage/storage/by-tenant", authorizationHeader).stream()
                .map(row -> new StorageTenantRow(
                        asString(row.get("tenantId")),
                        toLong(row.get("documentsBytes")),
                        toLong(row.get("attachmentsBytes")),
                        toLong(row.get("totalBytes"))
                ))
                .toList();
    }

    public List<UsageOpsProperties.ProductSource> products() {
        return properties.getProducts();
    }

    private UsageOpsProperties.ProductSource requireSource(String productId) {
        return properties.getProducts().stream()
                .filter(p -> productId.equals(p.getId()))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Unknown product: " + productId));
    }

    private String query(String tenantId, Instant from, Instant to) {
        StringBuilder sb = new StringBuilder("?");
        boolean first = true;
        if (tenantId != null && !tenantId.isBlank()) {
            sb.append("tenantId=").append(encode(tenantId));
            first = false;
        }
        if (from != null) {
            if (!first) {
                sb.append('&');
            }
            sb.append("from=").append(encode(from.toString()));
            first = false;
        }
        if (to != null) {
            if (!first) {
                sb.append('&');
            }
            sb.append("to=").append(encode(to.toString()));
        }
        return sb.length() == 1 ? "" : sb.toString();
    }

    private Map<String, Object> getObject(UsageOpsProperties.ProductSource source, String path, String authorizationHeader) {
        try {
            String body = exchange(source, path, authorizationHeader);
            if (body == null || body.isBlank()) {
                return Collections.emptyMap();
            }
            return objectMapper.readValue(body, new TypeReference<>() {
            });
        } catch (Exception ex) {
            log.warn("Failed to fetch {}{}: {}", source.getId(), path, ex.getMessage());
            return Collections.emptyMap();
        }
    }

    private List<Map<String, Object>> getList(UsageOpsProperties.ProductSource source, String path, String authorizationHeader) {
        try {
            String body = exchange(source, path, authorizationHeader);
            if (body == null || body.isBlank()) {
                return List.of();
            }
            return objectMapper.readValue(body, new TypeReference<>() {
            });
        } catch (Exception ex) {
            log.warn("Failed to fetch {}{}: {}", source.getId(), path, ex.getMessage());
            return List.of();
        }
    }

    private String exchange(UsageOpsProperties.ProductSource source, String path, String authorizationHeader) throws Exception {
        String base = source.getBaseUrl();
        if (base.endsWith("/")) {
            base = base.substring(0, base.length() - 1);
        }
        HttpRequest.Builder builder = HttpRequest.newBuilder()
                .uri(URI.create(base + path))
                .timeout(Duration.ofSeconds(20))
                .GET();
        if (authorizationHeader != null && !authorizationHeader.isBlank()) {
            builder.header(HttpHeaders.AUTHORIZATION, authorizationHeader);
        }
        HttpResponse<String> response = httpClient.send(builder.build(), HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() >= 400) {
            throw new IllegalStateException("HTTP " + response.statusCode() + " from " + source.getId()
                    + path + ": " + truncate(response.body()));
        }
        return response.body();
    }

    private static String truncate(String body) {
        if (body == null) {
            return "";
        }
        String trimmed = body.replace('\n', ' ').trim();
        return trimmed.length() > 240 ? trimmed.substring(0, 240) + "..." : trimmed;
    }

    private static String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }

    private static String asString(Object value) {
        return value == null ? null : value.toString();
    }

    private static UUID toUuid(Object value) {
        if (value == null) {
            return null;
        }
        return UUID.fromString(value.toString());
    }

    private static long toLong(Object value) {
        if (value == null) {
            return 0L;
        }
        if (value instanceof Number number) {
            return number.longValue();
        }
        return Long.parseLong(value.toString());
    }

    private static BigDecimal toBigDecimal(Object value) {
        if (value == null) {
            return BigDecimal.ZERO;
        }
        if (value instanceof BigDecimal bd) {
            return bd;
        }
        if (value instanceof Number number) {
            return BigDecimal.valueOf(number.doubleValue());
        }
        return new BigDecimal(value.toString());
    }

    private static Instant toInstant(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof Instant instant) {
            return instant;
        }
        return Instant.parse(value.toString());
    }
}
