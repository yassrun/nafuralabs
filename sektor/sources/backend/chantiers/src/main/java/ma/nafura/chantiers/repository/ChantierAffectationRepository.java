package ma.nafura.chantiers.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.chantiers.domain.chantier.ChantierAffectation;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ChantierAffectationRepository extends TenantScopedRepository<ChantierAffectation, String> {

    List<ChantierAffectation> findByTenantIdAndEmployeIdInAndIsActiveTrue(UUID tenantId, java.util.Collection<String> employeeIds);

    List<ChantierAffectation> findByTenantIdAndChantierIdAndIsActiveTrueOrderByRoleCodeAscEmployeIdAsc(
            UUID tenantId, String chantierId);

    List<ChantierAffectation> findByTenantIdAndEmployeIdAndIsActiveTrueOrderByChantierIdAsc(
            UUID tenantId, String employeId);

    List<ChantierAffectation> findByTenantIdAndChantierIdAndRoleCodeAndIsActiveTrue(
            UUID tenantId, String chantierId, String roleCode);

    Optional<ChantierAffectation> findByTenantIdAndChantierIdAndEmployeIdAndRoleCodeAndIsActiveTrue(
            UUID tenantId, String chantierId, String employeId, String roleCode);

    @Query("""
            SELECT a FROM ChantierAffectation a
            WHERE a.tenantId = :tenantId
              AND a.employeId = :employeId
              AND a.isActive = TRUE
              AND a.dateDebut <= :onDate
              AND (a.dateFin IS NULL OR a.dateFin >= :onDate)
            """)
    List<ChantierAffectation> findActiveForEmployeOnDate(
            @Param("tenantId") UUID tenantId,
            @Param("employeId") String employeId,
            @Param("onDate") LocalDate onDate);

    @Query("""
            SELECT a FROM ChantierAffectation a
            WHERE a.tenantId = :tenantId
              AND a.chantierId = :chantierId
              AND a.roleCode = :roleCode
              AND a.isActive = TRUE
              AND a.dateDebut <= :onDate
              AND (a.dateFin IS NULL OR a.dateFin >= :onDate)
            ORDER BY a.dateDebut ASC
            """)
    List<ChantierAffectation> findActiveForChantierRoleOnDate(
            @Param("tenantId") UUID tenantId,
            @Param("chantierId") String chantierId,
            @Param("roleCode") String roleCode,
            @Param("onDate") LocalDate onDate);
}
