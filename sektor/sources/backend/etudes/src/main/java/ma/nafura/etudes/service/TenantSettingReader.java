package ma.nafura.etudes.service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

/**
 * Lecture des paramètres tenant ({@code tenant_setting}) pour le chiffrage / validation.
 * Accès JDBC volontaire — évite une dépendance module vers app-settings.
 */
@Component
public class TenantSettingReader {

    private final JdbcTemplate jdbcTemplate;

    public TenantSettingReader(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public Optional<String> findValue(UUID tenantId, String settingKey) {
        if (tenantId == null || !StringUtils.hasText(settingKey)) {
            return Optional.empty();
        }
        List<String> values = jdbcTemplate.query(
                """
                SELECT value FROM tenant_setting
                WHERE tenant_id = ? AND setting_key = ?
                LIMIT 1
                """,
                (rs, rowNum) -> rs.getString(1),
                tenantId,
                settingKey.trim());
        return values.stream().filter(StringUtils::hasText).findFirst();
    }

    public void upsert(UUID tenantId, String settingKey, String value) {
        if (tenantId == null || !StringUtils.hasText(settingKey)) {
            throw new IllegalArgumentException("etudes.parametre.cle_requise");
        }
        jdbcTemplate.update(
                """
                INSERT INTO tenant_setting (id, tenant_id, setting_key, value)
                VALUES (?, ?, ?, ?)
                ON CONFLICT (tenant_id, setting_key) DO UPDATE SET value = EXCLUDED.value
                """,
                UUID.randomUUID(),
                tenantId,
                settingKey.trim(),
                value);
    }
}
