package ma.nafura.stock.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.stock.api.dto.InventoryTxDetailDto;
import ma.nafura.stock.api.request.InventoryTxLineInputDto;
import ma.nafura.stock.api.request.InventoryTxWithLinesCreateDto;
import ma.nafura.stock.api.request.InventoryTxWithLinesUpdateDto;
import ma.nafura.stock.domain.model.InventoryTx;
import ma.nafura.stock.domain.model.InventoryTxLine;
import ma.nafura.stock.domain.model.StockBalance;
import ma.nafura.stock.mapper.InventoryTxMapper;
import ma.nafura.stock.repository.InventoryTxLineRepository;
import ma.nafura.stock.repository.InventoryTxRepository;
import ma.nafura.stock.repository.StockBalanceRepository;
import ma.nafura.stock.service.base.InventoryTxServiceBase;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class InventoryTxService extends InventoryTxServiceBase {

    public static final String STATUS_BROUILLON = "BROUILLON";
    public static final String STATUS_SOUMIS = "SOUMIS";
    public static final String STATUS_VALIDE = "VALIDE";
    public static final String STATUS_ANNULE = "ANNULE";

    private final InventoryTxRepository inventoryTxRepository;
    private final InventoryTxLineRepository lineRepository;
    private final StockBalanceRepository stockBalanceRepository;
    private final StockReservationService stockReservationService;

    public InventoryTxService(
            InventoryTxRepository repository,
            InventoryTxMapper mapper,
            InventoryTxLineRepository lineRepository,
            StockBalanceRepository stockBalanceRepository,
            StockReservationService stockReservationService) {
        super(repository, mapper);
        this.inventoryTxRepository = repository;
        this.lineRepository = lineRepository;
        this.stockBalanceRepository = stockBalanceRepository;
        this.stockReservationService = stockReservationService;
    }

    @Transactional(readOnly = true)
    public Page<InventoryTx> listByTxType(String txType, int page, int size, Sort sort) {
        Pageable pageable = sort != null ? PageRequest.of(page, size, sort) : PageRequest.of(page, size);
        return inventoryTxRepository.findByTenantIdAndTxType(tenantId(), txType, pageable);
    }

    @Transactional(readOnly = true)
    public Optional<InventoryTxDetailDto> getWithLines(UUID id) {
        return getById(id).map(tx -> new InventoryTxDetailDto(tx, loadLines(id)));
    }

    @Transactional
    public InventoryTxDetailDto createWithLines(InventoryTxWithLinesCreateDto request) {
        UUID tenantId = tenantId();
        String txNumber = resolveTxNumber(request.getTxNumber(), request.getTxType());
        if (inventoryTxRepository.existsByTenantIdAndTxNumber(tenantId, txNumber)) {
            throw new IllegalArgumentException("Transaction number already exists");
        }

        InventoryTx tx = InventoryTx.builder()
                .tenantId(tenantId)
                .txNumber(txNumber)
                .txType(request.getTxType())
                .txDate(request.getTxDate() != null ? request.getTxDate() : LocalDate.now())
                .reference(request.getReference())
                .notes(request.getNotes())
                .status(STATUS_BROUILLON)
                .sourceLocationId(request.getSourceLocationId())
                .destLocationId(request.getDestLocationId())
                .fournisseurId(request.getFournisseurId())
                .chantierLocationId(request.getChantierLocationId())
                .chantierBudgetId(request.getChantierBudgetId())
                .phaseRef(request.getPhaseRef())
                .motifId(request.getMotifId())
                .bcId(request.getBcId())
                .build();
        tx.setWarehouseId(resolveWarehouseId(request.getTxType(), request.getWarehouseId(), tx));
        tx = inventoryTxRepository.save(tx);

        List<InventoryTxLine> lines = saveLines(tenantId, tx.getId(), request.getLines());
        return new InventoryTxDetailDto(tx, lines);
    }

    @Transactional
    public InventoryTxDetailDto updateWithLines(UUID id, InventoryTxWithLinesUpdateDto request) {
        InventoryTx tx = getById(id).orElseThrow(() -> new IllegalArgumentException("Inventory transaction not found"));
        assertEditable(tx);

        if (request.getTxDate() != null) {
            tx.setTxDate(request.getTxDate());
        }
        if (request.getReference() != null) {
            tx.setReference(request.getReference());
        }
        if (request.getNotes() != null) {
            tx.setNotes(request.getNotes());
        }
        if (request.getSourceLocationId() != null) {
            tx.setSourceLocationId(request.getSourceLocationId());
        }
        if (request.getDestLocationId() != null) {
            tx.setDestLocationId(request.getDestLocationId());
        }
        if (request.getFournisseurId() != null) {
            tx.setFournisseurId(request.getFournisseurId());
        }
        if (request.getChantierLocationId() != null) {
            tx.setChantierLocationId(request.getChantierLocationId());
        }
        if (request.getChantierBudgetId() != null) {
            tx.setChantierBudgetId(request.getChantierBudgetId());
        }
        if (request.getPhaseRef() != null) {
            tx.setPhaseRef(request.getPhaseRef());
        }
        if (request.getMotifId() != null) {
            tx.setMotifId(request.getMotifId());
        }
        if (request.getBcId() != null) {
            tx.setBcId(request.getBcId());
        }
        if (request.getWarehouseId() != null) {
            tx.setWarehouseId(request.getWarehouseId());
        } else {
            tx.setWarehouseId(resolveWarehouseId(tx.getTxType(), tx.getWarehouseId(), tx));
        }
        tx = inventoryTxRepository.save(tx);

        List<InventoryTxLine> lines = loadLines(id);
        if (request.getLines() != null) {
            lineRepository.deleteByTenantIdAndInventoryTxId(tenantId(), id);
            lines = saveLines(tenantId(), id, request.getLines());
        }
        return new InventoryTxDetailDto(tx, lines);
    }

    @Transactional
    public InventoryTx submit(UUID id) {
        InventoryTx tx = getById(id).orElseThrow(() -> new IllegalArgumentException("Inventory transaction not found"));
        if (!STATUS_BROUILLON.equals(tx.getStatus())) {
            throw new IllegalStateException("Only BROUILLON transactions can be submitted");
        }
        tx.setStatus(STATUS_SOUMIS);
        return inventoryTxRepository.save(tx);
    }

    @Transactional
    public InventoryTx validate(UUID id) {
        InventoryTx tx = getById(id).orElseThrow(() -> new IllegalArgumentException("Inventory transaction not found"));
        String status = tx.getStatus();
        if (!STATUS_BROUILLON.equals(status) && !STATUS_SOUMIS.equals(status)) {
            throw new IllegalStateException("Only BROUILLON or SOUMIS transactions can be validated");
        }
        List<InventoryTxLine> lines = loadLines(id);
        if (lines.isEmpty()) {
            throw new IllegalStateException("Cannot validate a transaction without lines");
        }
        applyStockImpact(tx, lines);
        consumeReservationsIfSortie(tx, lines);
        tx.setStatus(STATUS_VALIDE);
        return inventoryTxRepository.save(tx);
    }

    private void consumeReservationsIfSortie(InventoryTx tx, List<InventoryTxLine> lines) {
        if (!"SORTIE".equals(tx.getTxType()) || tx.getChantierBudgetId() == null) {
            return;
        }
        List<StockReservationService.ItemQuantity> consumptions = new ArrayList<>();
        for (InventoryTxLine line : lines) {
            consumptions.add(new StockReservationService.ItemQuantity(line.getItemId(), line.getQuantity()));
        }
        stockReservationService.consumeFifo(tx.getChantierBudgetId(), consumptions);
    }

    @Transactional
    public InventoryTx cancel(UUID id) {
        InventoryTx tx = getById(id).orElseThrow(() -> new IllegalArgumentException("Inventory transaction not found"));
        String status = tx.getStatus();
        if (STATUS_VALIDE.equals(status)) {
            throw new IllegalStateException("Validated transactions cannot be cancelled");
        }
        if (STATUS_ANNULE.equals(status)) {
            return tx;
        }
        tx.setStatus(STATUS_ANNULE);
        return inventoryTxRepository.save(tx);
    }

    @Transactional
    @Override
    public void delete(UUID id) {
        InventoryTx tx = getById(id).orElseThrow(() -> new IllegalArgumentException("Inventory transaction not found"));
        assertEditable(tx);
        lineRepository.deleteByTenantIdAndInventoryTxId(tenantId(), id);
        super.delete(id);
    }

    private void applyStockImpact(InventoryTx tx, List<InventoryTxLine> lines) {
        UUID tenantId = tenantId();
        String type = tx.getTxType();
        for (InventoryTxLine line : lines) {
            switch (type) {
                case "RECEPTION" -> addQuantity(tenantId, warehouseForDest(tx), line);
                case "SORTIE", "PERTE" -> subtractQuantity(tenantId, warehouseForSource(tx), line);
                case "RETOUR" -> addQuantity(tenantId, warehouseForDest(tx), line);
                case "TRANSFERT" -> {
                    subtractQuantity(tenantId, warehouseForSource(tx), line);
                    addQuantity(tenantId, warehouseForDest(tx), line);
                }
                case "INVENTAIRE" -> adjustToCountedQuantity(tenantId, warehouseForDest(tx), line, tx.getTxDate());
                default -> { /* other types: no automatic balance change */ }
            }
        }
    }

    private void addQuantity(UUID tenantId, UUID warehouseId, InventoryTxLine line) {
        StockBalance balance = stockBalanceRepository
                .findByTenantIdAndWarehouseIdAndItemId(tenantId, warehouseId, line.getItemId())
                .orElseGet(() -> newBalance(tenantId, warehouseId, line.getItemId()));
        BigDecimal qty = balance.getQuantity() != null ? balance.getQuantity() : BigDecimal.ZERO;
        balance.setQuantity(qty.add(line.getQuantity()));
        recalcAvailable(balance);
        stockBalanceRepository.save(balance);
    }

    private void adjustToCountedQuantity(
            UUID tenantId, UUID warehouseId, InventoryTxLine line, java.time.LocalDate countDate) {
        BigDecimal target =
                line.getCountedQty() != null ? line.getCountedQty() : line.getQuantity();
        StockBalance balance = stockBalanceRepository
                .findByTenantIdAndWarehouseIdAndItemId(tenantId, warehouseId, line.getItemId())
                .orElseGet(() -> newBalance(tenantId, warehouseId, line.getItemId()));
        balance.setQuantity(target);
        if (countDate != null) {
            balance.setLastCountDate(countDate);
        }
        recalcAvailable(balance);
        stockBalanceRepository.save(balance);
    }

    private void subtractQuantity(UUID tenantId, UUID warehouseId, InventoryTxLine line) {
        StockBalance balance = stockBalanceRepository
                .findByTenantIdAndWarehouseIdAndItemId(tenantId, warehouseId, line.getItemId())
                .orElseGet(() -> newBalance(tenantId, warehouseId, line.getItemId()));
        BigDecimal qty = balance.getQuantity() != null ? balance.getQuantity() : BigDecimal.ZERO;
        BigDecimal next = qty.subtract(line.getQuantity());
        if (next.compareTo(BigDecimal.ZERO) < 0) {
            next = BigDecimal.ZERO;
        }
        balance.setQuantity(next);
        recalcAvailable(balance);
        stockBalanceRepository.save(balance);
    }

    private static StockBalance newBalance(UUID tenantId, UUID warehouseId, UUID itemId) {
        return StockBalance.builder()
                .tenantId(tenantId)
                .warehouseId(warehouseId)
                .itemId(itemId)
                .quantity(BigDecimal.ZERO)
                .reservedQuantity(BigDecimal.ZERO)
                .availableQuantity(BigDecimal.ZERO)
                .build();
    }

    private static void recalcAvailable(StockBalance balance) {
        BigDecimal qty = balance.getQuantity() != null ? balance.getQuantity() : BigDecimal.ZERO;
        BigDecimal reserved = balance.getReservedQuantity() != null ? balance.getReservedQuantity() : BigDecimal.ZERO;
        balance.setAvailableQuantity(qty.subtract(reserved).max(BigDecimal.ZERO));
    }

    private UUID warehouseForSource(InventoryTx tx) {
        if (tx.getSourceLocationId() != null) {
            return tx.getSourceLocationId();
        }
        if (tx.getChantierLocationId() != null) {
            return tx.getChantierLocationId();
        }
        return tx.getWarehouseId();
    }

    private UUID warehouseForDest(InventoryTx tx) {
        if (tx.getDestLocationId() != null) {
            return tx.getDestLocationId();
        }
        if (tx.getChantierLocationId() != null) {
            return tx.getChantierLocationId();
        }
        return tx.getWarehouseId();
    }

    private UUID resolveWarehouseId(String txType, UUID explicit, InventoryTx tx) {
        if (explicit != null) {
            return explicit;
        }
        return switch (txType) {
            case "RECEPTION", "RETOUR" -> warehouseForDest(tx);
            case "SORTIE", "PERTE", "TRANSFERT" -> warehouseForSource(tx);
            default -> {
                if (tx.getDestLocationId() != null) {
                    yield tx.getDestLocationId();
                }
                if (tx.getSourceLocationId() != null) {
                    yield tx.getSourceLocationId();
                }
                throw new IllegalArgumentException("warehouseId or source/dest location is required");
            }
        };
    }

    private List<InventoryTxLine> saveLines(UUID tenantId, UUID txId, List<InventoryTxLineInputDto> inputs) {
        List<InventoryTxLine> saved = new ArrayList<>();
        int autoLine = 0;
        for (InventoryTxLineInputDto input : inputs) {
            int lineNo = input.getLineNumber() != null ? input.getLineNumber() : ++autoLine;
            BigDecimal counted = input.getCountedQty();
            BigDecimal theoretical = input.getTheoreticalQty();
            BigDecimal qty = counted != null ? counted : input.getQuantity();
            BigDecimal total = input.getTotalPrice();
            if (total == null && input.getUnitPrice() != null && qty != null) {
                total = input.getUnitPrice().multiply(qty);
            }
            InventoryTxLine line = InventoryTxLine.builder()
                    .tenantId(tenantId)
                    .inventoryTxId(txId)
                    .lineNumber(lineNo)
                    .itemId(input.getItemId())
                    .quantity(qty)
                    .theoreticalQty(theoretical)
                    .countedQty(counted)
                    .unitPrice(input.getUnitPrice())
                    .totalPrice(total)
                    .notes(input.getNotes())
                    .build();
            saved.add(lineRepository.save(line));
        }
        return saved;
    }

    private List<InventoryTxLine> loadLines(UUID txId) {
        return lineRepository.findByTenantIdAndInventoryTxIdOrderByLineNumberAsc(tenantId(), txId);
    }

    private static void assertEditable(InventoryTx tx) {
        if (STATUS_VALIDE.equals(tx.getStatus())) {
            throw new IllegalStateException("Validated transactions cannot be modified");
        }
        if (STATUS_ANNULE.equals(tx.getStatus())) {
            throw new IllegalStateException("Cancelled transactions cannot be modified");
        }
    }

    private String resolveTxNumber(String requested, String txType) {
        if (requested != null && !requested.isBlank()) {
            return requested.trim();
        }
        String prefix = txType != null && txType.length() >= 3 ? txType.substring(0, 3) : "TX";
        return prefix + "-" + System.currentTimeMillis();
    }
}
