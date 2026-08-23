package ma.nafura.etudes.service;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.etudes.domain.consultation.ConsultationParametres;
import ma.nafura.etudes.repository.ConsultationParametresRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Source unique des défauts FG / marge / TVA pour le chiffrage (lot 1 T1.9).
 * Repli sur constantes marocaines ; lecture tenant via clés {@code etudes.*} quand disponibles.
 */
@Service
public class ParametresEtudeService {

    /**
     * Frais généraux — repli, milieu de la fourchette métier.
     *
     * L'expert métier : « pour les frais généraux je rajoute <b>normalement 10%</b> »
     * (2026-07-19), dans une fourchette de 10 à 13 %. Le 8 % qui figurait ici venait du socle
     * généré et n'avait aucune autorité.
     *
     * Ce n'est qu'un <b>repli</b>, pour qu'un tenant non configuré parte d'un ordre de grandeur
     * crédible. Il est surchargeable à trois niveaux : paramètre tenant ({@link #KEY_FG}),
     * défaut du dossier d'étude, puis saisie par article — c'est cette dernière qui fait foi.
     */
    public static final BigDecimal DEFAULT_FRAIS_GENERAUX_PERCENT = new BigDecimal("10");

    public static final BigDecimal FRAIS_GENERAUX_MIN = new BigDecimal("10");
    public static final BigDecimal FRAIS_GENERAUX_MAX = new BigDecimal("13");

    /**
     * Marge bénéficiaire — repli, milieu de la fourchette métier.
     *
     * L'expert métier indique <b>15 à 20 %</b>. La formule retenue pour l'étude est additive :
     * {@code prixVente = déboursé × (1 + FG% + marge%)} — voir
     * {@link DpuCalculator#computePrixVenteHt}.
     *
     * Fourchette large et assumée : la marge est une décision commerciale par article.
     * Comme les FG, ce repli est surchargeable à trois niveaux.
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
    /** Sous ce montant HT, un seul niveau d'approbation. Défaut 500 000 MAD. */
    public static final String KEY_SEUIL_DEUX_NIVEAUX = "etudes.seuilDeuxNiveauxApprobation";
    public static final BigDecimal DEFAULT_SEUIL_DEUX_NIVEAUX = new BigDecimal("500000");

    /** L9 — mode création article depuis rattrapage : LIBRE (défaut PME) | CONTROLEE. */
    public static final String KEY_CREATION_ARTICLE_MODE = "etudes.creationArticleMode";
    public static final String MODE_CREATION_LIBRE = "LIBRE";
    public static final String MODE_CREATION_CONTROLEE = "CONTROLEE";

    public static final String KEY_CONSULTATION_MODE = "etudes.consultation.mode";
    public static final String KEY_CONSULTATION_MINIMUM = "etudes.consultation.minimum";
    public static final String CONSULTATION_OPTIONNELLE = "OPTIONNELLE";
    public static final String CONSULTATION_OBLIGATOIRE = "OBLIGATOIRE";
    public static final int DEFAULT_CONSULTATION_MINIMUM = 1;

    private final TenantSettingReader tenantSettingReader;
    private final ConsultationParametresRepository consultationParametres;

    public ParametresEtudeService(
            TenantSettingReader tenantSettingReader,
            ConsultationParametresRepository consultationParametres) {
        this.tenantSettingReader = tenantSettingReader;
        this.consultationParametres = consultationParametres;
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
                .orElse(ma.nafura.catalogue.api.CatalogBasePrix.MARCHE);
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

    /**
     * Seuil HT au-dessus duquel deux niveaux d'approbation sont exigés.
     * En dessous → un seul niveau (Directeur travaux).
     */
    public BigDecimal seuilDeuxNiveauxApprobation() {
        return decimalOr(KEY_SEUIL_DEUX_NIVEAUX, DEFAULT_SEUIL_DEUX_NIVEAUX);
    }

    /**
     * Mode de création d'article depuis le rattrapage (L9).
     * Défaut {@link #MODE_CREATION_LIBRE} (PME).
     */
    public String creationArticleMode() {
        return tenantSettingReader
                .findValue(tenantIdOrNull(), KEY_CREATION_ARTICLE_MODE)
                .map(String::trim)
                .map(String::toUpperCase)
                .filter(v -> MODE_CREATION_LIBRE.equals(v) || MODE_CREATION_CONTROLEE.equals(v))
                .orElse(MODE_CREATION_LIBRE);
    }

    public boolean creationArticleControlee() {
        return MODE_CREATION_CONTROLEE.equals(creationArticleMode());
    }

    public String consultationMode() {
        return consultationRow()
                .map(ConsultationParametres::getMode)
                .map(String::trim)
                .map(String::toUpperCase)
                .filter(v -> CONSULTATION_OPTIONNELLE.equals(v) || CONSULTATION_OBLIGATOIRE.equals(v))
                .orElse(CONSULTATION_OPTIONNELLE);
    }

    public boolean consultationObligatoire() {
        return CONSULTATION_OBLIGATOIRE.equals(consultationMode());
    }

    public int consultationMinimum() {
        return consultationRow()
                .map(ConsultationParametres::getMinimum)
                .filter(v -> v >= 1)
                .orElse(DEFAULT_CONSULTATION_MINIMUM);
    }

    @Transactional
    public void setConsultation(String mode, int minimum) {
        UUID tenant = tenantIdOrNull();
        if (tenant == null) {
            throw new IllegalStateException("etudes.parametre.tenant_requis");
        }
        String normalized = mode != null ? mode.trim().toUpperCase() : CONSULTATION_OPTIONNELLE;
        if (!CONSULTATION_OPTIONNELLE.equals(normalized) && !CONSULTATION_OBLIGATOIRE.equals(normalized)) {
            throw new IllegalArgumentException("etudes.consultation.mode_invalide");
        }
        if (minimum < 1) {
            throw new IllegalArgumentException("etudes.consultation.minimum_invalide");
        }
        ConsultationParametres row = consultationParametres
                .findById(tenant)
                .orElseGet(() -> ConsultationParametres.builder().tenantId(tenant).build());
        row.setMode(normalized);
        row.setMinimum(minimum);
        consultationParametres.save(row);
    }

    private Optional<ConsultationParametres> consultationRow() {
        UUID tenant = tenantIdOrNull();
        if (tenant == null) {
            return Optional.empty();
        }
        return consultationParametres.findById(tenant);
    }

    /** Nombre de niveaux à figer à la soumission selon le montant HT. */
    public int niveauxApprobationPour(BigDecimal montantHt) {
        BigDecimal seuil = seuilDeuxNiveauxApprobation();
        BigDecimal montant = montantHt != null ? montantHt : BigDecimal.ZERO;
        return montant.compareTo(seuil) >= 0 ? 2 : 1;
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
