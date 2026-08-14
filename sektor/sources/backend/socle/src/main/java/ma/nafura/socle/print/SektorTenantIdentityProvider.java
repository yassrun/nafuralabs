package ma.nafura.socle.print;

import ma.nafura.platform.appsettings.domain.model.TenantSetting;
import ma.nafura.platform.appsettings.repository.TenantSettingRepository;
import ma.nafura.platform.collaboration.docmanager.api.response.TemplateVariableDescriptor;
import ma.nafura.platform.collaboration.docmanager.template.TenantIdentityProvider;
import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static ma.nafura.platform.collaboration.docmanager.template.TemplateVariableCatalogService.desc;

/**
 * Moroccan legal identity of the issuing company, as printed on every document.
 *
 * <p>Values live in {@code tenant_setting} under the {@code company.*} namespace, written by
 * Administration → Identité société. Onboarding historically wrote three of them under
 * {@code onboarding.societe.*}; those are still read as a fallback so tenants provisioned before
 * this screen existed keep a usable letterhead.
 *
 * <p>Naming note: {@code identifiantFiscal}, not {@code if} — {@code ${tenant.if}} would collide
 * with the expression language.
 */
@Component
public class SektorTenantIdentityProvider implements TenantIdentityProvider {

    /** Canonical keys written by the document settings screen. */
    public static final String KEY_RAISON_SOCIALE = "company.raisonSociale";
    public static final String KEY_FORME_JURIDIQUE = "company.formeJuridique";
    public static final String KEY_CAPITAL = "company.capital";
    public static final String KEY_ICE = "company.ice";
    public static final String KEY_IDENTIFIANT_FISCAL = "company.identifiantFiscal";
    public static final String KEY_RC = "company.rc";
    public static final String KEY_PATENTE = "company.patente";
    public static final String KEY_CNSS = "company.cnss";
    public static final String KEY_TVA_INTRA = "company.tvaIntra";
    public static final String KEY_ADRESSE = "company.adresse";
    public static final String KEY_VILLE = "company.ville";
    public static final String KEY_TELEPHONE = "company.telephone";
    public static final String KEY_EMAIL = "company.email";
    public static final String KEY_SITE_WEB = "company.siteWeb";
    public static final String KEY_BANQUE = "company.banque";
    public static final String KEY_RIB = "company.rib";

    /** Legacy keys written by the onboarding preset. */
    private static final String LEGACY_NOM = "onboarding.societe.nom";
    private static final String LEGACY_ICE = "onboarding.societe.ice";
    private static final String LEGACY_FORME = "onboarding.societe.forme";

    private final TenantSettingRepository settingRepository;

    public SektorTenantIdentityProvider(TenantSettingRepository settingRepository) {
        this.settingRepository = settingRepository;
    }

    /** Ahead of the platform default, which only knows the tenant name and logo. */
    @Override
    public int order() {
        return 10;
    }

    @Override
    public Map<String, Object> identity(UUID tenantId) {
        Map<String, Object> identity = new LinkedHashMap<>();
        if (tenantId == null) {
            return identity;
        }
        Map<String, String> settings = loadSettings(tenantId);

        putIfPresent(identity, "raisonSociale", firstNonBlank(
                settings.get(KEY_RAISON_SOCIALE), settings.get(LEGACY_NOM)));
        putIfPresent(identity, "formeJuridique", firstNonBlank(
                settings.get(KEY_FORME_JURIDIQUE), settings.get(LEGACY_FORME)));
        putIfPresent(identity, "capital", settings.get(KEY_CAPITAL));
        putIfPresent(identity, "ice", firstNonBlank(settings.get(KEY_ICE), settings.get(LEGACY_ICE)));
        putIfPresent(identity, "identifiantFiscal", settings.get(KEY_IDENTIFIANT_FISCAL));
        putIfPresent(identity, "rc", settings.get(KEY_RC));
        putIfPresent(identity, "patente", settings.get(KEY_PATENTE));
        putIfPresent(identity, "cnss", settings.get(KEY_CNSS));
        putIfPresent(identity, "tvaIntra", settings.get(KEY_TVA_INTRA));
        putIfPresent(identity, "adresse", settings.get(KEY_ADRESSE));
        putIfPresent(identity, "ville", settings.get(KEY_VILLE));
        putIfPresent(identity, "telephone", settings.get(KEY_TELEPHONE));
        putIfPresent(identity, "email", settings.get(KEY_EMAIL));
        putIfPresent(identity, "siteWeb", settings.get(KEY_SITE_WEB));
        putIfPresent(identity, "banque", settings.get(KEY_BANQUE));
        putIfPresent(identity, "rib", settings.get(KEY_RIB));

        return identity;
    }

    @Override
    public List<TemplateVariableDescriptor> describe() {
        return List.of(
                desc("tenant.raisonSociale", "Raison sociale", "string", "Nafura BTP SARL"),
                desc("tenant.formeJuridique", "Forme juridique", "string", "SARL"),
                desc("tenant.capital", "Capital social", "string", "1 000 000 MAD"),
                desc("tenant.ice", "ICE", "string", "001234567000089"),
                desc("tenant.identifiantFiscal", "Identifiant fiscal (IF)", "string", "12345678"),
                desc("tenant.rc", "Registre de commerce (RC)", "string", "123456"),
                desc("tenant.patente", "Patente", "string", "12345678"),
                desc("tenant.cnss", "CNSS", "string", "1234567"),
                desc("tenant.tvaIntra", "N° TVA", "string", null),
                desc("tenant.adresse", "Adresse", "string", "12 rue Zerktouni"),
                desc("tenant.ville", "Ville", "string", "Casablanca"),
                desc("tenant.telephone", "Téléphone", "string", "+212 5 22 00 00 00"),
                desc("tenant.email", "E-mail", "string", "contact@exemple.ma"),
                desc("tenant.siteWeb", "Site web", "string", null),
                desc("tenant.banque", "Banque", "string", null),
                desc("tenant.rib", "RIB", "string", null),
                desc("tenant.logo", "Logo", "image", null));
    }

    private Map<String, String> loadSettings(UUID tenantId) {
        Map<String, String> byKey = new LinkedHashMap<>();
        for (TenantSetting setting : settingRepository.findByTenantId(tenantId)) {
            byKey.put(setting.getSettingKey(), setting.getValue());
        }
        return byKey;
    }

    private static void putIfPresent(Map<String, Object> target, String key, String value) {
        if (value != null && !value.isBlank()) {
            target.put(key, value);
        }
    }

    private static String firstNonBlank(String primary, String fallback) {
        return (primary != null && !primary.isBlank()) ? primary : fallback;
    }
}
