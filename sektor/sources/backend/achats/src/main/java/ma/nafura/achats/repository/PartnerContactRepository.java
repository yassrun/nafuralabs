package ma.nafura.achats.repository;

import java.util.List;
import java.util.UUID;
import ma.nafura.achats.domain.fournisseur.PartnerContact;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface PartnerContactRepository extends TenantScopedRepository<PartnerContact, UUID> {

    List<PartnerContact> findByTenantIdAndPartnerIdOrderByNomAsc(UUID tenantId, UUID partnerId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(
            "update PartnerContact c set c.isPrimary = false"
                    + " where c.tenantId = :tenantId and c.partnerId = :partnerId and c.isPrimary = true")
    void clearPrimaryForPartner(@Param("tenantId") UUID tenantId, @Param("partnerId") UUID partnerId);
}
