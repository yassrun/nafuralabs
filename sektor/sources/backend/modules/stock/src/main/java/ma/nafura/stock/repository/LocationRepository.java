package ma.nafura.stock.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import ma.nafura.stock.domain.model.Location;
import org.springframework.stereotype.Repository;

/**
 * Repository for Location entity.
 * Generated once — add custom queries here.
 */
@Repository
public interface LocationRepository extends TenantScopedRepository<Location, UUID> {

    Optional<Location> findByTenantIdAndCode(UUID tenantId, String code);

    List<Location> findByTenantIdAndType(UUID tenantId, String type);
}
