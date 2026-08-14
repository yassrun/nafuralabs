package ma.nafura.catalogue.ai;

import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import ma.nafura.platform.ai.agent.service.AgentExecutionContext;
import ma.nafura.platform.ai.agent.service.capability.EntityReadCapability;
import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.platform.framework.context.UserContext;
import ma.nafura.catalogue.domain.model.StockBalance;
import ma.nafura.catalogue.repository.StockBalanceRepository;
import org.springframework.stereotype.Component;

@Component
public class StockReadCapability implements EntityReadCapability {

    private static final Set<String> ENTITY_TYPES = Set.of(
            "stock", "stocks", "article", "articles", "item", "items", "inventory"
    );

    private final StockBalanceRepository stockBalanceRepository;

    public StockReadCapability(StockBalanceRepository stockBalanceRepository) {
        this.stockBalanceRepository = stockBalanceRepository;
    }

    @Override
    public boolean supports(String entityType, String operation) {
        if (entityType == null || operation == null) {
            return false;
        }
        String normalized = entityType.toLowerCase(Locale.ROOT).replace('_', '-');
        return ENTITY_TYPES.contains(normalized)
                && ("list".equals(operation) || "count".equals(operation) || "summarize".equals(operation));
    }

    @Override
    public EntityReadResult read(EntityReadRequest request, AgentExecutionContext context) {
        if (!hasReadPermission()) {
            return EntityReadResult.builder()
                    .success(false)
                    .message("You don't have permission to read stock")
                    .payload(Map.of())
                    .build();
        }

        UUID tenantId = TenantContext.getTenantId();
        if (tenantId == null) {
            return EntityReadResult.builder()
                    .success(false)
                    .message("Tenant context is required")
                    .payload(Map.of())
                    .build();
        }

        List<StockBalance> balances = stockBalanceRepository.findByTenantId(tenantId);
        long distinctArticles = balances.stream()
                .map(StockBalance::getItemId)
                .filter(id -> id != null)
                .distinct()
                .count();
        long linesWithStock = balances.stream()
                .filter(b -> b.getQuantity() != null && b.getQuantity().signum() > 0)
                .count();

        Map<String, Object> payload = new HashMap<>();
        payload.put("entityType", "stock");
        payload.put("totalCount", distinctArticles);
        payload.put("count", distinctArticles);
        payload.put("linesWithStock", linesWithStock);
        payload.put("metric", "Articles en stock");
        payload.put("route", "/inventory/stock");

        return EntityReadResult.builder()
                .success(true)
                .message("Found " + distinctArticles + " article(s) in stock")
                .payload(payload)
                .build();
    }

    private boolean hasReadPermission() {
        if (UserContext.isSuperAdmin()) {
            return true;
        }
        return UserContext.hasPermission("inventory.stock.read")
                || UserContext.hasPermission("stock.stock.read");
    }
}
