package ma.nafura.etudes.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.etudes.domain.planning.DossierPlanningRessource;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DossierPlanningRessourceRepository
        extends JpaRepository<DossierPlanningRessource, UUID> {

    List<DossierPlanningRessource> findByTenantIdAndDossierIdOrderByTypeAscOrdreAscCreatedAtAsc(
            UUID tenantId, UUID dossierId);

    Optional<DossierPlanningRessource> findByIdAndTenantIdAndDossierId(
            UUID id, UUID tenantId, UUID dossierId);
}
