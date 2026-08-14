package ma.nafura.etudes.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.etudes.domain.model.DossierIntervenant;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DossierIntervenantRepository extends JpaRepository<DossierIntervenant, UUID> {

    List<DossierIntervenant> findByTenantIdAndDossierEtudeId(UUID tenantId, UUID dossierEtudeId);

    Optional<DossierIntervenant> findByTenantIdAndDossierEtudeIdAndUserIdAndRole(
            UUID tenantId, UUID dossierEtudeId, String userId, String role);

    boolean existsByTenantIdAndDossierEtudeIdAndUserIdAndRoleIn(
            UUID tenantId, UUID dossierEtudeId, String userId, List<String> roles);
}
