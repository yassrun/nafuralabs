package ma.nafura.etudes.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.etudes.domain.dossier.DossierAgentSuggestion;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DossierAgentSuggestionRepository extends JpaRepository<DossierAgentSuggestion, UUID> {

    List<DossierAgentSuggestion> findByTenantIdAndDossierEtudeIdOrderByCreatedAtDesc(
            UUID tenantId, UUID dossierEtudeId);

    Optional<DossierAgentSuggestion> findByIdAndTenantIdAndDossierEtudeId(
            UUID id, UUID tenantId, UUID dossierEtudeId);

    Optional<DossierAgentSuggestion> findByTenantIdAndDossierEtudeIdAndFingerprint(
            UUID tenantId, UUID dossierEtudeId, String fingerprint);
}
