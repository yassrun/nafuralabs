package ma.nafura.etudes.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.etudes.domain.model.Ouvrage;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface OuvrageRepository extends TenantScopedRepository<Ouvrage, UUID> {

    List<Ouvrage> findByTenantIdOrderByCodeAsc(UUID tenantId);

    Optional<Ouvrage> findByTenantIdAndCode(UUID tenantId, String code);

    boolean existsByTenantIdAndCode(UUID tenantId, String code);

    long countByTenantId(UUID tenantId);
}
