package ma.nafura.platform.ai.agent.service.tool;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import ma.nafura.platform.ai.agent.service.AgentExecutionContext;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class ListAgentTool implements AgentTool {

    private final JdbcTemplate jdbcTemplate;
    private final AgentPermissionChecker permissionChecker;

    public ListAgentTool(JdbcTemplate jdbcTemplate, AgentPermissionChecker permissionChecker) {
        this.jdbcTemplate = jdbcTemplate;
        this.permissionChecker = permissionChecker;
    }

    @Override
    public String key() {
        return "list";
    }

    @Override
    public AgentToolResult execute(AgentToolRequest request, AgentExecutionContext context) {
        Map<String, Object> args = request.getArguments() != null ? request.getArguments() : Map.of();
        String entityType = normalizeEntityType(asString(args.get("entityType")));
        int limit = parseLimit(args.get("limit"), 10);
        Map<String, Object> filters = extractFilters(args.get("filters"));
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
            case "member", "members", "user", "users" -> listMembers(context, tenantId, filters, limit);
            case "approval", "approvals" -> listApprovals(context, tenantId, filters, limit);
            case "api-key", "api-keys", "apikey", "apikeys" -> listApiKeys(context, tenantId, filters, limit);
            default -> AgentToolResult.builder()
                    .success(false)
                    .message("Unsupported entityType: " + entityType)
                    .payload(Map.of())
                    .build();
        };
    }

    private AgentToolResult listMembers(
            AgentExecutionContext context,
            UUID tenantId,
            Map<String, Object> filters,
            int limit
    ) {
        permissionChecker.checkRead(context, "administration", "members");
        String search = asString(filters.get("search"));
        String pattern = "%" + (search != null ? search.toLowerCase(Locale.ROOT) : "") + "%";

        List<Map<String, Object>> items = jdbcTemplate.query(
                """
                SELECT u.id::text AS id, u.email, COALESCE(u.name, '') AS name, tm.status
                FROM app_user u
                JOIN tenant_membership tm ON tm.user_id = u.id
                WHERE tm.tenant_id = ?
                  AND (? = '' OR LOWER(u.email) LIKE ? OR LOWER(COALESCE(u.name, '')) LIKE ?)
                ORDER BY tm.created_at DESC NULLS LAST
                LIMIT ?
                """,
                rs -> {
                    List<Map<String, Object>> rows = new ArrayList<>();
                    while (rs.next()) {
                        rows.add(Map.of(
                                "id", rs.getString("id"),
                                "email", rs.getString("email"),
                                "name", rs.getString("name"),
                                "status", rs.getString("status")
                        ));
                    }
                    return rows;
                },
                tenantId,
                search != null ? search : "",
                pattern,
                pattern,
                limit
        );

        long total = jdbcTemplate.queryForObject(
                """
                SELECT COUNT(*)::bigint
                FROM app_user u
                JOIN tenant_membership tm ON tm.user_id = u.id
                WHERE tm.tenant_id = ?
                  AND (? = '' OR LOWER(u.email) LIKE ? OR LOWER(COALESCE(u.name, '')) LIKE ?)
                """,
                Long.class,
                tenantId,
                search != null ? search : "",
                pattern,
                pattern
        );

        return AgentToolResult.builder()
                .success(true)
                .message("Found " + items.size() + " member(s)")
                .payload(Map.of(
                        "entityType", "member",
                        "filters", filters,
                        "items", items,
                        "total", total,
                        "route", "/administration/members"
                ))
                .build();
    }

    private AgentToolResult listApprovals(
            AgentExecutionContext context,
            UUID tenantId,
            Map<String, Object> filters,
            int limit
    ) {
        permissionChecker.checkRead(context, "workflow", "approvals");
        String status = asString(filters.get("status"));
        String search = asString(filters.get("search"));
        String searchPattern = "%" + (search != null ? search.toLowerCase(Locale.ROOT) : "") + "%";

        List<Map<String, Object>> items = jdbcTemplate.query(
                """
                SELECT ar.id::text AS id, ar.title, ar.status, ar.entity_type, ar.requested_by, ar.requested_at
                FROM approval_requests ar
                WHERE ar.tenant_id = ?
                  AND (? IS NULL OR UPPER(ar.status) = UPPER(?))
                  AND (? = '' OR LOWER(COALESCE(ar.title, '')) LIKE ? OR LOWER(COALESCE(ar.entity_type, '')) LIKE ?)
                ORDER BY ar.requested_at DESC
                LIMIT ?
                """,
                rs -> {
                    List<Map<String, Object>> rows = new ArrayList<>();
                    while (rs.next()) {
                        rows.add(Map.of(
                                "id", rs.getString("id"),
                                "title", rs.getString("title"),
                                "status", rs.getString("status"),
                                "entityType", rs.getString("entity_type"),
                                "requestedBy", rs.getString("requested_by"),
                                "requestedAt", String.valueOf(rs.getObject("requested_at"))
                        ));
                    }
                    return rows;
                },
                tenantId,
                status,
                status,
                search != null ? search : "",
                searchPattern,
                searchPattern,
                limit
        );

        long total = jdbcTemplate.queryForObject(
                """
                SELECT COUNT(*)::bigint
                FROM approval_requests ar
                WHERE ar.tenant_id = ?
                  AND (? IS NULL OR UPPER(ar.status) = UPPER(?))
                  AND (? = '' OR LOWER(COALESCE(ar.title, '')) LIKE ? OR LOWER(COALESCE(ar.entity_type, '')) LIKE ?)
                """,
                Long.class,
                tenantId,
                status,
                status,
                search != null ? search : "",
                searchPattern,
                searchPattern
        );

        return AgentToolResult.builder()
                .success(true)
                .message("Found " + items.size() + " approval request(s)")
                .payload(Map.of(
                        "entityType", "approval",
                        "filters", filters,
                        "items", items,
                        "total", total,
                        "route", "/approvals"
                ))
                .build();
    }

    private AgentToolResult listApiKeys(
            AgentExecutionContext context,
            UUID tenantId,
            Map<String, Object> filters,
            int limit
    ) {
        permissionChecker.checkRead(context, "administration", "api-keys");
        String search = asString(filters.get("search"));
        String pattern = "%" + (search != null ? search.toLowerCase(Locale.ROOT) : "") + "%";

        List<Map<String, Object>> items = jdbcTemplate.query(
                """
                SELECT ak.id::text AS id, ak.name, ak.key_prefix, ak.expires_at, ak.last_used_at, ak.is_active
                FROM api_keys ak
                WHERE ak.tenant_id = ?
                  AND (? = '' OR LOWER(COALESCE(ak.name, '')) LIKE ? OR LOWER(COALESCE(ak.key_prefix, '')) LIKE ?)
                ORDER BY ak.created_at DESC
                LIMIT ?
                """,
                rs -> {
                    List<Map<String, Object>> rows = new ArrayList<>();
                    while (rs.next()) {
                        rows.add(Map.of(
                                "id", rs.getString("id"),
                                "name", rs.getString("name"),
                                "keyPrefix", rs.getString("key_prefix"),
                                "expiresAt", String.valueOf(rs.getObject("expires_at")),
                                "lastUsedAt", String.valueOf(rs.getObject("last_used_at")),
                                "active", rs.getBoolean("is_active")
                        ));
                    }
                    return rows;
                },
                tenantId,
                search != null ? search : "",
                pattern,
                pattern,
                limit
        );

        long total = jdbcTemplate.queryForObject(
                """
                SELECT COUNT(*)::bigint
                FROM api_keys ak
                WHERE ak.tenant_id = ?
                  AND (? = '' OR LOWER(COALESCE(ak.name, '')) LIKE ? OR LOWER(COALESCE(ak.key_prefix, '')) LIKE ?)
                """,
                Long.class,
                tenantId,
                search != null ? search : "",
                pattern,
                pattern
        );

        return AgentToolResult.builder()
                .success(true)
                .message("Found " + items.size() + " API key(s)")
                .payload(Map.of(
                        "entityType", "api-key",
                        "filters", filters,
                        "items", items,
                        "total", total,
                        "route", "/administration/api-keys"
                ))
                .build();
    }

    private Map<String, Object> extractFilters(Object raw) {
        if (raw instanceof Map<?, ?> map) {
            @SuppressWarnings("unchecked")
            Map<String, Object> typed = (Map<String, Object>) map;
            return typed;
        }
        return Map.of();
    }

    private String asString(Object value) {
        if (value == null) {
            return null;
        }
        String s = value.toString().trim();
        return s.isEmpty() ? null : s;
    }

    private int parseLimit(Object value, int fallback) {
        if (value instanceof Number number) {
            return Math.max(1, Math.min(50, number.intValue()));
        }
        if (value != null) {
            try {
                return Math.max(1, Math.min(50, Integer.parseInt(value.toString())));
            } catch (NumberFormatException ignored) {
                return fallback;
            }
        }
        return fallback;
    }

    private UUID parseTenantId(AgentExecutionContext context) {
        if (context == null || context.getTenantId() == null || context.getTenantId().isBlank()) {
            return null;
        }
        try {
            return UUID.fromString(context.getTenantId());
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }

    private String normalizeEntityType(String raw) {
        if (raw == null) {
            return null;
        }
        return raw.toLowerCase(Locale.ROOT).replace('_', '-').trim();
    }
}
