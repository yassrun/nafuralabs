package ma.nafura.platform.framework.search;

import java.util.List;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class AppUserSearchableEntity implements SearchableEntity {

    private final JdbcTemplate jdbcTemplate;

    public AppUserSearchableEntity(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public String entityType() {
        return "member";
    }

    @Override
    public List<GlobalSearchResult> search(String query, UUID tenantId, int limit) {
        String pattern = "%" + query.toLowerCase() + "%";
        return jdbcTemplate.query(
                """
                SELECT u.id::text AS id,
                       COALESCE(u.name, '') AS name,
                       u.email AS email,
                       CASE
                           WHEN LOWER(u.email) = LOWER(?) THEN 1.00
                           WHEN LOWER(split_part(u.email, '@', 1)) = LOWER(?) THEN 0.95
                           WHEN LOWER(COALESCE(u.name, '')) LIKE LOWER(?) THEN 0.85
                           ELSE 0.70
                       END AS score
                FROM app_user u
                JOIN tenant_membership tm ON tm.user_id = u.id
                WHERE tm.tenant_id = ?
                  AND (
                      LOWER(u.email) LIKE ?
                      OR LOWER(split_part(u.email, '@', 1)) LIKE ?
                      OR LOWER(COALESCE(u.name, '')) LIKE ?
                  )
                ORDER BY score DESC, u.updated_at DESC NULLS LAST, u.created_at DESC
                LIMIT ?
                """,
                rs -> {
                    java.util.ArrayList<GlobalSearchResult> results = new java.util.ArrayList<>();
                    while (rs.next()) {
                        String id = rs.getString("id");
                        String email = rs.getString("email");
                        String name = rs.getString("name");
                        String title = (name != null && !name.isBlank()) ? name : email;
                        results.add(new GlobalSearchResult(
                                id,
                                entityType(),
                                title,
                                email,
                                "/administration/members",
                                "users",
                                rs.getDouble("score")
                        ));
                    }
                    return results;
                },
                query,
                query,
                pattern,
                tenantId,
                pattern,
                pattern,
                pattern,
                Math.max(1, limit)
        );
    }
}
