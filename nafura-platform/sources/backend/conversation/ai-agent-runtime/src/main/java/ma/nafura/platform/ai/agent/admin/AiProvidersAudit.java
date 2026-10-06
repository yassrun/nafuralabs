package ma.nafura.platform.ai.agent.admin;

import lombok.RequiredArgsConstructor;
import ma.nafura.platform.collaboration.audit.AuditService;
import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * Manual audit trail for AI provider administration (provider changes, BYOK credential rotation /
 * revocation, limits). The secret is never written to the audit payload — only the last-4 hint.
 */
@Component
@RequiredArgsConstructor
public class AiProvidersAudit {

    static final String ENTITY_TYPE = "ai-provider";

    private final AuditService auditService;

    public void providerChanged(String provider, String fromModel, String toModel) {
        auditService.log(
            ENTITY_TYPE,
            provider,
            "ai_provider_change",
            "Provider IA changé : " + provider,
            Map.of("provider", provider, "modelFrom", value(fromModel), "modelTo", value(toModel)));
    }

    public void credentialRotated(String provider, String keyHint) {
        auditService.log(
            ENTITY_TYPE,
            provider,
            "ai_credential_rotate",
            "Identifiant IA remplacé : " + provider,
            Map.of("provider", provider, "keyHint", value(keyHint)));
    }

    public void credentialRevoked(String provider) {
        auditService.log(
            ENTITY_TYPE,
            provider,
            "ai_credential_revoke",
            "Identifiant IA révoqué : " + provider,
            Map.of("provider", provider));
    }

    public void limitsChanged(Map<String, Object> changes) {
        auditService.log(
            ENTITY_TYPE,
            "limits",
            "ai_budget_change",
            "Limites IA modifiées",
            changes);
    }

    private static String value(String v) {
        return v == null ? "" : v;
    }
}
