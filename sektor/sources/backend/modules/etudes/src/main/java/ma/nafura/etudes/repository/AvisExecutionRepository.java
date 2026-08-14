package ma.nafura.etudes.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.etudes.domain.model.AvisExecution;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AvisExecutionRepository extends JpaRepository<AvisExecution, UUID> {

    List<AvisExecution> findByTenantIdAndDossierEtudeIdOrderByCreatedAtDesc(
            UUID tenantId, UUID dossierEtudeId);

    List<AvisExecution> findByTenantIdAndDossierEtudeIdAndDpgfNoeudIdOrderByCreatedAtDesc(
            UUID tenantId, UUID dossierEtudeId, UUID dpgfNoeudId);

    Optional<AvisExecution> findByIdAndTenantIdAndDossierEtudeId(
            UUID id, UUID tenantId, UUID dossierEtudeId);

    long countByTenantIdAndDossierEtudeIdAndStatut(UUID tenantId, UUID dossierEtudeId, String statut);
}
