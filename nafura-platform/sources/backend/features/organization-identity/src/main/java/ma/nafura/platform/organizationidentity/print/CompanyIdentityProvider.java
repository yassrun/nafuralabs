package ma.nafura.platform.organizationidentity.print;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.stereotype.Component;

import ma.nafura.platform.appsettings.domain.model.TenantSetting;
import ma.nafura.platform.appsettings.repository.TenantSettingRepository;
import ma.nafura.platform.collaboration.docmanager.api.response.TemplateVariableDescriptor;
import ma.nafura.platform.collaboration.docmanager.template.TenantIdentityProvider;
import ma.nafura.platform.organizationidentity.CompanyIdentityKeys;

import static ma.nafura.platform.collaboration.docmanager.template.TemplateVariableCatalogService.desc;

/**
 * Platform legal identity for printed documents ({@code tenant.*} variables).
 *
 * <p>Values live in {@code tenant_setting} under {@code company.*}. Legacy
 * {@code onboarding.societe.*} keys are still read as fallback.
 */
@Component
public class CompanyIdentityProvider implements TenantIdentityProvider {

    private final TenantSettingRepository settingRepository;

    public CompanyIdentityProvider(TenantSettingRepository settingRepository) {
        this.settingRepository = settingRepository;
    }

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
                settings.get(CompanyIdentityKeys.RAISON_SOCIALE),
                settings.get(CompanyIdentityKeys.LEGACY_NOM)));
        putIfPresent(identity, "formeJuridique", firstNonBlank(
                settings.get(CompanyIdentityKeys.FORME_JURIDIQUE),
                settings.get(CompanyIdentityKeys.LEGACY_FORME)));
        putIfPresent(identity, "capital", settings.get(CompanyIdentityKeys.CAPITAL));
        putIfPresent(identity, "ice", firstNonBlank(
                settings.get(CompanyIdentityKeys.ICE),
                settings.get(CompanyIdentityKeys.LEGACY_ICE)));
        putIfPresent(identity, "identifiantFiscal", settings.get(CompanyIdentityKeys.IDENTIFIANT_FISCAL));
        putIfPresent(identity, "rc", settings.get(CompanyIdentityKeys.RC));
        putIfPresent(identity, "patente", settings.get(CompanyIdentityKeys.PATENTE));
        putIfPresent(identity, "cnss", settings.get(CompanyIdentityKeys.CNSS));
        putIfPresent(identity, "tvaIntra", settings.get(CompanyIdentityKeys.TVA_INTRA));
        putIfPresent(identity, "adresse", settings.get(CompanyIdentityKeys.ADRESSE));
        putIfPresent(identity, "ville", settings.get(CompanyIdentityKeys.VILLE));
        putIfPresent(identity, "telephone", settings.get(CompanyIdentityKeys.TELEPHONE));
        putIfPresent(identity, "email", settings.get(CompanyIdentityKeys.EMAIL));
        putIfPresent(identity, "siteWeb", settings.get(CompanyIdentityKeys.SITE_WEB));
        putIfPresent(identity, "banque", settings.get(CompanyIdentityKeys.BANQUE));
        putIfPresent(identity, "rib", settings.get(CompanyIdentityKeys.RIB));

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
