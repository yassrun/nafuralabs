package ma.nafura.stock.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import ma.nafura.stock.domain.model.MaterielAffectation;
import org.springframework.stereotype.Repository;

@Repository
public interface MaterielAffectationRepository extends TenantScopedRepository<MaterielAffectation, UUID> {

    List<MaterielAffectation> findByTenantIdOrderByDateDebutDesc(UUID tenantId);

    List<MaterielAffectation> findByTenantIdAndMaterielIdOrderByDateDebutDesc(UUID tenantId, UUID materielId);

    List<MaterielAffectation> findByTenantIdAndStatusOrderByDateDebutDesc(UUID tenantId, String status);

    Optional<MaterielAffectation> findFirstByTenantIdAndMaterielIdAndStatusOrderByDateDebutDesc(
            UUID tenantId, UUID materielId, String status);
}
