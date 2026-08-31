package ma.nafura.achats.repository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;
import ma.nafura.achats.domain.consultation.ConsultationAchatDestinataire;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ConsultationAchatDestinataireRepository
        extends TenantScopedRepository<ConsultationAchatDestinataire, UUID> {

    List<ConsultationAchatDestinataire> findByConsultationIdOrderByCreatedAtAsc(UUID consultationId);

    List<ConsultationAchatDestinataire> findByConsultationIdInOrderByCreatedAtAsc(Collection<UUID> consultationIds);

    boolean existsByConsultationIdAndFournisseurId(UUID consultationId, UUID fournisseurId);
}
