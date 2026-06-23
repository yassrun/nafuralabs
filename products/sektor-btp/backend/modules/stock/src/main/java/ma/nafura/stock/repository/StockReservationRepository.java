package ma.nafura.stock.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import ma.nafura.stock.domain.model.StockReservation;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface StockReservationRepository extends TenantScopedRepository<StockReservation, UUID> {

    List<StockReservation> findByTenantIdAndChantierIdAndStatusOrderByDateCreationAsc(
            UUID tenantId, String chantierId, String status);

    List<StockReservation> findByTenantIdAndStatusOrderByDateCreationDesc(UUID tenantId, String status);

    List<StockReservation> findByTenantIdAndItemIdAndChantierIdAndStatusOrderByDateCreationAsc(
            UUID tenantId, UUID itemId, String chantierId, String status);

    List<StockReservation> findByTenantIdAndStatusAndDateExpirationBefore(
            UUID tenantId, String status, LocalDate date);
}
