package ma.nafura.finance.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.finance.domain.model.Caisse;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CaisseRepository extends JpaRepository<Caisse, UUID> {

    long countByTenantId(UUID tenantId);

    List<Caisse> findByTenantIdOrderByNameAsc(UUID tenantId);

    List<Caisse> findByTenantIdAndCaisseTypeOrderByNameAsc(UUID tenantId, String caisseType);

    List<Caisse> findByTenantIdAndCaisseTypeAndChantierIdOrderByNameAsc(
            UUID tenantId, String caisseType, String chantierId);

    Optional<Caisse> findByIdAndTenantId(UUID id, UUID tenantId);

    Optional<Caisse> findByTenantIdAndCode(UUID tenantId, String code);
}
