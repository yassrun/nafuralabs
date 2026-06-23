package ma.nafura.finance.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.finance.domain.model.Reglement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface ReglementRepository extends JpaRepository<Reglement, UUID>, JpaSpecificationExecutor<Reglement> {

    Optional<Reglement> findByIdAndTenantId(UUID id, UUID tenantId);

    List<Reglement> findByTenantIdOrderByReglementDateDesc(UUID tenantId);

    long countByTenantIdAndReglementDateBetween(UUID tenantId, java.time.LocalDate start, java.time.LocalDate end);
}
