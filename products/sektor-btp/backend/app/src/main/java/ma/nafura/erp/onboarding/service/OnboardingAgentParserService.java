package ma.nafura.erp.onboarding.service;

import java.util.HashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.stereotype.Service;
import ma.nafura.erp.onboarding.api.dto.OnboardingDtos.AgentParseResponse;
import ma.nafura.erp.onboarding.api.dto.OnboardingDtos.ApplyPresetRequest;
import ma.nafura.erp.onboarding.api.dto.OnboardingDtos.SocietePresetDto;

@Service
public class OnboardingAgentParserService {

    private static final Pattern ICE_PATTERN = Pattern.compile("\\b(\\d{15})\\b");

    public AgentParseResponse parseQuestion1(String userMessage, Map<String, Object> context) {
        String ice = extractIce(userMessage);
        String nom = extractCompanyName(userMessage, ice);
        Map<String, Object> extracted = new HashMap<>();
        extracted.put("nom", nom);
        extracted.put("ice", ice);
        extracted.put("forme", guessForme(userMessage));

        ApplyPresetRequest preset = null;
        if (context != null && hasPresetContext(context)) {
            preset = buildPresetFromContext(context, nom, ice, extracted.get("forme").toString());
        }

        return new AgentParseResponse(extracted, preset);
    }

    public ApplyPresetRequest buildPresetFromAnswers(Map<String, Object> answers) {
        @SuppressWarnings("unchecked")
        Map<String, Object> societeMap = (Map<String, Object>) answers.getOrDefault("societe", Map.of());
        SocietePresetDto societe = new SocietePresetDto(
            stringVal(societeMap.get("nom"), "Ma société"),
            stringVal(societeMap.get("ice"), "000000000000000"),
            stringVal(societeMap.get("forme"), "SARL")
        );
        return new ApplyPresetRequest(
            societe,
            normalizeSecteur(stringVal(answers.get("secteur"), "BATIMENT")),
            normalizeTaille(stringVal(answers.get("taille"), "M")),
            normalizeMarches(stringVal(answers.get("marches"), "MIXTE")),
            normalizeCompta(stringVal(answers.get("compta"), "INTERNE")),
            false
        );
    }

    private static boolean hasPresetContext(Map<String, Object> context) {
        return context.containsKey("secteur");
    }

    private static ApplyPresetRequest buildPresetFromContext(
        Map<String, Object> context,
        String nom,
        String ice,
        String forme
    ) {
        return new ApplyPresetRequest(
            new SocietePresetDto(nom, ice, forme),
            normalizeSecteur(stringVal(context.get("secteur"), "BATIMENT")),
            normalizeTaille(stringVal(context.get("taille"), "M")),
            normalizeMarches(stringVal(context.get("marches"), "MIXTE")),
            normalizeCompta(stringVal(context.get("compta"), "INTERNE")),
            false
        );
    }

    private static String extractIce(String text) {
        Matcher matcher = ICE_PATTERN.matcher(text);
        if (matcher.find()) {
            return matcher.group(1);
        }
        return "000000000000000";
    }

    private static String extractCompanyName(String text, String ice) {
        String cleaned = text.replace(ice, "").trim();
        cleaned = cleaned.replaceAll("(?i)\\b(ice|sarl|sa|sarla[u]?|société|societe)\\b", "").trim();
        cleaned = cleaned.replaceAll("[-–—,:;]+", " ").trim();
        if (cleaned.isBlank()) {
            return "Ma société";
        }
        return cleaned.length() > 200 ? cleaned.substring(0, 200) : cleaned;
    }

    private static String guessForme(String text) {
        String upper = text.toUpperCase();
        if (upper.contains("SARLAU")) {
            return "SARLAU";
        }
        if (upper.contains(" SARL")) {
            return "SARL";
        }
        if (upper.contains(" SA ")) {
            return "SA";
        }
        return "SARL";
    }

    private static String stringVal(Object value, String fallback) {
        return value == null ? fallback : value.toString();
    }

    private static String normalizeSecteur(String raw) {
        return switch (raw.toUpperCase()) {
            case "TP", "TRAVAUX_PUBLICS", "TRAVAUX PUBLICS" -> "TP";
            case "VRD" -> "VRD";
            case "MIXTE", "MIXTE_BTP", "MIXTE BTP" -> "MIXTE";
            default -> "BATIMENT";
        };
    }

    private static String normalizeTaille(String raw) {
        return switch (raw.toUpperCase()) {
            case "S", "-10", "MOINS_10", "<10" -> "S";
            case "L", "50-200", "50_200" -> "L";
            case "XL", "200+", "200_PLUS" -> "XL";
            default -> "M";
        };
    }

    private static String normalizeMarches(String raw) {
        return switch (raw.toUpperCase()) {
            case "PRIVE", "PRIVÉ", "PRIVEE", "PRIVATE" -> "PRIVE";
            case "PUBLIC", "PUBLICS", "MARCHES_PUBLICS" -> "PUBLIC";
            default -> "MIXTE";
        };
    }

    private static String normalizeCompta(String raw) {
        return switch (raw.toUpperCase()) {
            case "EXTERNE", "CABINET", "EXTERNAL" -> "EXTERNE";
            case "AUCUNE", "PAS_ENCORE", "NONE" -> "AUCUNE";
            default -> "INTERNE";
        };
    }
}
