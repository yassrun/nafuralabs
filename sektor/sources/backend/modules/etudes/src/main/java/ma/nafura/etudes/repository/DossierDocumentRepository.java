package ma.nafura.etudes.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.etudes.domain.model.DossierDocument;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DossierDocumentRepository extends JpaRepository<DossierDocument, UUID> {

    List<DossierDocument> findByTenantIdAndDossierEtudeIdOrderByOrdreAsc(UUID tenantId, UUID dossierEtudeId);

    Optional<DossierDocument> findByIdAndTenantId(UUID id, UUID tenantId);

    long countByTenantIdAndDossierEtudeId(UUID tenantId, UUID dossierEtudeId);
}
