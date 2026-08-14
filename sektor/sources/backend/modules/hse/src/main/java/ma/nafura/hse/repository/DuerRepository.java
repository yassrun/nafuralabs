package ma.nafura.hse.repository;

import java.util.List;
import java.util.UUID;
import ma.nafura.hse.domain.model.Duer;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DuerRepository extends TenantScopedRepository<Duer, String> {

    List<Duer> findByTenantIdOrderByDateRevisionDescCreatedAtDesc(UUID tenantId);

    List<Duer> findByTenantIdAndChantierIdOrderByDateRevisionDescCreatedAtDesc(UUID tenantId, String chantierId);

    List<Duer> findByTenantIdAndStatusOrderByDateRevisionDescCreatedAtDesc(UUID tenantId, String status);

    long countByTenantId(UUID tenantId);
}
