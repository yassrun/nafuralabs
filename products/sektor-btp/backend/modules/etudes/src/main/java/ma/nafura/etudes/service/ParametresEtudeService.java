package ma.nafura.etudes.service;

import java.math.BigDecimal;
import java.util.UUID;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.stereotype.Service;

/**
 * Source unique des défauts FG / marge / TVA pour le chiffrage (lot 1 T1.9).
 * Repli sur constantes marocaines ; lecture tenant via clés {@code etudes.*} quand disponibles.
 */
@Service
public class ParametresEtudeService {

    /** Repli FG % — unique endroit autorisé pour cette valeur métier. */
    public static final BigDecimal DEFAULT_FRAIS_GENERAUX_PERCENT = new BigDecimal("8");

    /** Repli marge % (valeur etudes ; consultation avait 0 — tranché côté etudes). */
    public static final BigDecimal DEFAULT_MARGE_PERCENT = new BigDecimal("7");

    public static final BigDecimal DEFAULT_TVA_TAUX = new BigDecimal("20");

    public static final String KEY_FG = "etudes.fraisGenerauxPercentDefaut";
    public static final String KEY_MARGE = "etudes.margePercentDefaut";
    public static final String KEY_TVA = "etudes.tvaTauxDefaut";
    public static final String KEY_BASE_PRIX = "etudes.basePrixChiffrage";

    private final TenantSettingReader tenantSettingReader;

    public ParametresEtudeService(TenantSettingReader tenantSettingReader) {
        this.tenantSettingReader = tenantSettingReader;
    }

    public BigDecimal fraisGenerauxPercentDefaut() {
        return decimalOr(KEY_FG, DEFAULT_FRAIS_GENERAUX_PERCENT);
    }

    public BigDecimal margePercentDefaut() {
        return decimalOr(KEY_MARGE, DEFAULT_MARGE_PERCENT);
    }

    public BigDecimal tvaTauxDefaut() {
        return decimalOr(KEY_TVA, DEFAULT_TVA_TAUX);
    }

    public String basePrixChiffrage() {
        return tenantSettingReader
                .findValue(tenantIdOrNull(), KEY_BASE_PRIX)
                .orElse(ma.nafura.item.domain.BasePrixChiffrage.MARCHE);
    }

    private BigDecimal decimalOr(String key, BigDecimal fallback) {
        return tenantSettingReader
                .findValue(tenantIdOrNull(), key)
                .map(BigDecimal::new)
                .orElse(fallback);
    }

    private UUID tenantIdOrNull() {
        try {
            return TenantContext.getTenantId();
        } catch (RuntimeException ex) {
            return null;
        }
    }
}
