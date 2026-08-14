package ma.nafura.catalogue.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicReference;
import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.catalogue.api.request.InventoryTxLineInputDto;
import ma.nafura.catalogue.api.request.InventoryTxWithLinesCreateDto;
import ma.nafura.catalogue.domain.stock.InventoryTx;
import ma.nafura.catalogue.domain.stock.InventoryTxLine;
import ma.nafura.catalogue.domain.stock.Location;
import ma.nafura.catalogue.domain.stock.StockBalance;
import ma.nafura.catalogue.domain.stock.StockMove;
import ma.nafura.catalogue.mapper.InventoryTxMapper;
import ma.nafura.catalogue.repository.InventoryTxLineRepository;
import ma.nafura.catalogue.repository.InventoryTxRepository;
import ma.nafura.catalogue.repository.InventoryTxSequenceRepository;
import ma.nafura.catalogue.repository.LocationRepository;
import ma.nafura.catalogue.repository.StockBalanceRepository;
import ma.nafura.catalogue.repository.StockMoveRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class InventoryTxServiceTest {

    private static final UUID TENANT_ID = UUID.fromString("00000000-0000-4000-8000-000000000001");
    private static final UUID LOCATION_ID = UUID.fromString("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa");
    private static final UUID ITEM_ID = UUID.fromString("bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb");
    private static final UUID AJUSTEMENT_ID = UUID.fromString("cccccccc-cccc-4ccc-8ccc-cccccccccccc");

    @Mock private InventoryTxRepository inventoryTxRepository;
    @Mock private InventoryTxMapper mapper;
    @Mock private InventoryTxLineRepository lineRepository;
    @Mock private StockBalanceRepository stockBalanceRepository;
    @Mock private StockMoveRepository stockMoveRepository;
    @Mock private StockReservationService stockReservationService;
    @Mock private CostingMethodResolver costingMethodResolver;
    @Mock private ValorisationService valorisationService;
    @Mock private LocationRepository locationRepository;
    @Mock private InventoryTxSequenceRepository sequenceRepository;

    private InventoryTxService service;
    private final List<StockMove> savedMoves = new ArrayList<>();
    private final AtomicReference<StockBalance> balanceRef = new AtomicReference<>();

    @BeforeEach
    void setUp() {
        TenantContext.setTenantId(TENANT_ID);
        TenantContext.setTenantEnabled(true);
        savedMoves.clear();
        balanceRef.set(null);
        service = new InventoryTxService(
                inventoryTxRepository,
                mapper,
                lineRepository,
                stockBalanceRepository,
                stockMoveRepository,
                stockReservationService,
                costingMethodResolver,
                valorisationService,
                locationRepository,
                sequenceRepository);

        lenient().when(stockMoveRepository.save(any(StockMove.class))).thenAnswer(inv -> {
            StockMove m = inv.getArgument(0);
            if (m.getId() == null) {
                m.setId(UUID.randomUUID());
            }
            savedMoves.add(m);
            return m;
        });
        lenient().when(stockBalanceRepository.save(any(StockBalance.class))).thenAnswer(inv -> {
            StockBalance b = inv.getArgument(0);
            balanceRef.set(b);
            return b;
        });
        lenient()
                .when(stockBalanceRepository.findByTenantIdAndLocationIdAndItemId(eq(TENANT_ID), eq(LOCATION_ID), eq(ITEM_ID)))
                .thenAnswer(inv -> Optional.ofNullable(balanceRef.get()));
        lenient().when(costingMethodResolver.allowNegativeStock()).thenReturn(false);
        lenient().doNothing().when(valorisationService).applyInboundCost(any(), any(), any());
        lenient().doNothing().when(valorisationService).applyOutboundCost(any(), any(), any());
        lenient().when(valorisationService.currentUnitCost(any())).thenReturn(new BigDecimal("10"));
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void validateReceptionWritesMoveAndBalance_reconciles() {
        UUID txId = UUID.randomUUID();
        InventoryTx tx = baseTx(txId, "RECEPTION", InventoryTxService.STATUS_BROUILLON);
        InventoryTxLine line = line(txId, new BigDecimal("5"));

        when(inventoryTxRepository.findByIdAndTenantId(txId, TENANT_ID)).thenReturn(Optional.of(tx));
        when(lineRepository.findByTenantIdAndInventoryTxIdOrderByLineNumberAsc(TENANT_ID, txId))
                .thenReturn(List.of(line));
        when(inventoryTxRepository.save(any(InventoryTx.class))).thenAnswer(inv -> inv.getArgument(0));

        InventoryTx validated = service.validate(txId);

        assertEquals(InventoryTxService.STATUS_VALIDE, validated.getStatus());
        assertEquals(1, savedMoves.size());
        assertEquals(0, savedMoves.get(0).getQuantity().compareTo(new BigDecimal("5")));
        assertEquals(0, balanceRef.get().getQuantity().compareTo(new BigDecimal("5")));

        when(stockMoveRepository.sumQuantity(TENANT_ID, LOCATION_ID, ITEM_ID))
                .thenReturn(savedMoves.stream().map(StockMove::getQuantity).reduce(BigDecimal.ZERO, BigDecimal::add));
        StockLedgerService ledger = new StockLedgerService(stockMoveRepository, stockBalanceRepository);
        var result = ledger.reconcile(ITEM_ID, LOCATION_ID);
        assertTrue(result.consistent());
    }

    @Test
    void threeMoves_balanceEqualsSum() {
        // Reception 10
        UUID tx1 = UUID.randomUUID();
        stubValidate(tx1, "RECEPTION", new BigDecimal("10"), null);
        service.validate(tx1);
        // Reception 5
        UUID tx2 = UUID.randomUUID();
        stubValidate(tx2, "RECEPTION", new BigDecimal("5"), balanceRef.get());
        service.validate(tx2);
        // Sortie 3
        UUID tx3 = UUID.randomUUID();
        stubValidate(tx3, "SORTIE", new BigDecimal("3"), balanceRef.get());
        service.validate(tx3);

        BigDecimal moveSum = savedMoves.stream()
                .map(StockMove::getQuantity)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        assertEquals(0, balanceRef.get().getQuantity().compareTo(moveSum));
        assertEquals(0, moveSum.compareTo(new BigDecimal("12")));
        assertEquals(3, savedMoves.size());
    }

    @Test
    void sortieAboveAvailable_isRejected() {
        balanceRef.set(StockBalance.builder()
                .tenantId(TENANT_ID)
                .locationId(LOCATION_ID)
                .itemId(ITEM_ID)
                .quantity(new BigDecimal("2"))
                .reservedQuantity(BigDecimal.ZERO)
                .build());
        UUID txId = UUID.randomUUID();
        stubValidate(txId, "SORTIE", new BigDecimal("5"), balanceRef.get());

        assertThrows(InsufficientStockException.class, () -> service.validate(txId));
    }

    @Test
    void inventaireWritesVarianceMoves() {
        balanceRef.set(StockBalance.builder()
                .tenantId(TENANT_ID)
                .locationId(LOCATION_ID)
                .itemId(ITEM_ID)
                .quantity(new BigDecimal("10"))
                .reservedQuantity(BigDecimal.ZERO)
                .build());
        when(locationRepository.findByTenantIdAndCode(TENANT_ID, "AJUSTEMENT"))
                .thenReturn(Optional.of(Location.builder()
                        .id(AJUSTEMENT_ID)
                        .tenantId(TENANT_ID)
                        .code("AJUSTEMENT")
                        .affectsStock(false)
                        .build()));
        when(locationRepository.findByIdAndTenantId(AJUSTEMENT_ID, TENANT_ID))
                .thenReturn(Optional.of(Location.builder()
                        .id(AJUSTEMENT_ID)
                        .affectsStock(false)
                        .build()));

        UUID txId = UUID.randomUUID();
        InventoryTx tx = baseTx(txId, "INVENTAIRE", InventoryTxService.STATUS_BROUILLON);
        InventoryTxLine line = InventoryTxLine.builder()
                .id(UUID.randomUUID())
                .tenantId(TENANT_ID)
                .inventoryTxId(txId)
                .lineNumber(1)
                .itemId(ITEM_ID)
                .quantity(new BigDecimal("7"))
                .theoreticalQty(new BigDecimal("10"))
                .countedQty(new BigDecimal("7"))
                .build();
        when(inventoryTxRepository.findByIdAndTenantId(txId, TENANT_ID)).thenReturn(Optional.of(tx));
        when(lineRepository.findByTenantIdAndInventoryTxIdOrderByLineNumberAsc(TENANT_ID, txId))
                .thenReturn(List.of(line));
        when(inventoryTxRepository.save(any(InventoryTx.class))).thenAnswer(inv -> inv.getArgument(0));

        service.validate(txId);

        assertEquals(2, savedMoves.size());
        assertEquals(0, balanceRef.get().getQuantity().compareTo(new BigDecimal("7")));
    }

    @Test
    void createWithLinesSetsBrouillonStatus() {
        when(inventoryTxRepository.existsByTenantIdAndTxNumber(eq(TENANT_ID), anyString())).thenReturn(false);
        when(sequenceRepository.findByTenantIdAndTxTypeAndExercice(any(), any(), anyInt()))
                .thenReturn(Optional.empty());
        when(sequenceRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
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
        dto.setDestLocationId(LOCATION_ID);
        dto.setLines(List.of(lineDto));

        var detail = service.createWithLines(dto);

        assertEquals(InventoryTxService.STATUS_BROUILLON, detail.tx().getStatus());
        assertEquals(1, detail.lines().size());
        assertTrue(detail.tx().getTxNumber().matches("REC-\\d{4}-\\d{4}"));
    }

    private void stubValidate(UUID txId, String type, BigDecimal qty, StockBalance existing) {
        if (existing != null) {
            balanceRef.set(existing);
        }
        InventoryTx tx = baseTx(txId, type, InventoryTxService.STATUS_BROUILLON);
        InventoryTxLine line = line(txId, qty);
        when(inventoryTxRepository.findByIdAndTenantId(txId, TENANT_ID)).thenReturn(Optional.of(tx));
        when(lineRepository.findByTenantIdAndInventoryTxIdOrderByLineNumberAsc(TENANT_ID, txId))
                .thenReturn(List.of(line));
        when(inventoryTxRepository.save(any(InventoryTx.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    private static InventoryTx baseTx(UUID txId, String type, String status) {
        return InventoryTx.builder()
                .id(txId)
                .tenantId(TENANT_ID)
                .txNumber(type.substring(0, 3) + "-1")
                .txType(type)
                .locationId(LOCATION_ID)
                .destLocationId(LOCATION_ID)
                .sourceLocationId(LOCATION_ID)
                .txDate(LocalDate.now())
                .status(status)
                .build();
    }

    private static InventoryTxLine line(UUID txId, BigDecimal qty) {
        return InventoryTxLine.builder()
                .id(UUID.randomUUID())
                .tenantId(TENANT_ID)
                .inventoryTxId(txId)
                .lineNumber(1)
                .itemId(ITEM_ID)
                .quantity(qty)
                .build();
    }
}
