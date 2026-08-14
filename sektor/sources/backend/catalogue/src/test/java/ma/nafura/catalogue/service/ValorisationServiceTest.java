package ma.nafura.catalogue.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.catalogue.domain.article.Item;
import ma.nafura.catalogue.repository.ItemRepository;
import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.catalogue.domain.stock.StockBalance;
import ma.nafura.catalogue.repository.StockBalanceRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ValorisationServiceTest {

    private static final UUID TENANT_ID = UUID.fromString("00000000-0000-4000-8000-000000000001");
    private static final UUID LOCATION_ID = UUID.fromString("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa");
    private static final UUID ITEM_ID = UUID.fromString("bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb");

    @Mock
    private ItemRepository itemRepository;

    @Mock
    private StockBalanceRepository stockBalanceRepository;

    @InjectMocks
    private ValorisationService service;

    @BeforeEach
    void setUp() {
        TenantContext.setTenantId(TENANT_ID);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void twoReceptionsProduceExpectedAvco() {
        Item item = Item.builder()
                .id(ITEM_ID)
                .tenantId(TENANT_ID)
                .pmp(null)
                .prixUnitaire(BigDecimal.ZERO)
                .build();
        when(itemRepository.findByIdAndTenantId(ITEM_ID, TENANT_ID)).thenReturn(Optional.of(item));
        when(itemRepository.save(item)).thenReturn(item);

        // First reception: 10 @ 100 — balance empty
        when(stockBalanceRepository.findByTenantIdAndLocationIdAndItemId(TENANT_ID, LOCATION_ID, ITEM_ID))
                .thenReturn(Optional.empty());
        service.updatePmpOnReceipt(ITEM_ID, LOCATION_ID, new BigDecimal("10"), new BigDecimal("100"));
        assertEquals(0, item.getPmp().compareTo(new BigDecimal("100.0000")));

        // Second reception: 10 @ 200 — previous qty 10 @ 100 → PMP 150
        when(stockBalanceRepository.findByTenantIdAndLocationIdAndItemId(TENANT_ID, LOCATION_ID, ITEM_ID))
                .thenReturn(Optional.of(StockBalance.builder()
                        .quantity(new BigDecimal("10"))
                        .build()));
        service.updatePmpOnReceipt(ITEM_ID, LOCATION_ID, new BigDecimal("10"), new BigDecimal("200"));
        assertEquals(0, item.getPmp().compareTo(new BigDecimal("150.0000")));
    }
}
