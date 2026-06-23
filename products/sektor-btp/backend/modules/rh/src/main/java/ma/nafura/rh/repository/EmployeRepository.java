package ma.nafura.rh.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import ma.nafura.rh.domain.model.Employe;
import org.springframework.stereotype.Repository;

@Repository
public interface EmployeRepository extends TenantScopedRepository<Employe, String> {

    Optional<Employe> findByTenantIdAndMatricule(UUID tenantId, String matricule);

    List<Employe> findByTenantIdOrderByNomAscPrenomAsc(UUID tenantId);

    List<Employe> findByTenantIdAndStatutOrderByNomAscPrenomAsc(UUID tenantId, String statut);

    List<Employe> findByTenantIdAndTypeContratOrderByNomAscPrenomAsc(UUID tenantId, String typeContrat);

    List<Employe> findByTenantIdAndCategorieOrderByNomAscPrenomAsc(UUID tenantId, String categorie);

    List<Employe> findByTenantIdAndStatutAndTypeContratOrderByNomAscPrenomAsc(
            UUID tenantId, String statut, String typeContrat);

    List<Employe> findByTenantIdAndStatutAndCategorieOrderByNomAscPrenomAsc(
            UUID tenantId, String statut, String categorie);

    List<Employe> findByTenantIdAndTypeContratAndCategorieOrderByNomAscPrenomAsc(
            UUID tenantId, String typeContrat, String categorie);

    List<Employe> findByTenantIdAndStatutAndTypeContratAndCategorieOrderByNomAscPrenomAsc(
            UUID tenantId, String statut, String typeContrat, String categorie);

    long countByTenantId(UUID tenantId);
}
