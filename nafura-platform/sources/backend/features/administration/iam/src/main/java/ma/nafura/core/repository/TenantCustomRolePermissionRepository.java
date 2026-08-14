package ma.nafura.platform.administration.iam.repository;

import ma.nafura.platform.administration.iam.domain.model.TenantCustomRolePermission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TenantCustomRolePermissionRepository extends JpaRepository<TenantCustomRolePermission, UUID> {

    List<TenantCustomRolePermission> findByTenantIdAndRoleCode(UUID tenantId, String roleCode);

    void deleteByTenantIdAndRoleCode(UUID tenantId, String roleCode);
}


