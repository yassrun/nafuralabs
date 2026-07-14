package ma.nafura.usageops.federation.service;

import lombok.RequiredArgsConstructor;
import ma.nafura.usageops.federation.client.ProductUsageClient;
import ma.nafura.usageops.federation.config.UsageOpsProperties;
import ma.nafura.usageops.federation.dto.FederatedUsageDtos.AiFeatureRow;
import ma.nafura.usageops.federation.dto.FederatedUsageDtos.AiTenantRow;
import ma.nafura.usageops.federation.dto.FederatedUsageDtos.AiTimeseriesPoint;
import ma.nafura.usageops.federation.dto.FederatedUsageDtos.StorageTenantRow;
import ma.nafura.usageops.federation.dto.FederatedUsageDtos.TenantInfo;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UsageFederationService {

    private final ProductUsageClient productUsageClient;

    public List<TenantInfo> listTenants(String authorizationHeader) {
        Map<UUID, TenantInfo> byId = new LinkedHashMap<>();
        for (UsageOpsProperties.ProductSource product : productUsageClient.products()) {
            for (TenantInfo tenant : productUsageClient.listTenants(product.getId(), authorizationHeader)) {
                byId.putIfAbsent(tenant.id(), tenant);
            }
        }
        return new ArrayList<>(byId.values());
    }

    public List<FleetTenantUsage> overview(Instant from, Instant to, String productFilter, String authorizationHeader) {
        Map<String, FleetTenantUsageBuilder> builders = new HashMap<>();

        for (UsageOpsProperties.ProductSource product : productUsageClient.products()) {
            if (productFilter != null && !productFilter.isBlank() && !productFilter.equals(product.getId())) {
                continue;
            }
            for (AiTenantRow row : productUsageClient.aiByTenant(product.getId(), from, to, authorizationHeader)) {
                if (row.tenantId() == null) {
                    continue;
                }
                FleetTenantUsageBuilder builder = builders.computeIfAbsent(row.tenantId(), FleetTenantUsageBuilder::new);
                builder.addAi(product.getId(), row);
            }
            for (StorageTenantRow row : productUsageClient.storageByTenant(product.getId(), authorizationHeader)) {
                if (row.tenantId() == null) {
                    continue;
                }
                FleetTenantUsageBuilder builder = builders.computeIfAbsent(row.tenantId(), FleetTenantUsageBuilder::new);
                builder.addStorage(product.getId(), row);
            }
        }

        // Enrich with tenant names from ERP-ish tenant lists
        for (TenantInfo tenant : listTenants(authorizationHeader)) {
            FleetTenantUsageBuilder builder = builders.computeIfAbsent(tenant.id().toString(), FleetTenantUsageBuilder::new);
            builder.name = tenant.name();
            builder.key = tenant.key();
        }

        return builders.values().stream()
                .map(FleetTenantUsageBuilder::build)
                .sorted(Comparator.comparing(FleetTenantUsage::tenantId))
                .toList();
    }

    public TenantDetailUsage tenantDetail(String tenantId, Instant from, Instant to, String authorizationHeader) {
        List<ProductBreakdown> products = new ArrayList<>();
        List<AiTimeseriesPoint> timeseries = new ArrayList<>();
        List<AiFeatureRow> features = new ArrayList<>();

        long tokensTotal = 0L;
        BigDecimal costUsd = BigDecimal.ZERO;
        long storageBytes = 0L;

        for (UsageOpsProperties.ProductSource product : productUsageClient.products()) {
            AiTenantRow ai = productUsageClient.aiByTenant(product.getId(), from, to, authorizationHeader).stream()
                    .filter(row -> tenantId.equals(row.tenantId()))
                    .findFirst()
                    .orElse(null);
            StorageTenantRow storage = productUsageClient.storageByTenant(product.getId(), authorizationHeader).stream()
                    .filter(row -> tenantId.equals(row.tenantId()))
                    .findFirst()
                    .orElse(null);

            long productTokens = ai != null ? ai.tokensTotal() : 0L;
            BigDecimal productCost = ai != null ? ai.costUsd() : BigDecimal.ZERO;
            long productStorage = storage != null ? storage.totalBytes() : 0L;

            tokensTotal += productTokens;
            costUsd = costUsd.add(productCost);
            storageBytes += productStorage;

            products.add(new ProductBreakdown(
                    product.getId(),
                    ai != null ? ai.requestCount() : 0L,
                    productTokens,
                    productCost,
                    storage != null ? storage.documentsBytes() : 0L,
                    storage != null ? storage.attachmentsBytes() : 0L,
                    productStorage
            ));

            timeseries.addAll(productUsageClient.aiTimeseries(product.getId(), tenantId, from, to, authorizationHeader));
            features.addAll(productUsageClient.aiByFeature(product.getId(), tenantId, from, to, authorizationHeader));
        }

        String name = null;
        String key = null;
        for (TenantInfo tenant : listTenants(authorizationHeader)) {
            if (tenantId.equals(tenant.id().toString())) {
                name = tenant.name();
                key = tenant.key();
                break;
            }
        }

        return new TenantDetailUsage(tenantId, key, name, tokensTotal, costUsd, storageBytes, products, timeseries, features);
    }

    public record FleetTenantUsage(
            String tenantId,
            String key,
            String name,
            long tokensTotal,
            BigDecimal costUsd,
            long storageBytes,
            List<ProductBreakdown> products
    ) {
    }

    public record ProductBreakdown(
            String productId,
            long requestCount,
            long tokensTotal,
            BigDecimal costUsd,
            long documentsBytes,
            long attachmentsBytes,
            long storageBytes
    ) {
    }

    public record TenantDetailUsage(
            String tenantId,
            String key,
            String name,
            long tokensTotal,
            BigDecimal costUsd,
            long storageBytes,
            List<ProductBreakdown> products,
            List<AiTimeseriesPoint> timeseries,
            List<AiFeatureRow> features
    ) {
    }

    private static final class FleetTenantUsageBuilder {
        private final String tenantId;
        private String key;
        private String name;
        private long tokensTotal;
        private BigDecimal costUsd = BigDecimal.ZERO;
        private long storageBytes;
        private final Map<String, ProductBreakdown> products = new LinkedHashMap<>();

        private FleetTenantUsageBuilder(String tenantId) {
            this.tenantId = tenantId;
        }

        private void addAi(String productId, AiTenantRow row) {
            tokensTotal += row.tokensTotal();
            costUsd = costUsd.add(row.costUsd() != null ? row.costUsd() : BigDecimal.ZERO);
            ProductBreakdown existing = products.get(productId);
            if (existing == null) {
                products.put(productId, new ProductBreakdown(
                        productId, row.requestCount(), row.tokensTotal(), row.costUsd(), 0L, 0L, 0L));
            } else {
                products.put(productId, new ProductBreakdown(
                        productId,
                        existing.requestCount() + row.requestCount(),
                        existing.tokensTotal() + row.tokensTotal(),
                        existing.costUsd().add(row.costUsd() != null ? row.costUsd() : BigDecimal.ZERO),
                        existing.documentsBytes(),
                        existing.attachmentsBytes(),
                        existing.storageBytes()
                ));
            }
        }

        private void addStorage(String productId, StorageTenantRow row) {
            storageBytes += row.totalBytes();
            ProductBreakdown existing = products.get(productId);
            if (existing == null) {
                products.put(productId, new ProductBreakdown(
                        productId, 0L, 0L, BigDecimal.ZERO,
                        row.documentsBytes(), row.attachmentsBytes(), row.totalBytes()));
            } else {
                products.put(productId, new ProductBreakdown(
                        productId,
                        existing.requestCount(),
                        existing.tokensTotal(),
                        existing.costUsd(),
                        row.documentsBytes(),
                        row.attachmentsBytes(),
                        row.totalBytes()
                ));
            }
        }

        private FleetTenantUsage build() {
            return new FleetTenantUsage(
                    tenantId,
                    key,
                    name,
                    tokensTotal,
                    costUsd,
                    storageBytes,
                    new ArrayList<>(products.values())
            );
        }
    }
}
