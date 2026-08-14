package ma.nafura.partner.repository;

import java.util.UUID;
import ma.nafura.partner.domain.model.Partner;
import ma.nafura.partner.domain.model.PartnerRoleType;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface PartnerRepository extends TenantScopedRepository<Partner, UUID> {

    boolean existsByTenantIdAndCode(UUID tenantId, String code);

    @Query(
            """
            SELECT DISTINCT p FROM Partner p
            JOIN PartnerRole pr ON pr.partnerId = p.id AND pr.tenantId = p.tenantId
            WHERE p.tenantId = :tenantId AND pr.role = :role
            """)
    Page<Partner> findByTenantIdAndRole(
            @Param("tenantId") UUID tenantId,
            @Param("role") PartnerRoleType role,
            Pageable pageable);
}
