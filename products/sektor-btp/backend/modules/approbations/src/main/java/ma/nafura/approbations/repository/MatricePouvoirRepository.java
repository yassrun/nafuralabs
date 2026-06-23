package ma.nafura.approbations.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.approbations.domain.model.MatricePouvoir;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MatricePouvoirRepository extends JpaRepository<MatricePouvoir, UUID> {

    List<MatricePouvoir> findByTenantIdAndEntityTypeOrderByOrdreAsc(UUID tenantId, String entityType);

    List<MatricePouvoir> findByTenantIdOrderByEntityTypeAscOrdreAsc(UUID tenantId);

    Optional<MatricePouvoir> findByIdAndTenantId(UUID id, UUID tenantId);

    long countByTenantId(UUID tenantId);
}
