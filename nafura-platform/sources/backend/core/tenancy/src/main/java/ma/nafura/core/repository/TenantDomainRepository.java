package ma.nafura.platform.tenancy.repository;

import ma.nafura.platform.tenancy.domain.model.TenantDomain;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TenantDomainRepository extends JpaRepository<TenantDomain, UUID> {
    
    List<TenantDomain> findByTenantId(UUID tenantId);
    Optional<TenantDomain> findByTenantIdAndDomainCode(UUID tenantId, String domainCode);
    
    void deleteByTenantId(UUID tenantId);
}

