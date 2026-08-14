package ma.nafura.platform.documents.docextractor.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.nafura.platform.documents.docextractor.domain.model.DocTypeDefinition;
import ma.nafura.platform.documents.docextractor.repository.DocTypeDefinitionRepository;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Minimal safety checks for seeded DocTypeDefinitions.
 * <p>
 * This does NOT change DB schema; it only logs validation errors at startup
 * so malformed JSON schemas/prompts are caught early.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DocTypeDefinitionStartupValidator {

    private final DocTypeDefinitionRepository repository;
    private final ObjectMapper objectMapper;

    @PostConstruct
    public void validateSeededDefinitions() {
        List<DocTypeDefinition> all = repository.findAll();
        if (all.isEmpty()) {
            log.info("DocTypeDefinition validation: no definitions found.");
            return;
        }

        int checked = 0;
        int invalid = 0;

        for (DocTypeDefinition def : all) {
            if (def.getStatus() != DocTypeDefinition.Status.PUBLISHED) {
                continue;
            }
            checked++;

            List<String> errors = new ArrayList<>();
            validatePrompt(def, errors);
            validateJsonSchemas(def, errors);

            if (!errors.isEmpty()) {
                invalid++;
                log.error(
                        "Invalid DocTypeDefinition seed: domainKey={} docTypeKey={} version={} id={} errors={}",
                        def.getDomainKey(),
                        def.getDocTypeKey(),
                        def.getVersion(),
                        def.getId(),
                        errors
                );
            }
        }

        log.info("DocTypeDefinition validation: checked={} invalid={}", checked, invalid);
    }

    private void validatePrompt(DocTypeDefinition def, List<String> errors) {
        String prompt = def.getPromptTemplate();
        if (prompt == null || prompt.isBlank()) {
            errors.add("prompt_template is blank");
            return;
        }

        String p = prompt.toLowerCase(Locale.ROOT);
        if (!p.contains("return only valid json")) {
            errors.add("prompt_template missing: 'Return ONLY valid JSON'");
        }
        if (!p.contains("null")) {
            errors.add("prompt_template missing: null handling rule");
        }
        if (!p.contains("yyyy-mm-dd")) {
            errors.add("prompt_template missing: YYYY-MM-DD date format rule");
        }
        if (!(p.contains("numbers") && (p.contains("numeric") || p.contains("not strings")))) {
            errors.add("prompt_template missing: numbers must be numeric rule");
        }
    }

    private void validateJsonSchemas(DocTypeDefinition def, List<String> errors) {
        JsonNode jsonSchema = parseJson(def.getJsonSchema(), "json_schema", errors);
        if (jsonSchema != null) {
            validateRequiredAndProperties(jsonSchema, errors);
        }

        if (def.getUiSchema() != null && !def.getUiSchema().isBlank()) {
            parseJson(def.getUiSchema(), "ui_schema", errors);
        }
    }

    private JsonNode parseJson(String raw, String fieldName, List<String> errors) {
        if (raw == null || raw.isBlank()) {
            errors.add(fieldName + " is blank");
            return null;
        }
        try {
            return objectMapper.readTree(raw);
        } catch (Exception e) {
            errors.add(fieldName + " is not parseable JSON: " + e.getMessage());
            return null;
        }
    }

    private void validateRequiredAndProperties(JsonNode schema, List<String> errors) {
        JsonNode type = schema.get("type");
        if (type == null || (!type.isTextual() || !"object".equals(type.asText()))) {
            errors.add("json_schema.type must be 'object'");
        }

        JsonNode required = schema.get("required");
        if (required == null || !required.isArray()) {
            errors.add("json_schema.required must be an array");
            return;
        }

        JsonNode properties = schema.get("properties");
        if (properties == null || !properties.isObject()) {
            errors.add("json_schema.properties must be an object");
            return;
        }

        for (JsonNode req : required) {
            if (!req.isTextual()) {
                errors.add("json_schema.required contains non-string item");
                continue;
            }
            String key = req.asText();
            if (!properties.has(key)) {
                errors.add("json_schema.required field missing from properties: " + key);
            }
        }

        // Basic JSON Schema sanity: each property should be an object node
        Iterator<Map.Entry<String, JsonNode>> it = properties.fields();
        while (it.hasNext()) {
            Map.Entry<String, JsonNode> entry = it.next();
            if (!entry.getValue().isObject()) {
                errors.add("json_schema.properties." + entry.getKey() + " is not an object");
            }
        }
    }
}

