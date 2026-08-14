package ma.nafura.platform.identity.repository;

import ma.nafura.platform.identity.domain.model.AppUser;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface AppUserRepository extends JpaRepository<AppUser, UUID> {

    Optional<AppUser> findByEmailIgnoreCase(String email);

    /**
     * Find user by tenant membership and email (case-insensitive).
     */
    @Query(value = "SELECT u.* FROM app_user u " +
           "JOIN tenant_membership tm ON tm.user_id = u.id " +
           "WHERE tm.tenant_id = :tenantId AND LOWER(u.email) = LOWER(:email) " +
           "LIMIT 1",
           nativeQuery = true)
    Optional<AppUser> findByTenantIdAndEmail(@Param("tenantId") UUID tenantId, @Param("email") String email);

    /**
     * Check whether a user is a member of tenant by email (case-insensitive).
     */
    @Query(value = "SELECT EXISTS(SELECT 1 FROM app_user u " +
           "JOIN tenant_membership tm ON tm.user_id = u.id " +
           "WHERE tm.tenant_id = :tenantId AND LOWER(u.email) = LOWER(:email))",
           nativeQuery = true)
    boolean existsByTenantIdAndEmail(@Param("tenantId") UUID tenantId, @Param("email") String email);

    @Query(value = "SELECT COUNT(*) FROM tenant_membership tm WHERE tm.tenant_id = :tenantId",
           nativeQuery = true)
    long countByTenantId(@Param("tenantId") UUID tenantId);

    @Query(value = "SELECT COUNT(*) FROM tenant_membership tm " +
           "WHERE tm.tenant_id = :tenantId AND UPPER(tm.status) = UPPER(:status)",
           nativeQuery = true)
    long countByTenantIdAndStatus(@Param("tenantId") UUID tenantId, @Param("status") String status);

    /**
     * Resolve mention target in a tenant by:
     * - exact email
     * - email local-part (before @)
     * - exact display name
     */
    @Query(value = "SELECT u.* FROM app_user u " +
           "JOIN tenant_membership tm ON tm.user_id = u.id " +
           "WHERE tm.tenant_id = :tenantId " +
           "AND (" +
           "  LOWER(u.email) = LOWER(:identifier) " +
           "  OR LOWER(split_part(u.email, '@', 1)) = LOWER(:identifier) " +
           "  OR LOWER(COALESCE(u.name, '')) = LOWER(:identifier)" +
           ") " +
           "LIMIT 1",
           nativeQuery = true)
    Optional<AppUser> findMentionCandidate(
        @Param("tenantId") UUID tenantId,
        @Param("identifier") String identifier
    );

    /**
     * Search tenant members with optional filters.
     * Status comes from tenant_membership; roles come from tenant_user_role.
     */
    @Query(value = "SELECT u FROM AppUser u " +
           "WHERE EXISTS (" +
           "    SELECT tm.id FROM TenantMembership tm " +
           "    WHERE tm.tenantId = :tenantId " +
           "      AND tm.userId = u.id " +
           "      AND (:applyStatus = false OR tm.status = :status) " +
           "      AND (:applyRole = false OR EXISTS (" +
           "          SELECT tur.id FROM TenantUserRole tur " +
           "          WHERE tur.tenantId = tm.tenantId " +
           "            AND tur.userId = tm.userId " +
           "            AND tur.roleCode = :role" +
           "      ))" +
           ") " +
           "AND (:applySearch = false " +
           "  OR LOWER(u.email) LIKE :searchPattern " +
           "  OR LOWER(COALESCE(u.name, '')) LIKE :searchPattern)",
           countQuery = "SELECT COUNT(u) FROM AppUser u " +
           "WHERE EXISTS (" +
           "    SELECT tm.id FROM TenantMembership tm " +
           "    WHERE tm.tenantId = :tenantId " +
           "      AND tm.userId = u.id " +
           "      AND (:applyStatus = false OR tm.status = :status) " +
           "      AND (:applyRole = false OR EXISTS (" +
           "          SELECT tur.id FROM TenantUserRole tur " +
           "          WHERE tur.tenantId = tm.tenantId " +
           "            AND tur.userId = tm.userId " +
           "            AND tur.roleCode = :role" +
           "      ))" +
           ") " +
           "AND (:applySearch = false " +
           "  OR LOWER(u.email) LIKE :searchPattern " +
           "  OR LOWER(COALESCE(u.name, '')) LIKE :searchPattern)")
    Page<AppUser> searchMembers(
        @Param("tenantId") UUID tenantId,
        @Param("applySearch") boolean applySearch,
        @Param("searchPattern") String searchPattern,
        @Param("applyStatus") boolean applyStatus,
        @Param("status") String status,
        @Param("applyRole") boolean applyRole,
        @Param("role") String role,
        Pageable pageable
    );

    /**
     * Count members matching search criteria.
     */
    @Query(value = "SELECT COUNT(*) FROM app_user u " +
           "JOIN tenant_membership tm ON tm.user_id = u.id " +
           "WHERE tm.tenant_id = :tenantId " +
           "AND (:search IS NULL OR u.email ILIKE CONCAT('%', CAST(:search AS text), '%') " +
           "    OR COALESCE(u.name, '')::text ILIKE CONCAT('%', CAST(:search AS text), '%')) " +
           "AND (:status IS NULL OR UPPER(tm.status) = UPPER(CAST(:status AS text))) " +
           "AND (:role IS NULL OR EXISTS (" +
           "    SELECT 1 FROM tenant_user_role tur " +
           "    WHERE tur.tenant_id = tm.tenant_id " +
           "      AND tur.user_id = tm.user_id " +
           "      AND UPPER(tur.role_code) = UPPER(CAST(:role AS text))" +
           "))",
           nativeQuery = true)
    long countSearchMembers(
        @Param("tenantId") UUID tenantId,
        @Param("search") String search,
        @Param("status") String status,
        @Param("role") String role
    );
}

