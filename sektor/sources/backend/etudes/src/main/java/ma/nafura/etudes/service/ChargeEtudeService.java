package ma.nafura.etudes.service;

import java.util.List;
import java.util.UUID;
import ma.nafura.etudes.api.dto.ChargeEtudeCandidatDto;
import ma.nafura.platform.authorization.domain.model.TenantUserRole;
import ma.nafura.platform.authorization.repository.TenantUserRoleRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

/**
 * Résolution des candidats « chargé d'étude » = membres tenant avec rôle {@code BTP_INGENIEUR}.
 */
@Service
public class ChargeEtudeService {

    public static final String ROLE_INGENIEUR = "BTP_INGENIEUR";

    private final TenantUserRoleRepository tenantUserRoleRepository;
    private final JdbcTemplate jdbc;

    public ChargeEtudeService(
            TenantUserRoleRepository tenantUserRoleRepository, JdbcTemplate jdbc) {
        this.tenantUserRoleRepository = tenantUserRoleRepository;
        this.jdbc = jdbc;
    }

    public List<ChargeEtudeCandidatDto> listIngenieurs() {
        UUID tenantId = tenantId();
        return jdbc.query(
                """
                SELECT u.id::text AS user_id,
                       u.email,
                       COALESCE(NULLIF(TRIM(u.name), ''), u.email) AS display_name
                  FROM tenant_user_role tur
                  JOIN app_user u ON u.id = tur.user_id
                 WHERE tur.tenant_id = ?
                   AND tur.role_code = ?
                 ORDER BY display_name ASC, u.email ASC
                """,
                (rs, rowNum) ->
                        new ChargeEtudeCandidatDto(
                                rs.getString("user_id"),
                                rs.getString("email"),
                                rs.getString("display_name")),
                tenantId,
                ROLE_INGENIEUR);
    }

    /**
     * Valide que l'user a le rôle ingénieur sur le tenant courant ; renvoie un libellé d'affichage.
     */
    public String requireIngenieur(String userId, String nomPropose) {
        if (!StringUtils.hasText(userId)) {
            throw new IllegalArgumentException("etudes.charge_etude.requis");
        }
        UUID uid;
        try {
            uid = UUID.fromString(userId.trim());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("etudes.charge_etude.invalide");
        }
        UUID tenantId = tenantId();
        boolean ok = tenantUserRoleRepository.findByTenantIdAndUserId(tenantId, uid).stream()
                .map(TenantUserRole::getRoleCode)
                .anyMatch(code -> ROLE_INGENIEUR.equalsIgnoreCase(code));
        if (!ok) {
            throw new IllegalArgumentException("etudes.charge_etude.role_requis");
        }
        if (StringUtils.hasText(nomPropose)) {
            return nomPropose.trim();
        }
        return jdbc.query(
                        """
                        SELECT COALESCE(NULLIF(TRIM(name), ''), email) AS display_name
                          FROM app_user WHERE id = ?
                        """,
                        (rs, rowNum) -> rs.getString("display_name"),
                        uid)
                .stream()
                .findFirst()
                .filter(StringUtils::hasText)
                .orElse(userId.trim());
    }

    private UUID tenantId() {
        UUID id = TenantContext.getTenantId();
        if (id == null) {
            throw new IllegalStateException("etudes.tenant_manquant");
        }
        return id;
    }
}
