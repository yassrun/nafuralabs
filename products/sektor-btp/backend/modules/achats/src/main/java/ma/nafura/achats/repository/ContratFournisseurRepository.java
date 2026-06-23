package ma.nafura.achats.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.achats.domain.model.ContratFournisseur;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ContratFournisseurRepository extends TenantScopedRepository<ContratFournisseur, UUID> {

    Optional<ContratFournisseur> findByTenantIdAndNumero(UUID tenantId, String numero);

    List<ContratFournisseur> findByTenantIdOrderByCreatedAtDesc(UUID tenantId);

    List<ContratFournisseur> findByTenantIdAndStatusOrderByCreatedAtDesc(UUID tenantId, String status);

    List<ContratFournisseur> findByTenantIdAndTypeOrderByCreatedAtDesc(UUID tenantId, String type);

    List<ContratFournisseur> findByTenantIdAndFournisseurIdOrderByCreatedAtDesc(UUID tenantId, String fournisseurId);

    List<ContratFournisseur> findByTenantIdAndChantierIdOrderByCreatedAtDesc(UUID tenantId, String chantierId);

    List<ContratFournisseur> findByTenantIdAndChantierIdAndTypeOrderByCreatedAtDesc(
            UUID tenantId, String chantierId, String type);

    List<ContratFournisseur> findByTenantIdAndStatusAndTypeOrderByCreatedAtDesc(
            UUID tenantId, String status, String type);

    List<ContratFournisseur> findByTenantIdAndStatusAndFournisseurIdOrderByCreatedAtDesc(
            UUID tenantId, String status, String fournisseurId);

    List<ContratFournisseur> findByTenantIdAndTypeAndFournisseurIdOrderByCreatedAtDesc(
            UUID tenantId, String type, String fournisseurId);

    List<ContratFournisseur> findByTenantIdAndStatusAndTypeAndFournisseurIdOrderByCreatedAtDesc(
            UUID tenantId, String status, String type, String fournisseurId);

    long countByTenantId(UUID tenantId);

    long countByTenantIdAndType(UUID tenantId, String type);
}
