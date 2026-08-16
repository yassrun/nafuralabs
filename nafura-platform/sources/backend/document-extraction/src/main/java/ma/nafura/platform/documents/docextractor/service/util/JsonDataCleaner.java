package ma.nafura.platform.documents.docextractor.service.util;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Iterator;
import java.util.Map;

/**
 * Utility class to clean extracted JSON data.
 * Converts string "null" values to actual null values.
 */
public class JsonDataCleaner {
    private static final Logger log = LoggerFactory.getLogger(JsonDataCleaner.class);
    private static final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Clean JSON string by converting "null" strings to null values.
     * This fixes cases where LLM returns the string "null" instead of null.
     * 
     * @param jsonString The JSON string to clean
     * @return Cleaned JSON string with null strings converted to null
     */
    public static String cleanJsonString(String jsonString) {
        if (jsonString == null || jsonString.trim().isEmpty()) {
            return jsonString;
        }

        try {
            JsonNode root = objectMapper.readTree(jsonString);
            JsonNode cleaned = cleanJsonNode(root);
            return objectMapper.writeValueAsString(cleaned);
        } catch (Exception e) {
            log.warn("Failed to clean JSON string, returning original: {}", e.getMessage());
            return jsonString;
        }
    }

    /**
     * Clean a JsonNode recursively, converting "null" strings to null.
     */
    private static JsonNode cleanJsonNode(JsonNode node) {
        if (node == null || node.isNull()) {
            return node;
        }

        if (node.isTextual()) {
            String text = node.asText();
            // Convert string "null" to actual null
            if ("null".equalsIgnoreCase(text.trim())) {
                return objectMapper.getNodeFactory().nullNode();
            }
            return node;
        }

        if (node.isObject()) {
            Iterator<Map.Entry<String, JsonNode>> fields = node.fields();
            while (fields.hasNext()) {
                Map.Entry<String, JsonNode> field = fields.next();
                JsonNode cleanedValue = cleanJsonNode(field.getValue());
                // Replace the field value with cleaned version
                ((com.fasterxml.jackson.databind.node.ObjectNode) node).set(field.getKey(), cleanedValue);
            }
            return node;
        }

        if (node.isArray()) {
            for (int i = 0; i < node.size(); i++) {
                JsonNode cleanedElement = cleanJsonNode(node.get(i));
                // Replace the array element with cleaned version
                ((com.fasterxml.jackson.databind.node.ArrayNode) node).set(i, cleanedElement);
            }
            return node;
        }

        return node;
    }
}

