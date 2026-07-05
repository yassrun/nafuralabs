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
public class ChantierSearchableEntity implements SearchableEntity {

    private final JdbcTemplate jdbcTemplate;

    public ChantierSearchableEntity(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public String entityType() {
        return "chantier";
    }

    @Override
    public List<GlobalSearchResult> search(String query, UUID tenantId, int limit) {
        if (!hasReadPermission()) {
            return List.of();
        }
        String pattern = "%" + query.toLowerCase() + "%";
        return jdbcTemplate.query(
                """
                SELECT c.id AS id,
                       c.code AS code,
                       c.label AS title,
                       COALESCE(c.status, '') AS subtitle,
                       CASE
                           WHEN LOWER(c.code) = LOWER(?) THEN 1.00
                           WHEN LOWER(c.label) LIKE LOWER(?) THEN 0.90
                           ELSE 0.75
                       END AS score
                FROM chantiers c
                WHERE c.tenant_id = ?
                  AND (
                      LOWER(c.code) LIKE ?
                      OR LOWER(c.label) LIKE ?
                  )
                ORDER BY score DESC, c.updated_at DESC NULLS LAST
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
                                "/projects/chantiers/" + id,
                                "building-2",
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
                Math.max(1, limit)
        );
    }

    private boolean hasReadPermission() {
        return UserContext.isSuperAdmin() || UserContext.hasPermission("chantiers.chantier.read");
    }
}
