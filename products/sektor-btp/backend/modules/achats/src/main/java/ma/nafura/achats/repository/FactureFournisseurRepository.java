package ma.nafura.achats.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.achats.domain.model.FactureFournisseur;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FactureFournisseurRepository extends JpaRepository<FactureFournisseur, UUID> {

    List<FactureFournisseur> findByTenantIdOrderByCreatedAtDesc(UUID tenantId);

    List<FactureFournisseur> findByTenantIdAndBcIdOrderByCreatedAtDesc(UUID tenantId, UUID bcId);

    List<FactureFournisseur> findByTenantIdAndStatusOrderByCreatedAtDesc(UUID tenantId, String status);

    List<FactureFournisseur> findByTenantIdAndFournisseurIdOrderByCreatedAtDesc(UUID tenantId, String fournisseurId);

    List<FactureFournisseur> findByTenantIdAndStatusAndFournisseurIdOrderByCreatedAtDesc(
            UUID tenantId, String status, String fournisseurId);

    Optional<FactureFournisseur> findByIdAndTenantId(UUID id, UUID tenantId);

    long countByTenantId(UUID tenantId);
}
