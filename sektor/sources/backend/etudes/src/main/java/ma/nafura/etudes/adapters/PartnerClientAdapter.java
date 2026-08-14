package ma.nafura.etudes.adapters;

import java.util.Optional;
import java.util.UUID;
import ma.nafura.etudes.service.port.EtudeClientPort;
import ma.nafura.achats.domain.model.Partner;
import ma.nafura.achats.domain.model.PartnerRoleType;
import ma.nafura.achats.repository.PartnerRepository;
import ma.nafura.achats.repository.PartnerRoleRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

/**
 * Résout les clients d'étude via le référentiel Partner (rôle CLIENT).
 */
@Component
@Primary
public class PartnerClientAdapter implements EtudeClientPort {

    private final PartnerRepository partnerRepository;
    private final PartnerRoleRepository roleRepository;

    public PartnerClientAdapter(
            PartnerRepository partnerRepository, PartnerRoleRepository roleRepository) {
        this.partnerRepository = partnerRepository;
        this.roleRepository = roleRepository;
    }

    @Override
    public Optional<ClientSnapshot> resolve(String clientId) {
        if (!StringUtils.hasText(clientId)) {
            return Optional.empty();
        }
        return Optional.of(requireClientRole(clientId.trim()));
    }

    @Override
    public ClientSnapshot requireClient(String clientId) {
        if (!StringUtils.hasText(clientId)) {
            throw new IllegalArgumentException("etudes.gate.chiffrage.client_manquant");
        }
        UUID id = parseUuid(clientId.trim());
        Partner partner = partnerRepository
                .findByIdAndTenantId(id, tenantId())
                .orElseThrow(() -> new IllegalArgumentException("etudes.client.introuvable"));
        return toSnapshot(partner);
    }

    @Override
    public ClientSnapshot requireClientRole(String clientId) {
        ClientSnapshot snap = requireClient(clientId);
        if (!roleRepository.existsByTenantIdAndPartnerIdAndRole(
                tenantId(), snap.id(), PartnerRoleType.CLIENT)) {
            throw new IllegalArgumentException("etudes.client.role_invalide");
        }
        return snap;
    }

    private static UUID parseUuid(String raw) {
        try {
            return UUID.fromString(raw);
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("etudes.client.id_invalide");
        }
    }

    private static ClientSnapshot toSnapshot(Partner partner) {
        return new ClientSnapshot(partner.getId(), partner.getCode(), partner.getRaisonSociale());
    }

    private static UUID tenantId() {
        return TenantContext.getTenantId();
    }
}
