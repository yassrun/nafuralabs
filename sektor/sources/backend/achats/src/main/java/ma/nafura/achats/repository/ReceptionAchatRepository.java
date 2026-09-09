package ma.nafura.achats.repository;

import java.util.List;
import java.util.UUID;
import ma.nafura.achats.domain.reception.ReceptionAchat;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReceptionAchatRepository extends JpaRepository<ReceptionAchat, UUID> {

    List<ReceptionAchat> findByTenantIdAndBonCommandeAchatIdIn(UUID tenantId, java.util.Collection<UUID> commandeIds);

    List<ReceptionAchat> findByTenantIdAndBonCommandeAchatIdOrderByCreatedAtDesc(
            UUID tenantId, UUID bonCommandeAchatId);

    long countByTenantId(UUID tenantId);
}
