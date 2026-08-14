package ma.nafura.chantiers.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.chantiers.domain.model.ChantierPhase;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ChantierPhaseRepository extends TenantScopedRepository<ChantierPhase, String> {

    List<ChantierPhase> findByTenantIdAndChantierIdOrderByOrdreAscCodeAsc(UUID tenantId, String chantierId);

    Optional<ChantierPhase> findByTenantIdAndChantierIdAndCode(UUID tenantId, String chantierId, String code);

    long countByTenantId(UUID tenantId);
}
