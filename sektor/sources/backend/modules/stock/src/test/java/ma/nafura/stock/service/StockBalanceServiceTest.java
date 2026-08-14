package ma.nafura.stock.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import ma.nafura.stock.mapper.StockBalanceMapper;
import ma.nafura.stock.repository.StockBalanceRepository;
import ma.nafura.stock.repository.StockBalanceRepository.ItemQuantityProjection;
import ma.nafura.platform.framework.context.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class StockBalanceServiceTest {

    private static final UUID TENANT_ID = UUID.fromString("00000000-0000-4000-8000-000000000001");
    private static final UUID ITEM_A = UUID.fromString("11111111-1111-4111-8111-111111111111");
    private static final UUID ITEM_B = UUID.fromString("22222222-2222-4222-8222-222222222222");

    @Mock
    private StockBalanceRepository repository;

    @Mock
    private StockBalanceMapper mapper;

    @InjectMocks
    private StockBalanceService service;

    @BeforeEach
    void setUp() {
        TenantContext.setTenantId(TENANT_ID);
        TenantContext.setTenantEnabled(true);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void aggregateQuantityByItemIdsReturnsProjections() {
        ItemQuantityProjection rowA = projection(ITEM_A, new BigDecimal("12.5"));
        when(repository.aggregateQuantityByItemIds(eq(TENANT_ID), anyList())).thenReturn(List.of(rowA));

        var result = service.aggregateQuantityByItemIds(List.of(ITEM_A, ITEM_B));

        assertEquals(2, result.size());
        assertEquals(ITEM_A, result.get(0).itemId());
        assertEquals(0, new BigDecimal("12.5").compareTo(result.get(0).totalQuantity()));
        assertEquals(ITEM_B, result.get(1).itemId());
        assertEquals(0, BigDecimal.ZERO.compareTo(result.get(1).totalQuantity()));
    }

    @Test
    void aggregateQuantityByItemIdsReturnsEmptyForNullOrEmptyInput() {
        assertTrue(service.aggregateQuantityByItemIds(null).isEmpty());
        assertTrue(service.aggregateQuantityByItemIds(List.of()).isEmpty());
        verifyNoInteractions(repository);
    }

    private static ItemQuantityProjection projection(UUID itemId, BigDecimal qty) {
        return new ItemQuantityProjection() {
            @Override
            public UUID getItemId() {
                return itemId;
            }

            @Override
            public BigDecimal getTotalQuantity() {
                return qty;
            }
        };
    }
}
