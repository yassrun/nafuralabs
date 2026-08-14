package ma.nafura.rh.service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

/**
 * Lecture du code chantier sans dépendance Gradle vers {@code :sektor:chantiers}
 * (cycle : chantiers → rh).
 */
@Component
public class ChantierCodeReader {

    private final JdbcTemplate jdbcTemplate;

    public ChantierCodeReader(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public String resolveCode(UUID tenantId, String chantierId) {
        if (tenantId == null || !StringUtils.hasText(chantierId)) {
            return chantierId;
        }
        List<String> codes = jdbcTemplate.query(
                """
                SELECT code FROM chantiers
                WHERE tenant_id = ? AND id = ?
                LIMIT 1
                """,
                (rs, rowNum) -> rs.getString(1),
                tenantId,
                chantierId.trim());
        return codes.stream().filter(StringUtils::hasText).findFirst().orElse(chantierId.trim());
    }

    public Optional<String> findCode(UUID tenantId, String chantierId) {
        String code = resolveCode(tenantId, chantierId);
        if (!StringUtils.hasText(chantierId) || code.equals(chantierId.trim())) {
            return Optional.empty();
        }
        return Optional.of(code);
    }
}
