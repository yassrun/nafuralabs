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

    /**
     * Frais généraux — repli, milieu de la fourchette métier.
     *
     * L'expert métier indique <b>10 à 13 %</b> (2026-07-19). Le 8 % qui figurait ici venait
     * du socle généré et n'avait aucune autorité ; il sous-estimait la réalité.
     *
     * C'est une <b>fourchette</b>, pas un taux : la valeur exacte se pose par affaire, voire
     * par article. Ce repli n'existe que pour qu'un tenant non configuré parte d'un ordre de
     * grandeur crédible. Tout tenant réel pose sa valeur via {@link #KEY_FG}.
     */
    public static final BigDecimal DEFAULT_FRAIS_GENERAUX_PERCENT = new BigDecimal("11.5");

    public static final BigDecimal FRAIS_GENERAUX_MIN = new BigDecimal("10");
    public static final BigDecimal FRAIS_GENERAUX_MAX = new BigDecimal("13");

    /**
     * Marge bénéficiaire — repli, milieu de la fourchette métier.
     *
     * L'expert métier indique <b>15 à 20 %</b>, « rajoutée indépendamment pour constituer le
     * prix de vente » — soit appliquée au coût de revient (déboursé + FG), ce que fait déjà
     * {@link DpuCalculator#computePrixVenteHt}. Le 7 % précédent venait du socle généré.
     *
     * Fourchette large et assumée : la marge est une décision commerciale par article.
     */
    public static final BigDecimal DEFAULT_MARGE_PERCENT = new BigDecimal("17.5");

    public static final BigDecimal MARGE_MIN = new BigDecimal("15");
    public static final BigDecimal MARGE_MAX = new BigDecimal("20");

    /** Taux de TVA de droit commun au Maroc — celui-ci est une donnée réglementaire. */
    public static final BigDecimal DEFAULT_TVA_TAUX = new BigDecimal("20");

    public static final String KEY_FG = "etudes.fraisGenerauxPercentDefaut";
    public static final String KEY_MARGE = "etudes.margePercentDefaut";
    public static final String KEY_TVA = "etudes.tvaTauxDefaut";
    public static final String KEY_BASE_PRIX = "etudes.basePrixChiffrage";
    public static final String KEY_AUTEUR_PEUT_VALIDER = "etudes.auteurPeutValider";

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

    /**
     * L'auteur d'une étude peut-il la valider lui-même ?
     *
     * <p>Faux par défaut, volontairement. {@code ConsultationService.validate()} n'avait
     * aucun contrôle : même permission que le rédacteur, et aucune vérification du statut de
     * départ. Une petite structure peut lever la règle via ce paramètre, mais elle doit le
     * faire explicitement.
     */
    public boolean auteurPeutValider() {
        return tenantSettingReader
                .findValue(tenantIdOrNull(), KEY_AUTEUR_PEUT_VALIDER)
                .map(Boolean::parseBoolean)
                .orElse(false);
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
