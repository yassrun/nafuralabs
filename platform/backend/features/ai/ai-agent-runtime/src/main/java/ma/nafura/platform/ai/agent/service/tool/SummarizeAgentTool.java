package ma.nafura.platform.ai.agent.service.tool;

import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import ma.nafura.platform.ai.agent.service.AgentExecutionContext;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class SummarizeAgentTool implements AgentTool {

    private final JdbcTemplate jdbcTemplate;
    private final AgentPermissionChecker permissionChecker;

    public SummarizeAgentTool(JdbcTemplate jdbcTemplate, AgentPermissionChecker permissionChecker) {
        this.jdbcTemplate = jdbcTemplate;
        this.permissionChecker = permissionChecker;
    }

    @Override
    public String key() {
        return "summarize";
    }

    @Override
    public AgentToolResult execute(AgentToolRequest request, AgentExecutionContext context) {
        Map<String, Object> args = request.getArguments() != null ? request.getArguments() : Map.of();
        String entityType = normalizeEntityType(asString(args.get("entityType")));
        String entityIdRaw = asString(args.get("entityId"));
        UUID tenantId = parseTenantId(context);

        if (tenantId == null) {
            return AgentToolResult.builder()
                    .success(false)
                    .message("Tenant context is required")
                    .payload(Map.of())
                    .build();
        }
        if (entityType == null) {
            return AgentToolResult.builder()
                    .success(false)
                    .message("entityType is required")
                    .payload(Map.of())
                    .build();
        }

        return switch (entityType) {
            case "member", "members", "user", "users" -> summarizeMember(context, tenantId, entityIdRaw);
            case "approval", "approvals" -> summarizeApproval(context, tenantId, entityIdRaw);
            case "api-key", "api-keys", "apikey", "apikeys" -> summarizeApiKeys(context, tenantId, entityIdRaw);
            default -> AgentToolResult.builder()
                    .success(false)
                    .message("Unsupported entityType: " + entityType)
                    .payload(Map.of())
                    .build();
        };
    }

    private AgentToolResult summarizeMember(AgentExecutionContext context, UUID tenantId, String entityIdRaw) {
        permissionChecker.checkRead(context, "administration", "members");
        if (entityIdRaw != null) {
            UUID entityId = parseUuid(entityIdRaw);
            if (entityId == null) {
                return failNotFound("Invalid member id");
            }
            Map<String, Object> item = jdbcTemplate.query(
                    """
                    SELECT u.id::text AS id, u.email, COALESCE(u.name, '') AS name, tm.status
                    FROM app_user u
                    JOIN tenant_membership tm ON tm.user_id = u.id
                    WHERE tm.tenant_id = ? AND u.id = ?
                    LIMIT 1
                    """,
                    rs -> rs.next() ? Map.of(
                            "id", rs.getString("id"),
                            "email", rs.getString("email"),
                            "name", rs.getString("name"),
                            "status", rs.getString("status")
                    ) : null,
                    tenantId,
                    entityId
            );
            if (item == null) {
                return failNotFound("Member not found");
            }
            String summary = "Member " + item.get("email") + " is currently " + item.get("status") + ".";
            return successSummary("member", entityIdRaw, summary, item);
        }

        Long total = jdbcTemplate.queryForObject(
                "SELECT COUNT(*)::bigint FROM tenant_membership WHERE tenant_id = ?",
                Long.class,
                tenantId
        );
        Long active = jdbcTemplate.queryForObject(
                "SELECT COUNT(*)::bigint FROM tenant_membership WHERE tenant_id = ? AND UPPER(status) = 'ACTIVE'",
                Long.class,
                tenantId
        );
        String summary = "Tenant has " + safe(total) + " member(s), " + safe(active) + " active.";
        return aggregateSummary("member", summary, safe(total), Map.of("active", safe(active)));
    }

    private AgentToolResult summarizeApproval(AgentExecutionContext context, UUID tenantId, String entityIdRaw) {
        permissionChecker.checkRead(context, "workflow", "approvals");
        if (entityIdRaw != null) {
            UUID entityId = parseUuid(entityIdRaw);
            if (entityId == null) {
                return failNotFound("Invalid approval id");
            }
            Map<String, Object> item = jdbcTemplate.query(
                    """
                    SELECT id::text AS id, title, status, entity_type, requested_by, requested_at
                    FROM approval_requests
                    WHERE tenant_id = ? AND id = ?
                    LIMIT 1
                    """,
                    rs -> rs.next() ? Map.of(
                            "id", rs.getString("id"),
                            "title", rs.getString("title"),
                            "status", rs.getString("status"),
                            "entityType", rs.getString("entity_type"),
                            "requestedBy", rs.getString("requested_by"),
                            "requestedAt", String.valueOf(rs.getObject("requested_at"))
                    ) : null,
                    tenantId,
                    entityId
            );
            if (item == null) {
                return failNotFound("Approval request not found");
            }
            String summary = "Approval \"" + item.get("title") + "\" is currently " + item.get("status") + ".";
            return successSummary("approval", entityIdRaw, summary, item);
        }

        Long total = jdbcTemplate.queryForObject(
                "SELECT COUNT(*)::bigint FROM approval_requests WHERE tenant_id = ?",
                Long.class,
                tenantId
        );
        Long pending = jdbcTemplate.queryForObject(
                "SELECT COUNT(*)::bigint FROM approval_requests WHERE tenant_id = ? AND UPPER(status) = 'PENDING'",
                Long.class,
                tenantId
        );
        String summary = "Tenant has " + safe(total) + " approval request(s), " + safe(pending) + " pending.";
        return aggregateSummary("approval", summary, safe(total), Map.of("pending", safe(pending)));
    }

    private AgentToolResult summarizeApiKeys(AgentExecutionContext context, UUID tenantId, String entityIdRaw) {
        permissionChecker.checkRead(context, "administration", "api-keys");
        if (entityIdRaw != null) {
            UUID entityId = parseUuid(entityIdRaw);
            if (entityId == null) {
                return failNotFound("Invalid API key id");
            }
            Map<String, Object> item = jdbcTemplate.query(
                    """
                    SELECT id::text AS id, name, key_prefix, is_active, created_at, last_used_at, expires_at
                    FROM api_keys
                    WHERE tenant_id = ? AND id = ?
                    LIMIT 1
                    """,
                    rs -> rs.next() ? Map.of(
                            "id", rs.getString("id"),
                            "name", rs.getString("name"),
                            "keyPrefix", rs.getString("key_prefix"),
                            "active", rs.getBoolean("is_active"),
                            "createdAt", String.valueOf(rs.getObject("created_at")),
                            "lastUsedAt", String.valueOf(rs.getObject("last_used_at")),
                            "expiresAt", String.valueOf(rs.getObject("expires_at"))
                    ) : null,
                    tenantId,
                    entityId
            );
            if (item == null) {
                return failNotFound("API key not found");
            }
            String summary = "API key \"" + item.get("name") + "\" is " +
                    ((Boolean.TRUE.equals(item.get("active"))) ? "active" : "revoked") + ".";
            return successSummary("api-key", entityIdRaw, summary, item);
        }

        Long total = jdbcTemplate.queryForObject(
                "SELECT COUNT(*)::bigint FROM api_keys WHERE tenant_id = ?",
                Long.class,
                tenantId
        );
        Long active = jdbcTemplate.queryForObject(
                "SELECT COUNT(*)::bigint FROM api_keys WHERE tenant_id = ? AND is_active = true",
                Long.class,
                tenantId
        );
        String summary = "Tenant has " + safe(total) + " API key(s), " + safe(active) + " active.";
        return aggregateSummary("api-key", summary, safe(total), Map.of("active", safe(active)));
    }

    private AgentToolResult successSummary(
            String entityType,
            String entityId,
            String summary,
            Map<String, Object> fields
    ) {
        return AgentToolResult.builder()
                .success(true)
                .message("Entity summary generated")
                .payload(Map.of(
                        "entityType", entityType,
                        "entityId", entityId,
                        "summary", summary,
                        "fields", fields
                ))
                .build();
    }

    private AgentToolResult aggregateSummary(
            String entityType,
            String summary,
            long count,
            Map<String, Object> details
    ) {
        return AgentToolResult.builder()
                .success(true)
                .message("Aggregate summary generated")
                .payload(Map.of(
                        "entityType", entityType,
                        "summary", summary,
                        "count", count,
                        "details", details
                ))
                .build();
    }

    private AgentToolResult failNotFound(String message) {
        return AgentToolResult.builder()
                .success(false)
                .message(message)
                .payload(Map.of())
                .build();
    }

    private UUID parseTenantId(AgentExecutionContext context) {
        if (context == null || context.getTenantId() == null || context.getTenantId().isBlank()) {
            return null;
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

    private long safe(Long value) {
        return value != null ? value : 0L;
    }

    private String asString(Object value) {
        if (value == null) {
            return null;
        }
        String s = value.toString().trim();
        return s.isEmpty() ? null : s;
    }

    private String normalizeEntityType(String raw) {
        if (raw == null) {
            return null;
        }
        return raw.toLowerCase(Locale.ROOT).replace('_', '-').trim();
    }
}
