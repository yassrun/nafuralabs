package ma.nafura.platform.authorization.repository;

import ma.nafura.platform.authorization.domain.model.RolePermission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface RolePermissionRepository extends JpaRepository<RolePermission, UUID> {
    
    /**
     * Find all permissions for a given role.
     */
    List<RolePermission> findByRoleCode(String roleCode);
    
    /**
     * Find all permissions for multiple roles.
     */
    List<RolePermission> findByRoleCodeIn(List<String> roleCodes);

    /**
     * Find all distinct role codes that have permission definitions.
     */
    @Query("select distinct rp.roleCode from RolePermission rp order by rp.roleCode")
    List<String> findDistinctRoleCodes();
    
    /**
     * Check if a permission exists for a role.
     */
    boolean existsByRoleCodeAndPermission(String roleCode, String permission);

    boolean existsByRoleCode(String roleCode);
}

