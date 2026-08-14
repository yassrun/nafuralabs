package ma.nafura.catalogue.repository;

import java.util.Optional;
import java.util.UUID;
import ma.nafura.catalogue.domain.model.Materiel;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MaterielRepository extends TenantScopedRepository<Materiel, UUID> {

    Optional<Materiel> findByTenantIdAndCode(UUID tenantId, String code);

    boolean existsByTenantIdAndCode(UUID tenantId, String code);
}
