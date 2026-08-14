package ma.nafura.platform.framework.search;

import java.util.List;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class ApprovalRequestSearchableEntity implements SearchableEntity {

    private final JdbcTemplate jdbcTemplate;

    public ApprovalRequestSearchableEntity(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public String entityType() {
        return "approval";
    }

    @Override
    public List<GlobalSearchResult> search(String query, UUID tenantId, int limit) {
        String pattern = "%" + query.toLowerCase() + "%";
        return jdbcTemplate.query(
                """
                SELECT ar.id::text AS id,
                       COALESCE(ar.title, '') AS title,
                       ar.entity_type AS entity_type,
                       ar.status AS status,
                       CASE
                           WHEN LOWER(COALESCE(ar.title, '')) = LOWER(?) THEN 1.00
                           WHEN LOWER(COALESCE(ar.title, '')) LIKE LOWER(?) THEN 0.88
                           WHEN LOWER(COALESCE(ar.entity_type, '')) LIKE LOWER(?) THEN 0.75
                           ELSE 0.65
                       END AS score
                FROM approval_requests ar
                WHERE ar.tenant_id = ?
                  AND (
                      LOWER(COALESCE(ar.title, '')) LIKE ?
                      OR LOWER(COALESCE(ar.entity_type, '')) LIKE ?
                      OR LOWER(COALESCE(ar.status, '')) LIKE ?
                  )
                ORDER BY score DESC, ar.requested_at DESC NULLS LAST, ar.created_at DESC
                LIMIT ?
                """,
                rs -> {
                    java.util.ArrayList<GlobalSearchResult> results = new java.util.ArrayList<>();
                    while (rs.next()) {
                        String id = rs.getString("id");
                        String title = rs.getString("title");
                        String entityType = rs.getString("entity_type");
                        String status = rs.getString("status");
                        String subtitle = ((entityType != null ? entityType : "request") + " - " + (status != null ? status : "PENDING"));
                        results.add(new GlobalSearchResult(
                                id,
                                entityType(),
                                (title != null && !title.isBlank()) ? title : "Approval request",
                                subtitle,
                                "/approvals",
                                "clipboard-check",
                                rs.getDouble("score")
                        ));
                    }
                    return results;
                },
                query,
                pattern,
                pattern,
                tenantId,
                pattern,
                pattern,
                pattern,
                Math.max(1, limit)
        );
    }
}
