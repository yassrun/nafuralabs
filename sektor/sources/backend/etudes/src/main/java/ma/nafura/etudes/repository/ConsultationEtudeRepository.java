package ma.nafura.etudes.repository;

import java.util.Optional;
import java.util.UUID;
import ma.nafura.etudes.domain.consultation.ConsultationEtude;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ConsultationEtudeRepository extends JpaRepository<ConsultationEtude, UUID> {

    Optional<ConsultationEtude> findByIdAndTenantId(UUID id, UUID tenantId);

    Optional<ConsultationEtude> findByTenantIdAndDossierEtudeId(UUID tenantId, UUID dossierEtudeId);
}
