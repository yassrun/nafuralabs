package ma.nafura.platform.ai.agent.service.tool;

import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import ma.nafura.platform.ai.agent.service.AgentExecutionContext;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class DashboardAgentTool implements AgentTool {

    private final JdbcTemplate jdbcTemplate;

    public DashboardAgentTool(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public String key() {
        return "dashboard";
    }

    @Override
    public AgentToolResult execute(AgentToolRequest request, AgentExecutionContext context) {
        // No permission check: dashboard KPIs available to all (GAP 16-B)

        Map<String, Object> args = request.getArguments() != null ? request.getArguments() : Map.of();
        UUID tenantId = parseTenantId(context);
        if (tenantId == null) {
            return AgentToolResult.builder()
                    .success(false)
                    .message("Tenant context is required")
                    .payload(Map.of())
                    .build();
        }

        String metric = asString(args.get("metric"));
        if (metric == null) {
            metric = "overview";
        }
        metric = metric.toLowerCase(Locale.ROOT);

        long memberCount = count("SELECT COUNT(*)::bigint FROM tenant_membership WHERE tenant_id = ?", tenantId);
        long approvalCount = count("SELECT COUNT(*)::bigint FROM approval_requests WHERE tenant_id = ?", tenantId);
        long pendingApprovals = count(
                "SELECT COUNT(*)::bigint FROM approval_requests WHERE tenant_id = ? AND UPPER(status) = 'PENDING'",
                tenantId
        );
        long unreadNotifications = count(
                "SELECT COUNT(*)::bigint FROM notifications WHERE tenant_id = ? AND is_read = false",
                tenantId
        );
        long activeApiKeys = count(
                "SELECT COUNT(*)::bigint FROM api_keys WHERE tenant_id = ? AND is_active = true",
                tenantId
        );

        Map<String, Object> kpis = Map.of(
                "memberCount", memberCount,
                "approvalCount", approvalCount,
                "pendingApprovals", pendingApprovals,
                "unreadNotifications", unreadNotifications,
                "activeApiKeys", activeApiKeys
        );

        Object value = switch (metric) {
            case "members", "membercount" -> memberCount;
            case "approvals", "approvalcount" -> approvalCount;
            case "pending-approvals", "pendingapprovals" -> pendingApprovals;
            case "unread-notifications", "unreadnotifications" -> unreadNotifications;
            case "api-keys", "activeapikeys" -> activeApiKeys;
            default -> kpis;
        };

        return AgentToolResult.builder()
                .success(true)
                .message("Dashboard metric computed")
                .payload(Map.of(
                        "metric", metric,
                        "value", value,
                        "kpis", kpis
                ))
                .build();
    }

    private long count(String sql, UUID tenantId) {
        Long value = jdbcTemplate.queryForObject(sql, Long.class, tenantId);
        return value != null ? value : 0L;
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

    private String asString(Object value) {
        if (value == null) {
            return null;
        }
        String s = value.toString().trim();
        return s.isEmpty() ? null : s;
    }
}
