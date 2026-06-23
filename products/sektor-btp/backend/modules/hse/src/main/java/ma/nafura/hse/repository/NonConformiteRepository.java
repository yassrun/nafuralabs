package ma.nafura.hse.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.hse.domain.model.NonConformite;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface NonConformiteRepository extends TenantScopedRepository<NonConformite, String> {

    Optional<NonConformite> findByTenantIdAndNumero(UUID tenantId, String numero);

    List<NonConformite> findByTenantIdOrderByDateNcDescCreatedAtDesc(UUID tenantId);

    List<NonConformite> findByTenantIdAndStatusOrderByDateNcDescCreatedAtDesc(UUID tenantId, String status);

    List<NonConformite> findByTenantIdAndTypeNcOrderByDateNcDescCreatedAtDesc(UUID tenantId, String typeNc);

    List<NonConformite> findByTenantIdAndStatusAndTypeNcOrderByDateNcDescCreatedAtDesc(
            UUID tenantId, String status, String typeNc);

    long countByTenantId(UUID tenantId);
}
