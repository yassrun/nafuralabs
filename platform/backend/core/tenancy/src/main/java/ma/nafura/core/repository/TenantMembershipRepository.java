package ma.nafura.platform.tenancy.repository;

import ma.nafura.platform.tenancy.domain.model.TenantMembership;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TenantMembershipRepository extends JpaRepository<TenantMembership, UUID> {

    List<TenantMembership> findByTenantId(UUID tenantId);

    List<TenantMembership> findByUserId(UUID userId);

    List<TenantMembership> findByTenantIdAndUserIdIn(UUID tenantId, Collection<UUID> userIds);

    Optional<TenantMembership> findByTenantIdAndUserId(UUID tenantId, UUID userId);

    boolean existsByTenantIdAndUserId(UUID tenantId, UUID userId);

    @Query(value = "SELECT tm.* FROM tenant_membership tm " +
           "JOIN app_user u ON u.id = tm.user_id " +
           "WHERE tm.tenant_id = :tenantId AND LOWER(u.email) = LOWER(:email) " +
           "LIMIT 1",
           nativeQuery = true)
    Optional<TenantMembership> findByTenantIdAndEmail(@Param("tenantId") UUID tenantId, @Param("email") String email);

    @Query(value = "SELECT EXISTS(SELECT 1 FROM tenant_membership tm " +
           "JOIN app_user u ON u.id = tm.user_id " +
           "WHERE tm.tenant_id = :tenantId AND LOWER(u.email) = LOWER(:email))",
           nativeQuery = true)
    boolean existsByTenantIdAndEmail(@Param("tenantId") UUID tenantId, @Param("email") String email);

    @Query(value = "SELECT EXISTS(SELECT 1 FROM tenant_membership tm " +
           "JOIN app_user u ON u.id = tm.user_id " +
           "WHERE tm.tenant_id = :tenantId AND LOWER(u.email) = LOWER(:email) " +
           "AND UPPER(tm.status) = UPPER(:status))",
           nativeQuery = true)
    boolean existsByTenantIdAndEmailAndStatus(
            @Param("tenantId") UUID tenantId,
            @Param("email") String email,
            @Param("status") String status);

    @Query(value = "SELECT tm.* FROM tenant_membership tm " +
           "JOIN app_user u ON u.id = tm.user_id " +
           "WHERE tm.tenant_id = :tenantId AND LOWER(u.email) = LOWER(:email) " +
           "AND UPPER(tm.status) = UPPER(:status) " +
           "LIMIT 1",
           nativeQuery = true)
    Optional<TenantMembership> findByTenantIdAndEmailAndStatus(
            @Param("tenantId") UUID tenantId,
            @Param("email") String email,
            @Param("status") String status);

    @Query(value = "SELECT DISTINCT tm.tenant_id FROM tenant_membership tm " +
           "JOIN app_user u ON u.id = tm.user_id " +
           "WHERE LOWER(u.email) = LOWER(:email) " +
           "AND UPPER(tm.status) = UPPER(:status) " +
           "ORDER BY tm.tenant_id",
           nativeQuery = true)
    List<UUID> findDistinctTenantIdsByEmailAndStatus(
            @Param("email") String email,
            @Param("status") String status);

    void deleteByTenantIdAndUserId(UUID tenantId, UUID userId);

    long countByTenantId(UUID tenantId);

    long countByTenantIdAndStatus(UUID tenantId, String status);
}

