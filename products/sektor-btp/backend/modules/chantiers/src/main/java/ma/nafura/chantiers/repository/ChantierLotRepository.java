package ma.nafura.chantiers.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.chantiers.domain.model.ChantierLot;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ChantierLotRepository extends TenantScopedRepository<ChantierLot, String> {

    List<ChantierLot> findByTenantIdAndChantierIdOrderByOrdreAscCodeAsc(UUID tenantId, String chantierId);

    Optional<ChantierLot> findByTenantIdAndChantierIdAndCode(UUID tenantId, String chantierId, String code);

    long countByTenantId(UUID tenantId);

    long countByTenantIdAndChantierId(UUID tenantId, String chantierId);
}
