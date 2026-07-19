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
     * REPLI ARBITRAIRE — NON VALIDÉ MÉTIER.
     *
     * Ce 8 % provient du socle généré (il était codé en dur dans {@code PrixDpu} et
     * {@code ConsultationNoeud}), pas d'un arbitrage de l'expert métier. Il n'a aucune
     * autorité. Les frais généraux varient par entreprise, et vraisemblablement par
     * affaire.
     *
     * Ce repli n'existe que pour qu'un tenant non configuré ne produise pas de division
     * par null. Tout tenant réel doit poser sa valeur via {@link #KEY_FG}.
     */
    public static final BigDecimal DEFAULT_FRAIS_GENERAUX_PERCENT = new BigDecimal("8");

    /**
     * REPLI ARBITRAIRE — NON VALIDÉ MÉTIER.
     *
     * Même origine que ci-dessus. Indice que ces valeurs ne veulent rien dire : le socle
     * portait 7 % dans {@code etudes} et 0 % dans {@code consultation} pour la même notion.
     * La marge est une décision commerciale par affaire, pas une constante.
     */
    public static final BigDecimal DEFAULT_MARGE_PERCENT = new BigDecimal("7");

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
