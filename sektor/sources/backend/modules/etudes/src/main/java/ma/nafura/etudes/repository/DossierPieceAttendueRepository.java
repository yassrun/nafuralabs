package ma.nafura.etudes.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.etudes.domain.model.DossierPieceAttendue;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DossierPieceAttendueRepository extends JpaRepository<DossierPieceAttendue, UUID> {

    List<DossierPieceAttendue> findByTenantIdAndDossierEtudeIdOrderByCreatedAtAsc(
            UUID tenantId, UUID dossierEtudeId);

    Optional<DossierPieceAttendue> findByIdAndTenantId(UUID id, UUID tenantId);

    Optional<DossierPieceAttendue> findByTenantIdAndDossierEtudeIdAndType(
            UUID tenantId, UUID dossierEtudeId, String type);

    List<DossierPieceAttendue> findByTenantIdAndDossierDocumentId(
            UUID tenantId, UUID dossierDocumentId);

    boolean existsByTenantIdAndDossierEtudeIdAndType(
            UUID tenantId, UUID dossierEtudeId, String type);

    long countByTenantIdAndDossierEtudeIdAndObligatoireTrueAndDossierDocumentIdIsNull(
            UUID tenantId, UUID dossierEtudeId);
}
