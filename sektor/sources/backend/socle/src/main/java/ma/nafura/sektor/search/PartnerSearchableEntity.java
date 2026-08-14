package ma.nafura.sektor.search;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import ma.nafura.platform.framework.context.UserContext;
import ma.nafura.platform.framework.search.GlobalSearchResult;
import ma.nafura.platform.framework.search.SearchableEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class PartnerSearchableEntity implements SearchableEntity {

    private final JdbcTemplate jdbcTemplate;

    public PartnerSearchableEntity(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public String entityType() {
        return "partner";
    }

    @Override
    public List<GlobalSearchResult> search(String query, UUID tenantId, int limit) {
        if (!hasReadPermission()) {
            return List.of();
        }
        String pattern = "%" + query.toLowerCase() + "%";
        return jdbcTemplate.query(
                """
                SELECT p.id::text AS id,
                       p.code AS code,
                       p.raison_sociale AS title,
                       COALESCE(p.email, p.code) AS subtitle,
                       CASE
                           WHEN LOWER(p.code) = LOWER(?) THEN 1.00
                           WHEN LOWER(p.raison_sociale) LIKE LOWER(?) THEN 0.90
                           ELSE 0.75
                       END AS score
                FROM partners p
                WHERE p.tenant_id = ?
                  AND (
                      LOWER(p.code) LIKE ?
                      OR LOWER(p.raison_sociale) LIKE ?
                      OR LOWER(COALESCE(p.email, '')) LIKE ?
                  )
                ORDER BY score DESC, p.updated_at DESC NULLS LAST
                LIMIT ?
                """,
                rs -> {
                    ArrayList<GlobalSearchResult> results = new ArrayList<>();
                    while (rs.next()) {
                        String id = rs.getString("id");
                        results.add(new GlobalSearchResult(
                                id,
                                entityType(),
                                rs.getString("title"),
                                rs.getString("subtitle"),
                                "/directory/partners/" + id,
                                "users",
                                rs.getDouble("score")
                        ));
                    }
                    return results;
                },
                query,
                pattern,
                tenantId,
                pattern,
                pattern,
                pattern,
                Math.max(1, limit)
        );
    }

    private boolean hasReadPermission() {
        return UserContext.isSuperAdmin() || UserContext.hasPermission("partner.partner.read");
    }
}
