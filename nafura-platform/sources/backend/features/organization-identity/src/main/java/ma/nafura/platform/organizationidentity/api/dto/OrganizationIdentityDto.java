package ma.nafura.platform.organizationidentity.api.dto;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Legal identity of the tenant organization. Keys match print {@code tenant.*} variables
 * (except {@code logo}, which stays on branding assets).
 */
public record OrganizationIdentityDto(
        String raisonSociale,
        String formeJuridique,
        String capital,
        String ice,
        String identifiantFiscal,
        String rc,
        String patente,
        String cnss,
        String tvaIntra,
        String adresse,
        String ville,
        String telephone,
        String email,
        String siteWeb,
        String banque,
        String rib
) {
    public static OrganizationIdentityDto empty() {
        return new OrganizationIdentityDto(
                "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "");
    }

    public static OrganizationIdentityDto fromMap(Map<String, String> values) {
        return new OrganizationIdentityDto(
                val(values, "raisonSociale"),
                val(values, "formeJuridique"),
                val(values, "capital"),
                val(values, "ice"),
                val(values, "identifiantFiscal"),
                val(values, "rc"),
                val(values, "patente"),
                val(values, "cnss"),
                val(values, "tvaIntra"),
                val(values, "adresse"),
                val(values, "ville"),
                val(values, "telephone"),
                val(values, "email"),
                val(values, "siteWeb"),
                val(values, "banque"),
                val(values, "rib"));
    }

    public Map<String, String> toMap() {
        Map<String, String> map = new LinkedHashMap<>();
        map.put("raisonSociale", nullToEmpty(raisonSociale));
        map.put("formeJuridique", nullToEmpty(formeJuridique));
        map.put("capital", nullToEmpty(capital));
        map.put("ice", nullToEmpty(ice));
        map.put("identifiantFiscal", nullToEmpty(identifiantFiscal));
        map.put("rc", nullToEmpty(rc));
        map.put("patente", nullToEmpty(patente));
        map.put("cnss", nullToEmpty(cnss));
        map.put("tvaIntra", nullToEmpty(tvaIntra));
        map.put("adresse", nullToEmpty(adresse));
        map.put("ville", nullToEmpty(ville));
        map.put("telephone", nullToEmpty(telephone));
        map.put("email", nullToEmpty(email));
        map.put("siteWeb", nullToEmpty(siteWeb));
        map.put("banque", nullToEmpty(banque));
        map.put("rib", nullToEmpty(rib));
        return map;
    }

    public boolean isEmpty() {
        return nullToEmpty(raisonSociale).isBlank();
    }

    private static String val(Map<String, String> values, String key) {
        return nullToEmpty(values.get(key));
    }

    private static String nullToEmpty(String value) {
        return value == null ? "" : value;
    }
}
