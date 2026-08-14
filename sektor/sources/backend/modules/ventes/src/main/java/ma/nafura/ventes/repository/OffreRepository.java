package ma.nafura.ventes.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.ventes.domain.model.Offre;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface OffreRepository extends TenantScopedRepository<Offre, UUID> {

    Optional<Offre> findByTenantIdAndNumero(UUID tenantId, String numero);

    List<Offre> findByTenantIdOrderByCreatedAtDesc(UUID tenantId);

    List<Offre> findByTenantIdAndStatusOrderByCreatedAtDesc(UUID tenantId, String status);

    List<Offre> findByTenantIdAndClientIdOrderByCreatedAtDesc(UUID tenantId, String clientId);

    List<Offre> findByTenantIdAndStatusAndClientIdOrderByCreatedAtDesc(
            UUID tenantId, String status, String clientId);

    long countByTenantId(UUID tenantId);
}
