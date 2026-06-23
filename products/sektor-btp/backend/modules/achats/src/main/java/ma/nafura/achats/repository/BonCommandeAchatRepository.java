package ma.nafura.achats.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.achats.domain.model.BonCommandeAchat;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BonCommandeAchatRepository extends TenantScopedRepository<BonCommandeAchat, UUID> {

    Optional<BonCommandeAchat> findByTenantIdAndNumero(UUID tenantId, String numero);

    List<BonCommandeAchat> findByTenantIdOrderByCreatedAtDesc(UUID tenantId);

    List<BonCommandeAchat> findByTenantIdAndStatusOrderByCreatedAtDesc(UUID tenantId, String status);

    List<BonCommandeAchat> findByTenantIdAndFournisseurIdOrderByCreatedAtDesc(UUID tenantId, String fournisseurId);

    List<BonCommandeAchat> findByTenantIdAndChantierIdOrderByCreatedAtDesc(UUID tenantId, String chantierId);

    List<BonCommandeAchat> findByTenantIdAndStatusAndFournisseurIdOrderByCreatedAtDesc(
            UUID tenantId, String status, String fournisseurId);

    List<BonCommandeAchat> findByTenantIdAndStatusAndChantierIdOrderByCreatedAtDesc(
            UUID tenantId, String status, String chantierId);

    List<BonCommandeAchat> findByTenantIdAndFournisseurIdAndChantierIdOrderByCreatedAtDesc(
            UUID tenantId, String fournisseurId, String chantierId);

    List<BonCommandeAchat> findByTenantIdAndStatusAndFournisseurIdAndChantierIdOrderByCreatedAtDesc(
            UUID tenantId, String status, String fournisseurId, String chantierId);

    long countByTenantId(UUID tenantId);
}
