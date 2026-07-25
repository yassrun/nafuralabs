package ma.nafura.partner.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.InputStream;
import java.util.UUID;
import ma.nafura.partner.domain.model.Partner;
import ma.nafura.partner.domain.model.PartnerRole;
import ma.nafura.partner.domain.model.PartnerRoleType;
import ma.nafura.partner.repository.PartnerRepository;
import ma.nafura.partner.repository.PartnerRoleRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PartnerSeedService {

    private final PartnerRepository repository;
    private final PartnerRoleRepository roleRepository;
    private final ObjectMapper objectMapper;

    public PartnerSeedService(
            PartnerRepository repository,
            PartnerRoleRepository roleRepository,
            ObjectMapper objectMapper) {
        this.repository = repository;
        this.roleRepository = roleRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public void seedIfEmpty() {
        UUID tenantId = TenantContext.getTenantId();
        if (repository.countByTenantId(tenantId) > 0) {
            return;
        }
        try (InputStream in = new ClassPathResource("seed/partners-seed.json").getInputStream()) {
            JsonNode root = objectMapper.readTree(in);
            for (JsonNode node : root.get("partners")) {
                Partner partner = repository.save(Partner.builder()
                        .tenantId(tenantId)
                        .code(node.get("code").asText())
                        .raisonSociale(node.get("raisonSociale").asText())
                        .ice(textOrNull(node, "ice"))
                        .registreCommerce(textOrNull(node, "registreCommerce"))
                        .patente(textOrNull(node, "patente"))
                        .build());
                for (JsonNode role : node.path("roles")) {
                    roleRepository.save(PartnerRole.builder()
                            .tenantId(tenantId)
                            .partnerId(partner.getId())
                            .role(PartnerRoleType.valueOf(role.asText()))
                            .build());
                }
            }
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to seed partners", ex);
        }
    }

    private static String textOrNull(JsonNode node, String field) {
        return node.hasNonNull(field) ? node.get(field).asText() : null;
    }
}
