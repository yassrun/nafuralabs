package ma.nafura.stock.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.stock.api.request.InventoryTxLineInputDto;
import ma.nafura.stock.api.request.InventoryTxWithLinesCreateDto;
import ma.nafura.stock.domain.model.InventoryTx;
import ma.nafura.stock.domain.model.InventoryTxLine;
import ma.nafura.stock.domain.model.StockBalance;
import ma.nafura.stock.mapper.InventoryTxMapper;
import ma.nafura.stock.repository.InventoryTxLineRepository;
import ma.nafura.stock.repository.InventoryTxRepository;
import ma.nafura.stock.repository.StockBalanceRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class InventoryTxServiceTest {

    private static final UUID TENANT_ID = UUID.fromString("00000000-0000-4000-8000-000000000001");
    private static final UUID WAREHOUSE_ID = UUID.fromString("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa");
    private static final UUID ITEM_ID = UUID.fromString("bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb");

    @Mock
    private InventoryTxRepository inventoryTxRepository;

    @Mock
    private InventoryTxMapper mapper;

    @Mock
    private InventoryTxLineRepository lineRepository;

    @Mock
    private StockBalanceRepository stockBalanceRepository;

    @Mock
    private StockReservationService stockReservationService;

    @InjectMocks
    private InventoryTxService service;

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
    void validateReceptionIncreasesStockBalance() {
        UUID txId = UUID.randomUUID();
        InventoryTx tx = InventoryTx.builder()
                .id(txId)
                .tenantId(TENANT_ID)
                .txNumber("REC-1")
                .txType("RECEPTION")
                .warehouseId(WAREHOUSE_ID)
                .destLocationId(WAREHOUSE_ID)
                .txDate(LocalDate.now())
                .status(InventoryTxService.STATUS_BROUILLON)
                .build();

        InventoryTxLine line = InventoryTxLine.builder()
                .tenantId(TENANT_ID)
                .inventoryTxId(txId)
                .lineNumber(1)
                .itemId(ITEM_ID)
                .quantity(new BigDecimal("5"))
                .build();

        when(inventoryTxRepository.findByIdAndTenantId(txId, TENANT_ID)).thenReturn(Optional.of(tx));
        when(lineRepository.findByTenantIdAndInventoryTxIdOrderByLineNumberAsc(TENANT_ID, txId))
                .thenReturn(List.of(line));
        when(stockBalanceRepository.findByTenantIdAndWarehouseIdAndItemId(TENANT_ID, WAREHOUSE_ID, ITEM_ID))
                .thenReturn(Optional.empty());
        when(stockBalanceRepository.save(any(StockBalance.class)))
                .thenAnswer(inv -> inv.getArgument(0));
        when(inventoryTxRepository.save(any(InventoryTx.class))).thenAnswer(inv -> inv.getArgument(0));

        InventoryTx validated = service.validate(txId);

        assertEquals(InventoryTxService.STATUS_VALIDE, validated.getStatus());
        verify(stockBalanceRepository).save(argThat(b -> b.getQuantity().compareTo(new BigDecimal("5")) == 0));
    }

    @Test
    void validateInventaireSetsCountedQuantity() {
        UUID txId = UUID.randomUUID();
        InventoryTx tx = InventoryTx.builder()
                .id(txId)
                .tenantId(TENANT_ID)
                .txNumber("INV-1")
                .txType("INVENTAIRE")
                .warehouseId(WAREHOUSE_ID)
                .destLocationId(WAREHOUSE_ID)
                .txDate(LocalDate.now())
                .status(InventoryTxService.STATUS_BROUILLON)
                .build();

        InventoryTxLine line = InventoryTxLine.builder()
                .tenantId(TENANT_ID)
                .inventoryTxId(txId)
                .lineNumber(1)
                .itemId(ITEM_ID)
                .quantity(new BigDecimal("10"))
                .theoreticalQty(new BigDecimal("10"))
                .countedQty(new BigDecimal("7"))
                .build();

        when(inventoryTxRepository.findByIdAndTenantId(txId, TENANT_ID)).thenReturn(Optional.of(tx));
        when(lineRepository.findByTenantIdAndInventoryTxIdOrderByLineNumberAsc(TENANT_ID, txId))
                .thenReturn(List.of(line));
        when(stockBalanceRepository.findByTenantIdAndWarehouseIdAndItemId(TENANT_ID, WAREHOUSE_ID, ITEM_ID))
                .thenReturn(Optional.of(StockBalance.builder()
                        .tenantId(TENANT_ID)
                        .warehouseId(WAREHOUSE_ID)
                        .itemId(ITEM_ID)
                        .quantity(new BigDecimal("10"))
                        .reservedQuantity(BigDecimal.ZERO)
                        .availableQuantity(new BigDecimal("10"))
                        .build()));
        when(stockBalanceRepository.save(any(StockBalance.class)))
                .thenAnswer(inv -> inv.getArgument(0));
        when(inventoryTxRepository.save(any(InventoryTx.class))).thenAnswer(inv -> inv.getArgument(0));

        service.validate(txId);

        verify(stockBalanceRepository).save(argThat(b -> b.getQuantity().compareTo(new BigDecimal("7")) == 0));
    }

    @Test
    void createWithLinesSetsBrouillonStatus() {
        when(inventoryTxRepository.existsByTenantIdAndTxNumber(eq(TENANT_ID), anyString())).thenReturn(false);
        when(inventoryTxRepository.save(any(InventoryTx.class)))
                .thenAnswer(inv -> {
                    InventoryTx saved = inv.getArgument(0);
                    saved.setId(UUID.randomUUID());
                    return saved;
                });
        when(lineRepository.save(any(InventoryTxLine.class))).thenAnswer(inv -> inv.getArgument(0));

        InventoryTxLineInputDto lineDto = new InventoryTxLineInputDto();
        lineDto.setLineNumber(1);
        lineDto.setItemId(ITEM_ID);
        lineDto.setQuantity(new BigDecimal("2"));

        InventoryTxWithLinesCreateDto dto = new InventoryTxWithLinesCreateDto();
        dto.setTxType("RECEPTION");
        dto.setDestLocationId(WAREHOUSE_ID);
        dto.setLines(List.of(lineDto));

        var detail = service.createWithLines(dto);

        assertEquals(InventoryTxService.STATUS_BROUILLON, detail.tx().getStatus());
        assertEquals(1, detail.lines().size());
    }
}
