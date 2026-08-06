package ma.nafura.stock.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
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
import ma.nafura.stock.domain.model.InventoryTxSequence;
import ma.nafura.stock.domain.model.Location;
import ma.nafura.stock.domain.model.StockBalance;
import ma.nafura.stock.domain.model.StockMove;
import ma.nafura.stock.mapper.InventoryTxMapper;
import ma.nafura.stock.repository.InventoryTxLineRepository;
import ma.nafura.stock.repository.InventoryTxRepository;
import ma.nafura.stock.repository.InventoryTxSequenceRepository;
import ma.nafura.stock.repository.LocationRepository;
import ma.nafura.stock.repository.StockBalanceRepository;
import ma.nafura.stock.repository.StockMoveRepository;
import ma.nafura.stock.service.base.InventoryTxServiceBase;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class InventoryTxService extends InventoryTxServiceBase {

    private static final String INVENTORY_TX_NOT_FOUND = "Inventory transaction not found";
    private static final String LOCATION_AJUSTEMENT = "AJUSTEMENT";

    public static final String STATUS_BROUILLON = "BROUILLON";
    public static final String STATUS_SOUMIS = "SOUMIS";
    public static final String STATUS_VALIDE = "VALIDE";
    public static final String STATUS_ANNULE = "ANNULE";

    private final InventoryTxRepository inventoryTxRepository;
    private final InventoryTxLineRepository lineRepository;
    private final StockBalanceRepository stockBalanceRepository;
    private final StockMoveRepository stockMoveRepository;
    private final StockReservationService stockReservationService;
    private final CostingMethodResolver costingMethodResolver;
    private final ValorisationService valorisationService;
    private final LocationRepository locationRepository;
    private final InventoryTxSequenceRepository sequenceRepository;

    public InventoryTxService(
            InventoryTxRepository repository,
            InventoryTxMapper mapper,
            InventoryTxLineRepository lineRepository,
            StockBalanceRepository stockBalanceRepository,
            StockMoveRepository stockMoveRepository,
            StockReservationService stockReservationService,
            CostingMethodResolver costingMethodResolver,
            ValorisationService valorisationService,
            LocationRepository locationRepository,
            InventoryTxSequenceRepository sequenceRepository) {
        super(repository, mapper);
        this.inventoryTxRepository = repository;
        this.lineRepository = lineRepository;
        this.stockBalanceRepository = stockBalanceRepository;
        this.stockMoveRepository = stockMoveRepository;
        this.stockReservationService = stockReservationService;
        this.costingMethodResolver = costingMethodResolver;
        this.valorisationService = valorisationService;
        this.locationRepository = locationRepository;
        this.sequenceRepository = sequenceRepository;
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
        assertLinesNotEmpty(request.getLines(), "At least one line is required");
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
        tx.setLocationId(resolveLocationId(request.getTxType(), request.getLocationId(), tx));
        tx = inventoryTxRepository.save(tx);

        List<InventoryTxLine> lines = saveLines(tenantId, tx.getId(), request.getLines());
        return new InventoryTxDetailDto(tx, lines);
    }

    @Transactional
    public InventoryTxDetailDto updateWithLines(UUID id, InventoryTxWithLinesUpdateDto request) {
        InventoryTx tx = getById(id).orElseThrow(() -> new IllegalArgumentException(INVENTORY_TX_NOT_FOUND));
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
        if (request.getLocationId() != null) {
            tx.setLocationId(request.getLocationId());
        } else {
            tx.setLocationId(resolveLocationId(tx.getTxType(), tx.getLocationId(), tx));
        }
        tx = inventoryTxRepository.save(tx);

        List<InventoryTxLine> lines = loadLines(id);
        if (request.getLines() != null) {
            assertLinesNotEmpty(request.getLines(), "At least one line is required on update");
            lineRepository.deleteByTenantIdAndInventoryTxId(tenantId(), id);
            lines = saveLines(tenantId(), id, request.getLines());
        }
        return new InventoryTxDetailDto(tx, lines);
    }

    @Transactional
    public InventoryTx submit(UUID id) {
        InventoryTx tx = getById(id).orElseThrow(() -> new IllegalArgumentException(INVENTORY_TX_NOT_FOUND));
        if (!STATUS_BROUILLON.equals(tx.getStatus())) {
            throw new IllegalStateException("Only BROUILLON transactions can be submitted");
        }
        tx.setStatus(STATUS_SOUMIS);
        return inventoryTxRepository.save(tx);
    }

    @Transactional
    public InventoryTx validate(UUID id) {
        InventoryTx tx = getById(id).orElseThrow(() -> new IllegalArgumentException(INVENTORY_TX_NOT_FOUND));
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

    /**
     * Contre-passe une transaction validée : crée une TX inverse VALIDE et des moves de reversal.
     */
    @Transactional
    public InventoryTx reverse(UUID id) {
        InventoryTx original =
                getById(id).orElseThrow(() -> new IllegalArgumentException(INVENTORY_TX_NOT_FOUND));
        if (!STATUS_VALIDE.equals(original.getStatus())) {
            throw new IllegalStateException("Only VALIDE transactions can be reversed");
        }
        List<StockMove> originalMoves =
                stockMoveRepository.findByTenantIdAndInventoryTxId(tenantId(), original.getId());
        if (originalMoves.isEmpty()) {
            throw new IllegalStateException("No stock moves found for transaction — cannot reverse");
        }

        InventoryTx reversal = InventoryTx.builder()
                .tenantId(tenantId())
                .txNumber(resolveTxNumber(null, original.getTxType()) + "-REV")
                .txType(original.getTxType())
                .txDate(LocalDate.now())
                .reference("REV of " + original.getTxNumber())
                .notes("Contre-passation de " + original.getTxNumber())
                .status(STATUS_VALIDE)
                .locationId(original.getLocationId())
                .sourceLocationId(original.getDestLocationId())
                .destLocationId(original.getSourceLocationId())
                .chantierLocationId(original.getChantierLocationId())
                .chantierBudgetId(original.getChantierBudgetId())
                .motifId(original.getMotifId())
                .build();
        // Ensure unique number if -REV collides
        if (inventoryTxRepository.existsByTenantIdAndTxNumber(tenantId(), reversal.getTxNumber())) {
            reversal.setTxNumber(resolveTxNumber(null, original.getTxType()));
        }
        reversal = inventoryTxRepository.save(reversal);

        for (StockMove originalMove : originalMoves) {
            BigDecimal reverseQty = originalMove.getQuantity().negate();
            StockMove reverseMove = StockMove.builder()
                    .tenantId(tenantId())
                    .inventoryTxId(reversal.getId())
                    .inventoryTxLineId(originalMove.getInventoryTxLineId())
                    .locationId(originalMove.getLocationId())
                    .itemId(originalMove.getItemId())
                    .quantity(reverseQty)
                    .unitCost(originalMove.getUnitCost())
                    .totalCost(originalMove.getTotalCost())
                    .movedAt(OffsetDateTime.now())
                    .reversalOfMoveId(originalMove.getId())
                    .opening(false)
                    .build();
            stockMoveRepository.save(reverseMove);
            applySignedQuantityToBalance(
                    tenantId(), originalMove.getLocationId(), originalMove.getItemId(), reverseQty, null);
        }
        return reversal;
    }

    private void consumeReservationsIfSortie(InventoryTx tx, List<InventoryTxLine> lines) {
        if (!"SORTIE".equals(tx.getTxType()) || tx.getChantierLocationId() == null) {
            return;
        }
        List<StockReservationService.ItemQuantity> consumptions = new ArrayList<>();
        for (InventoryTxLine line : lines) {
            consumptions.add(new StockReservationService.ItemQuantity(line.getItemId(), line.getQuantity()));
        }
        stockReservationService.consumeFifo(tx.getChantierLocationId(), consumptions);
    }

    @Transactional
    public InventoryTx cancel(UUID id) {
        InventoryTx tx = getById(id).orElseThrow(() -> new IllegalArgumentException(INVENTORY_TX_NOT_FOUND));
        String status = tx.getStatus();
        if (STATUS_VALIDE.equals(status)) {
            throw new IllegalStateException(
                    "Validated transactions cannot be cancelled — use reverse instead");
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
        InventoryTx tx = getById(id).orElseThrow(() -> new IllegalArgumentException(INVENTORY_TX_NOT_FOUND));
        assertEditable(tx);
        lineRepository.deleteByTenantIdAndInventoryTxId(tenantId(), id);
        super.delete(id);
    }

    private void applyStockImpact(InventoryTx tx, List<InventoryTxLine> lines) {
        UUID tenantId = tenantId();
        String type = tx.getTxType();
        for (InventoryTxLine line : lines) {
            switch (type) {
                case "RECEPTION" -> addQuantity(tenantId, warehouseForDest(tx), line, tx, true);
                case "SORTIE", "PERTE" -> subtractQuantity(tenantId, warehouseForSource(tx), line, tx);
                case "RETOUR" -> addQuantity(tenantId, warehouseForDest(tx), line, tx, true);
                case "TRANSFERT" -> {
                    subtractQuantity(tenantId, warehouseForSource(tx), line, tx);
                    addQuantity(tenantId, warehouseForDest(tx), line, tx, false);
                }
                case "INVENTAIRE" -> adjustToCountedQuantity(tenantId, warehouseForDest(tx), line, tx);
                default -> { /* no automatic balance change */ }
            }
        }
    }

    private void addQuantity(
            UUID tenantId, UUID locationId, InventoryTxLine line, InventoryTx tx, boolean updatePmp) {
        assertLocation(locationId);
        BigDecimal qty = line.getQuantity() != null ? line.getQuantity() : BigDecimal.ZERO;

        StockMove move = StockMove.builder()
                .tenantId(tenantId)
                .inventoryTxId(tx.getId())
                .inventoryTxLineId(line.getId())
                .locationId(locationId)
                .itemId(line.getItemId())
                .quantity(qty)
                .movedAt(txMovedAt(tx))
                .opening(false)
                .build();
        if (updatePmp && ("RECEPTION".equals(tx.getTxType()) || "RETOUR".equals(tx.getTxType()))) {
            valorisationService.applyInboundCost(move, line, locationId);
        } else {
            valorisationService.applyOutboundCost(move, line.getItemId(), qty);
        }
        stockMoveRepository.save(move);
        applySignedQuantityToBalance(tenantId, locationId, line.getItemId(), qty, null);
    }

    private void subtractQuantity(UUID tenantId, UUID locationId, InventoryTxLine line, InventoryTx tx) {
        assertLocation(locationId);
        BigDecimal qty = line.getQuantity() != null ? line.getQuantity() : BigDecimal.ZERO;
        StockBalance balance = stockBalanceRepository
                .findByTenantIdAndLocationIdAndItemId(tenantId, locationId, line.getItemId())
                .orElseGet(() -> newBalance(tenantId, locationId, line.getItemId()));
        BigDecimal onHand = balance.getQuantity() != null ? balance.getQuantity() : BigDecimal.ZERO;
        BigDecimal reserved =
                balance.getReservedQuantity() != null ? balance.getReservedQuantity() : BigDecimal.ZERO;
        BigDecimal available = onHand.subtract(reserved);
        BigDecimal next = onHand.subtract(qty);
        if (next.compareTo(BigDecimal.ZERO) < 0 || available.compareTo(qty) < 0) {
            if (!costingMethodResolver.allowNegativeStock()) {
                throw new InsufficientStockException(
                        "Stock insuffisant pour l'article "
                                + line.getItemId()
                                + " à l'emplacement "
                                + locationId
                                + " (disponible="
                                + available.max(BigDecimal.ZERO)
                                + ", demandé="
                                + qty
                                + ")");
            }
        }

        StockMove move = StockMove.builder()
                .tenantId(tenantId)
                .inventoryTxId(tx.getId())
                .inventoryTxLineId(line.getId())
                .locationId(locationId)
                .itemId(line.getItemId())
                .quantity(qty.negate())
                .movedAt(txMovedAt(tx))
                .opening(false)
                .build();
        valorisationService.applyOutboundCost(move, line.getItemId(), qty);
        stockMoveRepository.save(move);
        applySignedQuantityToBalance(tenantId, locationId, line.getItemId(), qty.negate(), null);
    }

    private void adjustToCountedQuantity(
            UUID tenantId, UUID locationId, InventoryTxLine line, InventoryTx tx) {
        assertLocation(locationId);
        BigDecimal target =
                line.getCountedQty() != null ? line.getCountedQty() : line.getQuantity();
        if (target == null) {
            target = BigDecimal.ZERO;
        }
        StockBalance balance = stockBalanceRepository
                .findByTenantIdAndLocationIdAndItemId(tenantId, locationId, line.getItemId())
                .orElseGet(() -> newBalance(tenantId, locationId, line.getItemId()));
        BigDecimal current = balance.getQuantity() != null ? balance.getQuantity() : BigDecimal.ZERO;
        BigDecimal variance = target.subtract(current);
        if (variance.signum() == 0) {
            if (tx.getTxDate() != null) {
                balance.setLastCountDate(tx.getTxDate());
                stockBalanceRepository.save(balance);
            }
            return;
        }

        UUID adjustmentLocationId = resolveAjustementLocationId(tenantId);
        BigDecimal unitCost = valorisationService.currentUnitCost(line.getItemId());
        BigDecimal absVar = variance.abs();
        BigDecimal totalCost = unitCost.multiply(absVar);

        // Move on counted location (signed variance)
        StockMove countedMove = StockMove.builder()
                .tenantId(tenantId)
                .inventoryTxId(tx.getId())
                .inventoryTxLineId(line.getId())
                .locationId(locationId)
                .itemId(line.getItemId())
                .quantity(variance)
                .unitCost(unitCost)
                .totalCost(totalCost)
                .movedAt(txMovedAt(tx))
                .opening(false)
                .build();
        stockMoveRepository.save(countedMove);

        // Counter-move on AJUSTEMENT (opposite sign)
        StockMove adjustmentMove = StockMove.builder()
                .tenantId(tenantId)
                .inventoryTxId(tx.getId())
                .inventoryTxLineId(line.getId())
                .locationId(adjustmentLocationId)
                .itemId(line.getItemId())
                .quantity(variance.negate())
                .unitCost(unitCost)
                .totalCost(totalCost)
                .movedAt(txMovedAt(tx))
                .opening(false)
                .build();
        stockMoveRepository.save(adjustmentMove);

        applySignedQuantityToBalance(tenantId, locationId, line.getItemId(), variance, tx.getTxDate());
        if (locationAffectsStock(tenantId, adjustmentLocationId)) {
            applySignedQuantityToBalance(
                    tenantId, adjustmentLocationId, line.getItemId(), variance.negate(), null);
        }
    }

    private boolean locationAffectsStock(UUID tenantId, UUID locationId) {
        return locationRepository
                .findByIdAndTenantId(locationId, tenantId)
                .map(loc -> Boolean.TRUE.equals(loc.getAffectsStock()))
                .orElse(true);
    }

    private UUID resolveAjustementLocationId(UUID tenantId) {
        return locationRepository
                .findByTenantIdAndCode(tenantId, LOCATION_AJUSTEMENT)
                .map(Location::getId)
                .orElseThrow(() -> new IllegalStateException(
                        "Emplacement AJUSTEMENT manquant — seed onboarding locations (Lot 6)"));
    }

    private void applySignedQuantityToBalance(
            UUID tenantId, UUID locationId, UUID itemId, BigDecimal signedQty, LocalDate countDate) {
        StockBalance balance = stockBalanceRepository
                .findByTenantIdAndLocationIdAndItemId(tenantId, locationId, itemId)
                .orElseGet(() -> newBalance(tenantId, locationId, itemId));
        BigDecimal qty = balance.getQuantity() != null ? balance.getQuantity() : BigDecimal.ZERO;
        balance.setQuantity(qty.add(signedQty));
        if (countDate != null) {
            balance.setLastCountDate(countDate);
        }
        stockBalanceRepository.save(balance);
    }

    private static StockBalance newBalance(UUID tenantId, UUID locationId, UUID itemId) {
        return StockBalance.builder()
                .tenantId(tenantId)
                .locationId(locationId)
                .itemId(itemId)
                .quantity(BigDecimal.ZERO)
                .reservedQuantity(BigDecimal.ZERO)
                .build();
    }

    private static void assertLocation(UUID locationId) {
        if (locationId == null) {
            throw new IllegalArgumentException("locationId or source/dest location is required");
        }
    }

    private static OffsetDateTime txMovedAt(InventoryTx tx) {
        if (tx.getTxDate() != null) {
            return tx.getTxDate().atStartOfDay().atOffset(OffsetDateTime.now().getOffset());
        }
        return OffsetDateTime.now();
    }

    private UUID warehouseForSource(InventoryTx tx) {
        if (tx.getSourceLocationId() != null) {
            return tx.getSourceLocationId();
        }
        if (tx.getChantierLocationId() != null) {
            return tx.getChantierLocationId();
        }
        return tx.getLocationId();
    }

    private UUID warehouseForDest(InventoryTx tx) {
        if (tx.getDestLocationId() != null) {
            return tx.getDestLocationId();
        }
        if (tx.getChantierLocationId() != null) {
            return tx.getChantierLocationId();
        }
        return tx.getLocationId();
    }

    private UUID resolveLocationId(String txType, UUID explicit, InventoryTx tx) {
        if (explicit != null) {
            return explicit;
        }
        return switch (txType) {
            case "RECEPTION", "RETOUR", "INVENTAIRE" -> warehouseForDest(tx);
            case "SORTIE", "PERTE", "TRANSFERT" -> warehouseForSource(tx);
            default -> {
                if (tx.getDestLocationId() != null) {
                    yield tx.getDestLocationId();
                }
                if (tx.getSourceLocationId() != null) {
                    yield tx.getSourceLocationId();
                }
                throw new IllegalArgumentException("locationId or source/dest location is required");
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

    private static void assertLinesNotEmpty(List<InventoryTxLineInputDto> lines, String errorMessage) {
        if (lines == null || lines.isEmpty()) {
            throw new IllegalArgumentException(errorMessage);
        }
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
        UUID tenantId = tenantId();
        int exercice = LocalDate.now().getYear();
        String type = txType != null ? txType : "TX";
        InventoryTxSequence seq = sequenceRepository
                .findByTenantIdAndTxTypeAndExercice(tenantId, type, exercice)
                .orElseGet(() -> InventoryTxSequence.builder()
                        .tenantId(tenantId)
                        .txType(type)
                        .exercice(exercice)
                        .lastValue(0L)
                        .build());
        long next = seq.getLastValue() + 1;
        seq.setLastValue(next);
        sequenceRepository.save(seq);
        String prefix = type.length() >= 3 ? type.substring(0, 3) : type;
        return prefix + "-" + exercice + "-" + String.format("%04d", next);
    }
}
