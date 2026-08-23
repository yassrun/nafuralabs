package ma.nafura.etudes.adapters.bc;

import java.util.UUID;
import ma.nafura.achats.domain.fournisseur.Partner;
import ma.nafura.achats.domain.fournisseur.PartnerRoleType;
import ma.nafura.achats.repository.PartnerRepository;
import ma.nafura.achats.repository.PartnerRoleRepository;
import ma.nafura.etudes.service.port.bc.EtudeFournisseurPort;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;

@Component
@Primary
public class PartnerFournisseurAdapter implements EtudeFournisseurPort {

    private final PartnerRepository partnerRepository;
    private final PartnerRoleRepository roleRepository;

    public PartnerFournisseurAdapter(
            PartnerRepository partnerRepository, PartnerRoleRepository roleRepository) {
        this.partnerRepository = partnerRepository;
        this.roleRepository = roleRepository;
    }

    @Override
    public FournisseurSnapshot requireFournisseur(UUID partenaireId) {
        if (partenaireId == null) {
            throw new IllegalArgumentException("etudes.consultation.fournisseur.requis");
        }
        Partner partner = partnerRepository
                .findByIdAndTenantId(partenaireId, tenantId())
                .orElseThrow(() -> new IllegalArgumentException("etudes.consultation.fournisseur.introuvable"));
        if (!roleRepository.existsByTenantIdAndPartnerIdAndRole(
                tenantId(), partner.getId(), PartnerRoleType.FOURNISSEUR)) {
            throw new IllegalArgumentException("etudes.consultation.fournisseur.role_invalide");
        }
        return new FournisseurSnapshot(partner.getId(), partner.getCode(), partner.getRaisonSociale());
    }

    private static UUID tenantId() {
        return TenantContext.getTenantId();
    }
}
