package ma.nafura.etudes.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.etudes.domain.consultation.DevisConsultation;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DevisConsultationRepository extends JpaRepository<DevisConsultation, UUID> {

    Optional<DevisConsultation> findByIdAndTenantId(UUID id, UUID tenantId);

    List<DevisConsultation> findByTenantIdAndConsultationIdOrderByRecuAtAsc(
            UUID tenantId, UUID consultationId);

    boolean existsByConsultationIdAndPartenaireId(UUID consultationId, UUID partenaireId);

    long countByTenantIdAndConsultationId(UUID tenantId, UUID consultationId);
}
