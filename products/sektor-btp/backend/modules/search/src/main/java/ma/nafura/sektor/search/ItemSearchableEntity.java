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
public class ItemSearchableEntity implements SearchableEntity {

    private final JdbcTemplate jdbcTemplate;

    public ItemSearchableEntity(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public String entityType() {
        return "article";
    }

    @Override
    public List<GlobalSearchResult> search(String query, UUID tenantId, int limit) {
        if (!hasReadPermission()) {
            return List.of();
        }
        String pattern = "%" + query.toLowerCase() + "%";
        return jdbcTemplate.query(
                """
                SELECT i.id::text AS id,
                       i.code AS code,
                       i.name AS title,
                       COALESCE(i.code, '') AS subtitle,
                       CASE
                           WHEN LOWER(i.code) = LOWER(?) THEN 1.00
                           WHEN LOWER(i.name) LIKE LOWER(?) THEN 0.90
                           ELSE 0.75
                       END AS score
                FROM items i
                WHERE i.tenant_id = ?
                  AND (
                      LOWER(COALESCE(i.code, '')) LIKE ?
                      OR LOWER(i.name) LIKE ?
                  )
                ORDER BY score DESC, i.updated_at DESC NULLS LAST
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
                                "/catalog/items/" + id,
                                "package",
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
        return UserContext.isSuperAdmin()
                || UserContext.hasPermission("item.item.read")
                || UserContext.hasPermission("inventory.stock.read");
    }
}
