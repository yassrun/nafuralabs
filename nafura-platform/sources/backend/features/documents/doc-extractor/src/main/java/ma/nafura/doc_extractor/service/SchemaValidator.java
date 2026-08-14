package ma.nafura.platform.documents.docextractor.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.nafura.platform.documents.docextractor.api.response.DoubtNature;
import ma.nafura.platform.documents.docextractor.api.response.ExtractionValidationDto;
import ma.nafura.platform.documents.docextractor.api.response.FieldIssueDto;
import ma.nafura.platform.documents.docextractor.api.response.FieldIssueKind;
import ma.nafura.platform.documents.docextractor.api.response.ValidationState;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

/**
 * Generic JSON Schema validator for post-extraction validation.
 * Validates required fields, basic types, and date format — no product-specific rules.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SchemaValidator {

    private static final Pattern ISO_DATE = Pattern.compile("^\\d{4}-\\d{2}-\\d{2}$");
    private static final String DEFAULT_IMPORT_POLICY = "PARTIAL";

    private final ObjectMapper objectMapper;

    public ExtractionValidationDto validate(String extractedJson, String jsonSchema, String uiSchema) {
        String importPolicy = resolveImportPolicy(uiSchema);

        if (extractedJson == null || extractedJson.isBlank()) {
            return new ExtractionValidationDto(
                    ValidationState.INVALID,
                    List.of(new FieldIssueDto(
                            "",
                            null,
                            FieldIssueKind.MISSING_REQUIRED,
                            "No extracted data",
                            DoubtNature.EXTRACTION)),
                    importPolicy
            );
        }

        try {
            JsonNode data = objectMapper.readTree(extractedJson);
            JsonNode schema = objectMapper.readTree(jsonSchema);
            List<FieldIssueDto> issues = new ArrayList<>();
            validateNode(data, schema, "", null, issues);

            ValidationState state = resolveState(data, issues);
            return new ExtractionValidationDto(state, List.copyOf(issues), importPolicy);
        } catch (Exception e) {
            log.warn("Schema validation failed to parse JSON: {}", e.getMessage());
            return new ExtractionValidationDto(
                    ValidationState.INVALID,
                    List.of(new FieldIssueDto("", null, FieldIssueKind.TYPE_MISMATCH, "Invalid JSON payload")),
                    importPolicy
            );
        }
    }

    private ValidationState resolveState(JsonNode data, List<FieldIssueDto> issues) {
        if (data == null || data.isNull() || (data.isObject() && !data.fieldNames().hasNext())) {
            return ValidationState.INVALID;
        }
        if (issues.isEmpty()) {
            return ValidationState.VALID;
        }
        return ValidationState.INCOMPLETE;
    }

    private String resolveImportPolicy(String uiSchema) {
        if (uiSchema == null || uiSchema.isBlank()) {
            return DEFAULT_IMPORT_POLICY;
        }
        try {
            Map<String, Object> ui = objectMapper.readValue(uiSchema, new TypeReference<>() {});
            Object policy = ui.get("importPolicy");
            if (policy instanceof String s && !s.isBlank()) {
                return s.toUpperCase();
            }
        } catch (Exception ignored) {
            // fall through
        }
        return DEFAULT_IMPORT_POLICY;
    }

    private void validateNode(JsonNode data, JsonNode schema, String path, Integer rowIndex, List<FieldIssueDto> issues) {
        if (schema == null || schema.isNull()) {
            return;
        }

        String type = primaryType(schema);
        if ("object".equals(type)) {
            validateObject(data, schema, path, rowIndex, issues);
            return;
        }
        if ("array".equals(type)) {
            validateArray(data, schema, path, issues);
        }
    }

    private void validateObject(JsonNode data, JsonNode schema, String path, Integer rowIndex, List<FieldIssueDto> issues) {
        JsonNode required = schema.get("required");
        JsonNode properties = schema.get("properties");

        if (required != null && required.isArray()) {
            for (JsonNode reqField : required) {
                String fieldName = reqField.asText();
                String fieldPath = path.isEmpty() ? fieldName : path + "." + fieldName;
                JsonNode value = data != null && data.isObject() ? data.get(fieldName) : null;

                if (isMissing(value)) {
                    issues.add(new FieldIssueDto(
                            fieldPath,
                            rowIndex,
                            FieldIssueKind.MISSING_REQUIRED,
                            "Required field missing: " + fieldPath
                    ));
                    continue;
                }

                if (properties != null && properties.has(fieldName)) {
                    validateValue(value, properties.get(fieldName), fieldPath, rowIndex, issues);
                }
            }
        }

        if (properties != null && properties.isObject() && data != null && data.isObject()) {
            Iterator<Map.Entry<String, JsonNode>> fields = properties.fields();
            while (fields.hasNext()) {
                Map.Entry<String, JsonNode> entry = fields.next();
                String fieldName = entry.getKey();
                if (required != null && containsText(required, fieldName)) {
                    continue; // already validated above
                }
                JsonNode value = data.get(fieldName);
                if (!isMissing(value)) {
                    String fieldPath = path.isEmpty() ? fieldName : path + "." + fieldName;
                    validateValue(value, entry.getValue(), fieldPath, rowIndex, issues);
                }
            }
        }
    }

    private void validateArray(JsonNode data, JsonNode schema, String path, List<FieldIssueDto> issues) {
        if (data == null || data.isNull()) {
            return;
        }
        if (!data.isArray()) {
            issues.add(new FieldIssueDto(path, null, FieldIssueKind.TYPE_MISMATCH, "Expected array at " + path));
            return;
        }

        JsonNode itemSchema = schema.get("items");
        if (itemSchema == null) {
            return;
        }

        int index = 0;
        for (JsonNode item : data) {
            String itemPath = path + "[" + index + "]";
            validateNode(item, itemSchema, itemPath, index, issues);
            index++;
        }
    }

    private void validateValue(JsonNode value, JsonNode schema, String path, Integer rowIndex, List<FieldIssueDto> issues) {
        if (schema == null) {
            return;
        }

        String type = primaryType(schema);
        if ("object".equals(type)) {
            validateObject(value, schema, path, rowIndex, issues);
        } else if ("array".equals(type)) {
            validateArray(value, schema, path, issues);
        } else if (!matchesType(value, schema)) {
            issues.add(new FieldIssueDto(
                    path,
                    rowIndex,
                    FieldIssueKind.TYPE_MISMATCH,
                    "Invalid type at " + path
            ));
        }
    }

    private boolean matchesType(JsonNode value, JsonNode schema) {
        if (value == null || value.isNull()) {
            return true;
        }

        JsonNode typeNode = schema.get("type");
        if (typeNode == null) {
            return true;
        }

        if (typeNode.isArray()) {
            for (JsonNode t : typeNode) {
                if (matchesSingleType(value, t.asText(), schema)) {
                    return true;
                }
            }
            return false;
        }

        return matchesSingleType(value, typeNode.asText(), schema);
    }

    private boolean matchesSingleType(JsonNode value, String type, JsonNode schema) {
        if ("null".equals(type)) {
            return value.isNull();
        }
        if ("string".equals(type)) {
            if (!value.isTextual()) {
                return false;
            }
            String format = schema.has("format") ? schema.get("format").asText() : null;
            if ("date".equals(format)) {
                return ISO_DATE.matcher(value.asText()).matches();
            }
            return true;
        }
        if ("number".equals(type)) {
            return value.isNumber() || value.isDouble() || value.isFloat() || value.isInt() || value.isLong();
        }
        if ("integer".equals(type)) {
            return value.isInt() || value.isLong();
        }
        if ("boolean".equals(type)) {
            return value.isBoolean();
        }
        if ("object".equals(type)) {
            return value.isObject();
        }
        if ("array".equals(type)) {
            return value.isArray();
        }
        return true;
    }

    private boolean isMissing(JsonNode value) {
        if (value == null || value.isNull()) {
            return true;
        }
        if (value.isTextual()) {
            return value.asText().isBlank();
        }
        return false;
    }

    private String primaryType(JsonNode schema) {
        JsonNode typeNode = schema.get("type");
        if (typeNode == null) {
            return null;
        }
        if (typeNode.isArray()) {
            for (JsonNode t : typeNode) {
                if (!"null".equals(t.asText())) {
                    return t.asText();
                }
            }
            return typeNode.get(0).asText();
        }
        return typeNode.asText();
    }

    private boolean containsText(JsonNode array, String text) {
        for (JsonNode n : array) {
            if (text.equals(n.asText())) {
                return true;
            }
        }
        return false;
    }
}
