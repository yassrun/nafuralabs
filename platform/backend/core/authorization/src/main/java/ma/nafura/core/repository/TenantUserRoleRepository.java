package ma.nafura.platform.authorization.repository;

import ma.nafura.platform.authorization.domain.model.TenantUserRole;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Repository
public interface TenantUserRoleRepository extends JpaRepository<TenantUserRole, UUID> {

    List<TenantUserRole> findByTenantIdAndUserId(UUID tenantId, UUID userId);

    List<TenantUserRole> findByTenantIdAndUserIdIn(UUID tenantId, Collection<UUID> userIds);

    List<TenantUserRole> findByTenantIdAndRoleCode(UUID tenantId, String roleCode);

    Page<TenantUserRole> findByTenantIdAndRoleCode(UUID tenantId, String roleCode, Pageable pageable);

    long countByTenantIdAndRoleCode(UUID tenantId, String roleCode);

    @Query("SELECT tur.roleCode, COUNT(tur) FROM TenantUserRole tur WHERE tur.tenantId = :tenantId GROUP BY tur.roleCode")
    List<Object[]> countMembersByRoleCode(@Param("tenantId") UUID tenantId);

    void deleteByTenantIdAndUserId(UUID tenantId, UUID userId);

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


