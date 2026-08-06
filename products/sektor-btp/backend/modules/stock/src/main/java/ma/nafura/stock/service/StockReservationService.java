package ma.nafura.stock.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.stock.api.request.StockReservationCreateDto;
import ma.nafura.stock.api.request.StockReservationUpdateDto;
import ma.nafura.stock.domain.model.StockBalance;
import ma.nafura.stock.domain.model.StockReservation;
import ma.nafura.stock.domain.model.StockReservationStatus;
import ma.nafura.stock.repository.StockBalanceRepository;
import ma.nafura.stock.repository.StockReservationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class StockReservationService {

    private final StockReservationRepository repository;
    private final StockBalanceRepository stockBalanceRepository;

    public StockReservationService(
            StockReservationRepository repository, StockBalanceRepository stockBalanceRepository) {
        this.repository = repository;
        this.stockBalanceRepository = stockBalanceRepository;
    }

    @Transactional(readOnly = true)
    public List<StockReservation> list(UUID chantierId, String status) {
        UUID tenantId = tenantId();
        applyExpirationForTenant(tenantId);
        if (chantierId != null && status != null && !status.isBlank()) {
            return repository.findByTenantIdAndChantierIdAndStatusOrderByDateCreationAsc(
                    tenantId, chantierId, status.trim());
        }
        if (status != null && !status.isBlank()) {
            return repository.findByTenantIdAndStatusOrderByDateCreationDesc(tenantId, status.trim());
        }
        return repository.findByTenantId(tenantId);
    }

    @Transactional(readOnly = true)
    public StockReservation getById(UUID id) {
        return repository
                .findByIdAndTenantId(id, tenantId())
                .orElseThrow(() -> new IllegalArgumentException("Stock reservation not found"));
    }

    @Transactional
    public StockReservation create(StockReservationCreateDto request) {
        UUID tenantId = tenantId();
        assertAvailable(tenantId, request.getLocationId(), request.getItemId(), request.getQuantity());

        StockReservation entity = StockReservation.builder()
                .tenantId(tenantId)
                .itemId(request.getItemId())
                .quantity(request.getQuantity())
                .uom(request.getUom())
                .chantierId(request.getChantierId())
                .locationId(request.getLocationId())
                .dateBesoin(request.getDateBesoin())
                .dateExpiration(request.getDateExpiration())
                .dateCreation(LocalDate.now())
                .createdBy(request.getCreatedBy())
                .status(StockReservationStatus.ACTIVE)
                .motif(request.getMotif())
                .build();
        entity = repository.save(entity);
        adjustReserved(tenantId, request.getLocationId(), request.getItemId(), request.getQuantity());
        return entity;
    }

    @Transactional
    public StockReservation update(UUID id, StockReservationUpdateDto request) {
        StockReservation entity = getById(id);
        if (!StockReservationStatus.ACTIVE.equals(entity.getStatus())) {
            throw new IllegalStateException("Only ACTIVE reservations can be updated");
        }
        BigDecimal oldQty = entity.getQuantity();
        if (request.getQuantity() != null && request.getQuantity().compareTo(oldQty) != 0) {
            BigDecimal delta = request.getQuantity().subtract(oldQty);
            if (delta.signum() > 0) {
                assertAvailable(tenantId(), entity.getLocationId(), entity.getItemId(), delta);
            }
            adjustReserved(tenantId(), entity.getLocationId(), entity.getItemId(), delta);
            entity.setQuantity(request.getQuantity());
        }
        if (request.getUom() != null) {
            entity.setUom(request.getUom());
        }
        if (request.getDateBesoin() != null) {
            entity.setDateBesoin(request.getDateBesoin());
        }
        if (request.getDateExpiration() != null) {
            entity.setDateExpiration(request.getDateExpiration());
        }
        if (request.getMotif() != null) {
            entity.setMotif(request.getMotif());
        }
        return repository.save(entity);
    }

    @Transactional
    public void delete(UUID id) {
        StockReservation entity = getById(id);
        if (!StockReservationStatus.ACTIVE.equals(entity.getStatus())) {
            throw new IllegalStateException("Only ACTIVE reservations can be deleted");
        }
        adjustReserved(tenantId(), entity.getLocationId(), entity.getItemId(), entity.getQuantity().negate());
        repository.delete(entity);
    }

    @Transactional
    public StockReservation release(UUID id) {
        StockReservation entity = getById(id);
        if (!StockReservationStatus.ACTIVE.equals(entity.getStatus())) {
            throw new IllegalStateException("Only ACTIVE reservations can be released");
        }
        adjustReserved(tenantId(), entity.getLocationId(), entity.getItemId(), entity.getQuantity().negate());
        entity.setStatus(StockReservationStatus.ANNULEE);
        return repository.save(entity);
    }

    /**
     * Consumes active reservations FIFO for a chantier sortie (partial quantities supported).
     */
    @Transactional
    public void consumeFifo(UUID chantierId, List<ItemQuantity> lines) {
        if (chantierId == null || lines == null) {
            return;
        }
        UUID tenantId = tenantId();
        for (ItemQuantity line : lines) {
            if (line.itemId() == null || line.quantity() == null || line.quantity().signum() <= 0) {
                continue;
            }
            BigDecimal remaining = line.quantity();
            List<StockReservation> active =
                    repository.findByTenantIdAndItemIdAndChantierIdAndStatusOrderByDateCreationAsc(
                            tenantId, line.itemId(), chantierId, StockReservationStatus.ACTIVE);
            for (StockReservation reservation : active) {
                if (remaining.signum() <= 0) {
                    break;
                }
                BigDecimal take = reservation.getQuantity().min(remaining);
                remaining = remaining.subtract(take);
                BigDecimal left = reservation.getQuantity().subtract(take);
                adjustReserved(tenantId, reservation.getLocationId(), reservation.getItemId(), take.negate());
                if (left.signum() <= 0) {
                    reservation.setQuantity(BigDecimal.ZERO);
                    reservation.setStatus(StockReservationStatus.CONSOMMEE);
                } else {
                    reservation.setQuantity(left);
                }
                repository.save(reservation);
            }
        }
    }

    @Transactional
    public int expireActivePastDue() {
        UUID tenantId = tenantId();
        LocalDate today = LocalDate.now();
        List<StockReservation> expired =
                repository.findByTenantIdAndStatusAndDateExpirationBefore(
                        tenantId, StockReservationStatus.ACTIVE, today);
        for (StockReservation row : expired) {
            adjustReserved(tenantId, row.getLocationId(), row.getItemId(), row.getQuantity().negate());
            row.setStatus(StockReservationStatus.EXPIREE);
            repository.save(row);
        }
        return expired.size();
    }

    private void applyExpirationForTenant(UUID tenantId) {
        List<StockReservation> expired =
                repository.findByTenantIdAndStatusAndDateExpirationBefore(
                        tenantId, StockReservationStatus.ACTIVE, LocalDate.now());
        for (StockReservation row : expired) {
            adjustReserved(tenantId, row.getLocationId(), row.getItemId(), row.getQuantity().negate());
            row.setStatus(StockReservationStatus.EXPIREE);
            repository.save(row);
        }
    }

    private void assertAvailable(UUID tenantId, UUID locationId, UUID itemId, BigDecimal qty) {
        StockBalance balance = stockBalanceRepository
                .findByTenantIdAndLocationIdAndItemId(tenantId, locationId, itemId)
                .orElse(null);
        BigDecimal available = balance != null ? balance.getAvailableQuantity() : BigDecimal.ZERO;
        if (available.compareTo(qty) < 0) {
            throw new InsufficientStockException(
                    "Réservation impossible : disponible=" + available + ", demandé=" + qty);
        }
    }

    private void adjustReserved(UUID tenantId, UUID locationId, UUID itemId, BigDecimal delta) {
        if (delta == null || delta.signum() == 0) {
            return;
        }
        StockBalance balance = stockBalanceRepository
                .findByTenantIdAndLocationIdAndItemId(tenantId, locationId, itemId)
                .orElseGet(() -> StockBalance.builder()
                        .tenantId(tenantId)
                        .locationId(locationId)
                        .itemId(itemId)
                        .quantity(BigDecimal.ZERO)
                        .reservedQuantity(BigDecimal.ZERO)
                        .build());
        BigDecimal reserved =
                balance.getReservedQuantity() != null ? balance.getReservedQuantity() : BigDecimal.ZERO;
        balance.setReservedQuantity(reserved.add(delta).max(BigDecimal.ZERO));
        stockBalanceRepository.save(balance);
    }

    private static UUID tenantId() {
        return TenantContext.getTenantId();
    }

    public record ItemQuantity(UUID itemId, BigDecimal quantity) {}
}
