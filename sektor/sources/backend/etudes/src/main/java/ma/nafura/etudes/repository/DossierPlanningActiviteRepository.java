package ma.nafura.etudes.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.etudes.domain.planning.DossierPlanningActivite;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DossierPlanningActiviteRepository extends JpaRepository<DossierPlanningActivite, UUID> {

    List<DossierPlanningActivite> findByTenantIdAndDossierIdOrderByOrdreAscCreatedAtAsc(
            UUID tenantId, UUID dossierId);

    Optional<DossierPlanningActivite> findByIdAndTenantIdAndDossierId(
            UUID id, UUID tenantId, UUID dossierId);
}
