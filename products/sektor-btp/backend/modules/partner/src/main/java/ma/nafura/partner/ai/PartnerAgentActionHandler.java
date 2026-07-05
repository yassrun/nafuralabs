package ma.nafura.partner.ai;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import ma.nafura.partner.api.request.PartnerCreateDto;
import ma.nafura.partner.domain.model.Partner;
import ma.nafura.partner.domain.model.PartnerRoleType;
import ma.nafura.partner.service.PartnerService;
import ma.nafura.platform.ai.agent.service.AgentExecutionContext;
import ma.nafura.platform.ai.agent.service.tool.AgentEntityActionHandler;
import ma.nafura.platform.ai.agent.service.tool.AgentToolRequest;
import ma.nafura.platform.ai.agent.service.tool.AgentToolResult;
import ma.nafura.platform.framework.context.UserContext;
import org.springframework.stereotype.Component;

@Component
public class PartnerAgentActionHandler implements AgentEntityActionHandler {

    private static final Set<String> PARTNER_ENTITY_TYPES = Set.of(
            "partner", "partners", "fournisseur", "supplier", "client"
    );

    private final PartnerService partnerService;

    public PartnerAgentActionHandler(PartnerService partnerService) {
        this.partnerService = partnerService;
    }

    @Override
    public boolean supports(String entityType, String operation) {
        return "create".equals(operation) && entityType != null && PARTNER_ENTITY_TYPES.contains(entityType);
    }

    @Override
    public AgentToolResult execute(
            AgentToolRequest request,
            AgentExecutionContext context,
            String operation,
            String entityType,
            Map<String, Object> data,
            String entityIdRaw
    ) {
        if (!"create".equals(operation)) {
            return failure("Unsupported partner operation: " + operation);
        }
        if (!hasWritePermission()) {
            return failure("You don't have permission to create partners");
        }

        String code = asString(data.get("code"));
        String raisonSociale = asString(data.get("raisonSociale"));
        if (code == null || raisonSociale == null) {
            return failure("code and raisonSociale are required to create a partner");
        }

        PartnerCreateDto dto = new PartnerCreateDto();
        dto.setCode(code);
        dto.setRaisonSociale(raisonSociale);
        dto.setFormeJuridique(asString(data.get("formeJuridique")));
        dto.setIce(asString(data.get("ice")));
        dto.setIdentifiantFiscal(asString(data.get("identifiantFiscal")));
        dto.setRegistreCommerce(asString(data.get("registreCommerce")));
        dto.setPatente(asString(data.get("patente")));
        dto.setCnss(asString(data.get("cnss")));
        dto.setAmo(asString(data.get("amo")));
        dto.setEmail(asString(data.get("email")));
        dto.setPhone(asString(data.get("phone")));
        dto.setWebsite(asString(data.get("website")));
        dto.setRoles(parseRoles(data.get("roles"), entityType));

        try {
            Partner partner = partnerService.create(dto);
            return AgentToolResult.builder()
                    .success(true)
                    .message("Partner created")
                    .payload(Map.of(
                            "operation", operation,
                            "entityType", "partner",
                            "id", partner.getId().toString(),
                            "code", partner.getCode(),
                            "raisonSociale", partner.getRaisonSociale(),
                            "route", "/directory/partners/" + partner.getId(),
                            "status", "EXECUTED"
                    ))
                    .build();
        } catch (Exception ex) {
            return failure(ex.getMessage() != null ? ex.getMessage() : "Partner creation failed");
        }
    }

    private boolean hasWritePermission() {
        if (UserContext.isSuperAdmin()) {
            return true;
        }
        return UserContext.hasPermission("partner.partner.write");
    }

    private List<PartnerRoleType> parseRoles(Object raw, String entityType) {
        if (raw instanceof List<?> list && !list.isEmpty()) {
            List<PartnerRoleType> roles = new ArrayList<>();
            for (Object item : list) {
                if (item == null) {
                    continue;
                }
                roles.add(PartnerRoleType.valueOf(item.toString().trim().toUpperCase(Locale.ROOT)));
            }
            if (!roles.isEmpty()) {
                return roles;
            }
        }
        if ("fournisseur".equals(entityType) || "supplier".equals(entityType)) {
            return List.of(PartnerRoleType.FOURNISSEUR);
        }
        if ("client".equals(entityType)) {
            return List.of(PartnerRoleType.CLIENT);
        }
        return List.of();
    }

    private AgentToolResult failure(String message) {
        return AgentToolResult.builder()
                .success(false)
                .message(message)
                .payload(Map.of())
                .build();
    }

    private String asString(Object value) {
        if (value == null) {
            return null;
        }
        String s = value.toString().trim();
        return s.isEmpty() ? null : s;
    }
}
