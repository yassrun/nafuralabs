package ma.nafura.etudes.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.etudes.domain.cps.CpsDocument;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CpsDocumentRepository extends JpaRepository<CpsDocument, UUID> {

    Optional<CpsDocument> findByIdAndTenantId(UUID id, UUID tenantId);

    Optional<CpsDocument> findByTenantIdAndDossierDocumentId(UUID tenantId, UUID dossierDocumentId);

    List<CpsDocument> findByTenantIdAndDossierDocumentIdIn(UUID tenantId, List<UUID> dossierDocumentIds);
}
