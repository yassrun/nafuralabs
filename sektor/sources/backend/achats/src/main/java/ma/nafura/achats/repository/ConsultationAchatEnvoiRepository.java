package ma.nafura.achats.repository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;
import ma.nafura.achats.domain.consultation.ConsultationAchatEnvoi;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ConsultationAchatEnvoiRepository
        extends TenantScopedRepository<ConsultationAchatEnvoi, UUID> {

    List<ConsultationAchatEnvoi> findByConsultationIdOrderBySentAtAsc(UUID consultationId);

    List<ConsultationAchatEnvoi> findByConsultationIdInOrderBySentAtAsc(Collection<UUID> consultationIds);

    boolean existsByConsultationId(UUID consultationId);

    boolean existsByDestinataireId(UUID destinataireId);
}
