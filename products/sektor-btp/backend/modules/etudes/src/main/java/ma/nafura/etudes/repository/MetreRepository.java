package ma.nafura.etudes.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.etudes.domain.model.Metre;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MetreRepository extends TenantScopedRepository<Metre, UUID> {

    List<Metre> findByTenantIdOrderByDateMetreDescCreatedAtDesc(UUID tenantId);

    List<Metre> findByTenantIdAndStatusOrderByDateMetreDescCreatedAtDesc(UUID tenantId, String status);

    Optional<Metre> findByTenantIdAndNumero(UUID tenantId, String numero);

    long countByTenantId(UUID tenantId);

    long countByTenantIdAndNumeroStartingWith(UUID tenantId, String prefix);
}
