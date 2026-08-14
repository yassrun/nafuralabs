package ma.nafura.platform.administration.iam.repository;

import ma.nafura.platform.administration.iam.domain.model.TenantCustomRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TenantCustomRoleRepository extends JpaRepository<TenantCustomRole, UUID> {

    List<TenantCustomRole> findByTenantIdOrderByRoleCode(UUID tenantId);

    Optional<TenantCustomRole> findByTenantIdAndRoleCode(UUID tenantId, String roleCode);

    boolean existsByTenantIdAndRoleCode(UUID tenantId, String roleCode);

    void deleteByTenantIdAndRoleCode(UUID tenantId, String roleCode);
}


