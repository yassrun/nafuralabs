package ma.nafura.platform.ai.agent.service.tool;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import ma.nafura.platform.ai.agent.service.AgentExecutionContext;
import ma.nafura.platform.authorization.apikey.ApiKeyService;
import ma.nafura.platform.authorization.apikey.ApiKeyService.GeneratedApiKey;
import ma.nafura.platform.collaboration.workflow.ApprovalService;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Component;

@Component
public class ActionAgentTool implements AgentTool {

    private final ObjectProvider<ApiKeyService> apiKeyServiceProvider;
    private final ObjectProvider<ApprovalService> approvalServiceProvider;
    private final AgentPermissionChecker permissionChecker;

    public ActionAgentTool(
            ObjectProvider<ApiKeyService> apiKeyServiceProvider,
            ObjectProvider<ApprovalService> approvalServiceProvider,
            AgentPermissionChecker permissionChecker
    ) {
        this.apiKeyServiceProvider = apiKeyServiceProvider;
        this.approvalServiceProvider = approvalServiceProvider;
        this.permissionChecker = permissionChecker;
    }

    @Override
    public String key() {
        return "action";
    }

    @Override
    public AgentToolResult execute(AgentToolRequest request, AgentExecutionContext context) {
        Map<String, Object> args = request.getArguments() != null ? request.getArguments() : Map.of();
        String operation = normalize(asString(args.get("operation")));
        String entityType = normalize(asString(args.get("entityType")));
        Object rawData = args.get("data");
        Map<String, Object> data = rawData instanceof Map<?, ?> map ? castMap(map) : Map.of();
        String entityIdRaw = asString(args.get("entityId"));

        if (operation == null || entityType == null) {
            return AgentToolResult.builder()
                    .success(false)
                    .message("operation and entityType are required")
                    .payload(Map.of())
                    .build();
        }

        return switch (entityType) {
            case "api-key", "api-keys", "apikey", "apikeys" -> handleApiKeyAction(operation, context, data, entityIdRaw);
            case "approval", "approvals" -> handleApprovalAction(operation, context, data, entityIdRaw);
            default -> AgentToolResult.builder()
                    .success(false)
                    .message("Unsupported action target: " + entityType)
                    .payload(Map.of(
                            "operation", operation,
                            "entityType", entityType
                    ))
                    .build();
        };
    }

    private AgentToolResult handleApiKeyAction(
            String operation,
            AgentExecutionContext context,
            Map<String, Object> data,
            String entityIdRaw
    ) {
        ApiKeyService apiKeyService = apiKeyServiceProvider.getIfAvailable();
        if (apiKeyService == null) {
            return unavailable("API key service is not available");
        }
        UUID tenantId = parseTenantId(context);
        if (tenantId == null) {
            return unavailable("Tenant context is required");
        }

        return withTenant(tenantId, () -> {
            if ("create".equals(operation)) {
                permissionChecker.checkWrite(context, "administration", "api-keys");
                String name = asString(data.get("name"));
                if (name == null) {
                    return unavailable("name is required to create api-key");
                }
                List<String> permissions = data.get("permissions") instanceof List<?> list
                        ? list.stream().map(String::valueOf).toList()
                        : List.of();
                OffsetDateTime expiresAt = parseOffsetDateTime(asString(data.get("expiresAt")));
                GeneratedApiKey generated = apiKeyService.createApiKey(name, permissions, expiresAt);
                return AgentToolResult.builder()
                        .success(true)
                        .message("API key created")
                        .payload(Map.of(
                                "operation", operation,
                                "entityType", "api-key",
                                "id", generated.apiKey().getId().toString(),
                                "name", generated.apiKey().getName(),
                                "keyPrefix", generated.apiKey().getKeyPrefix(),
                                "plainKey", generated.plainKey(),
                                "status", "EXECUTED"
                        ))
                        .build();
            }

            if ("delete".equals(operation) || "revoke".equals(operation)) {
                permissionChecker.checkDelete(context, "administration", "api-keys");
                UUID keyId = parseUuid(entityIdRaw != null ? entityIdRaw : asString(data.get("id")));
                if (keyId == null) {
                    return unavailable("api-key id is required");
                }
                apiKeyService.revoke(tenantId, keyId);
                return AgentToolResult.builder()
                        .success(true)
                        .message("API key revoked")
                        .payload(Map.of(
                                "operation", operation,
                                "entityType", "api-key",
                                "id", keyId.toString(),
                                "status", "EXECUTED"
                        ))
                        .build();
            }

            return unavailable("Unsupported API key operation: " + operation);
        });
    }

    private AgentToolResult handleApprovalAction(
            String operation,
            AgentExecutionContext context,
            Map<String, Object> data,
            String entityIdRaw
    ) {
        ApprovalService approvalService = approvalServiceProvider.getIfAvailable();
        if (approvalService == null) {
            return unavailable("Approval service is not available");
        }
        permissionChecker.checkWrite(context, "workflow", "approvals");

        UUID approvalRequestId = parseUuid(
                entityIdRaw != null ? entityIdRaw : asString(data.get("approvalRequestId"))
        );
        if (approvalRequestId == null) {
            return unavailable("approvalRequestId is required");
        }
        String comment = asString(data.get("comment"));

        if ("approve".equals(operation)) {
            approvalService.approve(approvalRequestId, comment);
            return AgentToolResult.builder()
                    .success(true)
                    .message("Approval request approved")
                    .payload(Map.of(
                            "operation", "approve",
                            "entityType", "approval",
                            "id", approvalRequestId.toString(),
                            "status", "EXECUTED"
                    ))
                    .build();
        }
        if ("reject".equals(operation)) {
            approvalService.reject(approvalRequestId, comment);
            return AgentToolResult.builder()
                    .success(true)
                    .message("Approval request rejected")
                    .payload(Map.of(
                            "operation", "reject",
                            "entityType", "approval",
                            "id", approvalRequestId.toString(),
                            "status", "EXECUTED"
                    ))
                    .build();
        }
        return unavailable("Unsupported approval operation: " + operation);
    }

    private AgentToolResult unavailable(String message) {
        return AgentToolResult.builder()
                .success(false)
                .message(message)
                .payload(Map.of())
                .build();
    }

    private AgentToolResult withTenant(UUID tenantId, java.util.concurrent.Callable<AgentToolResult> work) {
        UUID previous = TenantContext.getTenantIdOrNull();
        try {
            TenantContext.setTenantId(tenantId);
            return work.call();
        } catch (Exception ex) {
            return unavailable(ex.getMessage() != null ? ex.getMessage() : "Action failed");
        } finally {
            if (previous != null) {
                TenantContext.setTenantId(previous);
            } else {
                TenantContext.clear();
            }
        }
    }

    private UUID parseTenantId(AgentExecutionContext context) {
        if (context == null || context.getTenantId() == null || context.getTenantId().isBlank()) {
            return TenantContext.getTenantIdOrNull();
        }
        return parseUuid(context.getTenantId());
    }

    private UUID parseUuid(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        try {
            return UUID.fromString(raw.trim());
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }

    private OffsetDateTime parseOffsetDateTime(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        try {
            return OffsetDateTime.parse(raw.trim());
        } catch (Exception ex) {
            return null;
        }
    }

    private String asString(Object value) {
        if (value == null) {
            return null;
        }
        String s = value.toString().trim();
        return s.isEmpty() ? null : s;
    }

    private String normalize(String value) {
        if (value == null) {
            return null;
        }
        return value.toLowerCase(Locale.ROOT).replace('_', '-').trim();
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> castMap(Map<?, ?> input) {
        return (Map<String, Object>) input;
    }
}
