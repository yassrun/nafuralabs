package ma.nafura.stock.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.item.domain.model.Item;
import ma.nafura.item.repository.ItemRepository;
import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.stock.api.dto.MagasinChantierDto;
import ma.nafura.stock.domain.model.InventoryTx;
import ma.nafura.stock.domain.model.InventoryTxLine;
import ma.nafura.stock.domain.model.Location;
import ma.nafura.stock.domain.model.StockBalance;
import ma.nafura.stock.repository.InventoryTxLineRepository;
import ma.nafura.stock.repository.InventoryTxRepository;
import ma.nafura.stock.repository.LocationRepository;
import ma.nafura.stock.repository.StockBalanceRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class MagasinChantierReadServiceTest {

    private static final UUID TENANT_ID = UUID.fromString("00000000-0000-4000-8000-000000000001");
    private static final UUID DEPOT_ID = UUID.fromString("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa");
    private static final UUID ITEM_ID = UUID.fromString("bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb");

    @Mock
    private LocationRepository locationRepository;

    @Mock
    private StockBalanceRepository stockBalanceRepository;

    @Mock
    private InventoryTxRepository inventoryTxRepository;

    @Mock
    private InventoryTxLineRepository inventoryTxLineRepository;

    @Mock
    private ItemRepository itemRepository;

    @InjectMocks
    private MagasinChantierReadService service;

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
    void getMagasinByLocationCodeAggregatesStockAndMovements() {
        Location depot = Location.builder()
                .id(DEPOT_ID)
                .tenantId(TENANT_ID)
                .code("ch-001")
                .name("Magasin Atlas")
                .type("CHANTIER")
                .isPhysical(true)
                .affectsStock(true)
                .build();
        when(locationRepository.findByTenantIdAndCode(TENANT_ID, "ch-001")).thenReturn(Optional.of(depot));

        StockBalance balance = StockBalance.builder()
                .tenantId(TENANT_ID)
                .warehouseId(DEPOT_ID)
                .itemId(ITEM_ID)
                .quantity(new BigDecimal("12"))
                .build();
        when(stockBalanceRepository.findByTenantIdAndWarehouseId(TENANT_ID, DEPOT_ID))
                .thenReturn(List.of(balance));

        Item item = Item.builder()
                .id(ITEM_ID)
                .tenantId(TENANT_ID)
                .code("CIM-001")
                .name("Ciment CPJ45")
                .pmp(new BigDecimal("85"))
                .build();
        when(itemRepository.findAllById(List.of(ITEM_ID))).thenReturn(List.of(item));

        InventoryTx tx = InventoryTx.builder()
                .id(UUID.randomUUID())
                .tenantId(TENANT_ID)
                .txNumber("REC-001")
                .txType("RECEPTION")
                .txDate(LocalDate.of(2026, 5, 1))
                .status("VALIDE")
                .warehouseId(DEPOT_ID)
                .build();
        when(inventoryTxRepository.findRecentForMagasin(eq(TENANT_ID), eq(DEPOT_ID), eq("ch-001"), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(tx)));
        when(inventoryTxLineRepository.findByTenantIdAndInventoryTxIdOrderByLineNumberAsc(
                        TENANT_ID, tx.getId()))
                .thenReturn(List.of(InventoryTxLine.builder()
                        .quantity(new BigDecimal("12"))
                        .build()));

        MagasinChantierDto dto = service.getMagasin("ch-001");

        assertEquals("ch-001", dto.chantierId());
        assertEquals("Magasin Atlas", dto.chantierLabel());
        assertEquals(DEPOT_ID, dto.depotChantierId());
        assertEquals(1, dto.stockArticles().size());
        assertEquals(new BigDecimal("1020.00"), dto.totalValorisation());
        assertEquals(1, dto.derniersMouvements().size());
        assertEquals("REC-001", dto.derniersMouvements().get(0).txNumber());
    }

    @Test
    void getMagasinUnknownKeyReturns404() {
        when(locationRepository.findByTenantIdAndCode(TENANT_ID, "missing")).thenReturn(Optional.empty());
        when(inventoryTxRepository.findByTenantIdAndChantierBudgetId(
                        eq(TENANT_ID), eq("missing"), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of()));

        assertThrows(ResponseStatusException.class, () -> service.getMagasin("missing"));
    }
}
