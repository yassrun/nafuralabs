package ma.nafura.chantiers.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import ma.nafura.chantiers.domain.avancement.AvancementPhysique;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AvancementPhysiqueRepository extends TenantScopedRepository<AvancementPhysique, String> {

    List<AvancementPhysique> findByTenantIdAndChantierIdOrderByDateSaisieDescCreatedAtDesc(
            UUID tenantId, String chantierId);

    List<AvancementPhysique> findByTenantIdAndLotIdOrderByDateSaisieAscCreatedAtAsc(
            UUID tenantId, String lotId);

    /** Déclarations sur un poste — le nœud est la feuille (AC-1). */
    List<AvancementPhysique> findByTenantIdAndPosteIdOrderByDateSaisieAscCreatedAtAsc(
            UUID tenantId, String posteId);

    /** Déclarations directement sur un lot-feuille, sans poste (AC-1). */
    List<AvancementPhysique> findByTenantIdAndLotIdAndPosteIdIsNullOrderByDateSaisieAscCreatedAtAsc(
            UUID tenantId, String lotId);

    long countByTenantId(UUID tenantId);

    /** AC-11 — les déclarations d'un chantier sur une période, pour le montage des lignes. */
    List<AvancementPhysique> findByTenantIdAndChantierIdAndDateSaisieBetween(
            UUID tenantId, String chantierId, LocalDate dateDebut, LocalDate dateFin);

    List<AvancementPhysique> findByTenantIdAndChantierIdAndStatusOrderByDateSaisieAscCreatedAtAsc(
            UUID tenantId, String chantierId, String status);

    /** Quantités déclarées depuis une activité (AC-9 — % dérivé fait/prévu de cette activité). */
    List<AvancementPhysique> findByTenantIdAndActiviteId(UUID tenantId, String activiteId);
}
