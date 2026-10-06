package ma.nafura.platform.authorization.repository;

import ma.nafura.platform.authorization.domain.model.TenantUserRole;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Repository
public interface TenantUserRoleRepository extends JpaRepository<TenantUserRole, UUID> {

    List<TenantUserRole> findByTenantIdAndUserId(UUID tenantId, UUID userId);

    List<TenantUserRole> findByTenantId(UUID tenantId);

    List<TenantUserRole> findByTenantIdAndUserIdIn(UUID tenantId, Collection<UUID> userIds);

    List<TenantUserRole> findByTenantIdAndRoleCode(UUID tenantId, String roleCode);

    Page<TenantUserRole> findByTenantIdAndRoleCode(UUID tenantId, String roleCode, Pageable pageable);

    long countByTenantIdAndRoleCode(UUID tenantId, String roleCode);

    @Query(value = "SELECT COUNT(*) FROM tenant_user_role tur " +
           "INNER JOIN tenant_membership tm ON tm.tenant_id = tur.tenant_id AND tm.user_id = tur.user_id " +
           "WHERE tur.tenant_id = :tenantId AND UPPER(tur.role_code) = UPPER(:roleCode) " +
           "AND UPPER(tm.status) = 'ACTIVE'",
           nativeQuery = true)
    long countActiveMembersWithRole(@Param("tenantId") UUID tenantId, @Param("roleCode") String roleCode);

    @Query(value = "SELECT COUNT(*) FROM tenant_user_role tur " +
           "INNER JOIN tenant_membership tm ON tm.tenant_id = tur.tenant_id AND tm.user_id = tur.user_id " +
           "WHERE tur.tenant_id = :tenantId AND UPPER(tur.role_code) = UPPER(:roleCode) " +
           "AND UPPER(tm.status) = 'ACTIVE' AND tur.user_id <> :excludeUserId",
           nativeQuery = true)
    long countActiveMembersWithRoleExcludingUser(
            @Param("tenantId") UUID tenantId,
            @Param("roleCode") String roleCode,
            @Param("excludeUserId") UUID excludeUserId);

    @Query("SELECT tur.roleCode, COUNT(tur) FROM TenantUserRole tur WHERE tur.tenantId = :tenantId GROUP BY tur.roleCode")
    List<Object[]> countMembersByRoleCode(@Param("tenantId") UUID tenantId);

    // Bulk delete executed now: a derived delete runs at flush, after the re-inserted rows of a role replacement.
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("DELETE FROM TenantUserRole tur WHERE tur.tenantId = :tenantId AND tur.userId = :userId")
    void deleteByTenantIdAndUserId(@Param("tenantId") UUID tenantId, @Param("userId") UUID userId);

    void deleteByTenantIdAndRoleCodeAndUserIdIn(UUID tenantId, String roleCode, Collection<UUID> userIds);

    @Query(value = "SELECT tur.role_code FROM tenant_user_role tur " +
           "WHERE tur.tenant_id = :tenantId AND tur.user_id = :userId " +
           "ORDER BY tur.role_code",
           nativeQuery = true)
    List<String> findRoleCodesByTenantIdAndUserId(
            @Param("tenantId") UUID tenantId,
            @Param("userId") UUID userId);

    @Query(value = "SELECT tur.role_code FROM tenant_user_role tur " +
           "JOIN app_user u ON u.id = tur.user_id " +
           "WHERE tur.tenant_id = :tenantId AND LOWER(u.email) = LOWER(:email) " +
           "ORDER BY tur.role_code",
           nativeQuery = true)
    List<String> findRoleCodesByTenantIdAndEmailIgnoreCase(
            @Param("tenantId") UUID tenantId,
            @Param("email") String email);

    @Query(value = "SELECT DISTINCT tur.role_code FROM tenant_user_role tur " +
           "JOIN app_user u ON u.id = tur.user_id " +
           "WHERE LOWER(u.email) = LOWER(:email) " +
           "ORDER BY tur.role_code",
           nativeQuery = true)
    List<String> findDistinctRoleCodesByEmailIgnoreCase(@Param("email") String email);
}


