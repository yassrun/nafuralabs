package ma.nafura.platform.organizationidentity;

/**
 * Canonical {@code company.*} keys stored in {@code tenant_setting}.
 * Shared by the identity API and {@link ma.nafura.platform.organizationidentity.print.CompanyIdentityProvider}.
 */
public final class CompanyIdentityKeys {

    public static final String RAISON_SOCIALE = "company.raisonSociale";
    public static final String FORME_JURIDIQUE = "company.formeJuridique";
    public static final String CAPITAL = "company.capital";
    public static final String ICE = "company.ice";
    public static final String IDENTIFIANT_FISCAL = "company.identifiantFiscal";
    public static final String RC = "company.rc";
    public static final String PATENTE = "company.patente";
    public static final String CNSS = "company.cnss";
    public static final String TVA_INTRA = "company.tvaIntra";
    public static final String ADRESSE = "company.adresse";
    public static final String VILLE = "company.ville";
    public static final String TELEPHONE = "company.telephone";
    public static final String EMAIL = "company.email";
    public static final String SITE_WEB = "company.siteWeb";
    public static final String BANQUE = "company.banque";
    public static final String RIB = "company.rib";

    public static final String LEGACY_NOM = "onboarding.societe.nom";
    public static final String LEGACY_ICE = "onboarding.societe.ice";
    public static final String LEGACY_FORME = "onboarding.societe.forme";

    /** Field names exposed on the API / print variables (without {@code company.} / {@code tenant.}). */
    public static final String[] FIELD_NAMES = {
            "raisonSociale",
            "formeJuridique",
            "capital",
            "ice",
            "identifiantFiscal",
            "rc",
            "patente",
            "cnss",
            "tvaIntra",
            "adresse",
            "ville",
            "telephone",
            "email",
            "siteWeb",
            "banque",
            "rib"
    };

    private CompanyIdentityKeys() {}

    public static String settingKey(String fieldName) {
        return "company." + fieldName;
    }
}
