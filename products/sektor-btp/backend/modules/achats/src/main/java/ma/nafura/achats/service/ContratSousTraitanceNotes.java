package ma.nafura.achats.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
public class ContratSousTraitanceNotes {

    private final ObjectMapper objectMapper;

    public ContratSousTraitanceNotes(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public String build(
            String objet,
            String sousTraitantNom,
            String ice,
            String chantierCode,
            String chantierNom,
            java.math.BigDecimal avancementPercent) {
        ObjectNode node = objectMapper.createObjectNode();
        node.put("objet", objet != null ? objet : "");
        if (StringUtils.hasText(sousTraitantNom)) {
            node.put("sousTraitantNom", sousTraitantNom.trim());
        }
        if (StringUtils.hasText(ice)) {
            node.put("ice", ice.trim());
        }
        if (StringUtils.hasText(chantierCode)) {
            node.put("chantierCode", chantierCode.trim());
        }
        if (StringUtils.hasText(chantierNom)) {
            node.put("chantierNom", chantierNom.trim());
        }
        if (avancementPercent != null) {
            node.put("avancementPercent", avancementPercent);
        }
        try {
            return objectMapper.writeValueAsString(node);
        } catch (JsonProcessingException ex) {
            return objet != null ? objet : "";
        }
    }

    public Parsed parse(String notes) {
        if (!StringUtils.hasText(notes)) {
            return new Parsed("", null, null, null, null, null);
        }
        String trimmed = notes.trim();
        if (!trimmed.startsWith("{")) {
            return new Parsed(trimmed, null, null, null, null, null);
        }
        try {
            JsonNode node = objectMapper.readTree(trimmed);
            return new Parsed(
                    text(node, "objet"),
                    text(node, "sousTraitantNom"),
                    text(node, "ice"),
                    text(node, "chantierCode"),
                    text(node, "chantierNom"),
                    decimal(node, "avancementPercent"));
        } catch (JsonProcessingException ex) {
            return new Parsed(trimmed, null, null, null, null, null);
        }
    }

    private static String text(JsonNode node, String field) {
        return node.hasNonNull(field) ? node.get(field).asText() : null;
    }

    private static java.math.BigDecimal decimal(JsonNode node, String field) {
        if (!node.hasNonNull(field)) {
            return null;
        }
        return new java.math.BigDecimal(node.get(field).asText("0"));
    }

    public record Parsed(
            String objet,
            String sousTraitantNom,
            String ice,
            String chantierCode,
            String chantierNom,
            java.math.BigDecimal avancementPercent) {}
}
