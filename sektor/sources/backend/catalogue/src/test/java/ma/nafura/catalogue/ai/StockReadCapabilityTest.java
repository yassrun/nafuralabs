package ma.nafura.catalogue.ai;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.UUID;
import ma.nafura.platform.ai.agent.service.AgentExecutionContext;
import ma.nafura.platform.ai.agent.service.capability.EntityReadCapability;
import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.platform.framework.context.UserContext;
import ma.nafura.catalogue.domain.stock.StockBalance;
import ma.nafura.catalogue.repository.StockBalanceRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class StockReadCapabilityTest {

    @Mock
    private StockBalanceRepository stockBalanceRepository;

    private StockReadCapability capability;

    @BeforeEach
    void setUp() {
        capability = new StockReadCapability(stockBalanceRepository);
        TenantContext.setTenantId(UUID.randomUUID());
        UserContext.setPermissions(java.util.Set.of("inventory.stock.read"));
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void supportsStockEntityTypes() {
        assertTrue(capability.supports("stock", "count"));
        assertTrue(capability.supports("article", "list"));
    }

    @Test
    void readReturnsDistinctArticleCount() {
        UUID item1 = UUID.randomUUID();
        UUID item2 = UUID.randomUUID();
        StockBalance b1 = new StockBalance();
        b1.setItemId(item1);
        StockBalance b2 = new StockBalance();
        b2.setItemId(item2);
        StockBalance b3 = new StockBalance();
        b3.setItemId(item1);
        when(stockBalanceRepository.findByTenantId(TenantContext.getTenantId())).thenReturn(List.of(b1, b2, b3));

        EntityReadCapability.EntityReadResult result = capability.read(
                EntityReadCapability.EntityReadRequest.builder()
                        .entityType("stock")
                        .operation("count")
                        .limit(10)
                        .build(),
                AgentExecutionContext.builder().tenantId(TenantContext.getTenantId().toString()).build()
        );

        assertTrue(result.isSuccess());
        assertEqualsLong(2L, result.getPayload().get("count"));
    }

    private static void assertEqualsLong(long expected, Object actual) {
        org.junit.jupiter.api.Assertions.assertEquals(expected, ((Number) actual).longValue());
    }
}
