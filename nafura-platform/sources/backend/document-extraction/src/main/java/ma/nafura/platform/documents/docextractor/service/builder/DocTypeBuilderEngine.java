package ma.nafura.platform.documents.docextractor.service.builder;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import ma.nafura.platform.documents.docextractor.service.builder.BuilderState.*;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.stream.Collectors;

/**
 * DocTypeBuilderEngine - Core engine for generating JSON schemas from BuilderState.
 * 
 * This engine provides pure functions to:
 * 1. buildDataSchema(builderState) => JSON Schema
 * 2. buildUiSchema(builderState) => UI Schema
 * 3. validateBuilderState(builderState) => ValidationResult
 * 4. importFromSchemas(dataSchema, uiSchema) => BuilderState
 * 
 * The engine is deterministic and idempotent: same state produces same JSON.
 */
@Component
public class DocTypeBuilderEngine {

    private final ObjectMapper objectMapper;

    public DocTypeBuilderEngine(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    // ===== Build Data Schema =====

    /**
     * Build JSON Schema from BuilderState.
     * 
     * @param state The builder state
     * @return JSON Schema as string
     */
    public String buildDataSchemaJson(BuilderState state) {
        try {
            ObjectNode schema = buildDataSchema(state);
            return objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(schema);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to serialize JSON Schema", e);
        }
    }

    /**
     * Build JSON Schema from BuilderState as ObjectNode.
     */
    public ObjectNode buildDataSchema(BuilderState state) {
        ObjectNode root = objectMapper.createObjectNode();
        root.put("type", "object");

        // Build properties
        ObjectNode properties = objectMapper.createObjectNode();
        ArrayNode required = objectMapper.createArrayNode();

        for (BuilderField field : state.getFields()) {
            ObjectNode fieldSchema = buildFieldSchema(field);
            properties.set(field.getKey(), fieldSchema);

            if (field.isRequired()) {
                required.add(field.getKey());
            }
        }

        root.set("properties", properties);
        if (required.size() > 0) {
            root.set("required", required);
        }

        return root;
    }

    /**
     * Build schema for a single field.
     */
    private ObjectNode buildFieldSchema(BuilderField field) {
        ObjectNode schema = objectMapper.createObjectNode();

        switch (field.getType()) {
            case "string" -> {
                schema.put("type", "string");
                if (field.getLabel() != null) {
                    schema.put("title", field.getLabel());
                }
                if (field.getDescription() != null) {
                    schema.put("description", field.getDescription());
                }
                if (field.getConstraints() != null) {
                    applyStringConstraints(schema, field.getConstraints());
                }
            }
            case "date" -> {
                schema.put("type", "string");
                schema.put("format", "date");
                if (field.getLabel() != null) {
                    schema.put("title", field.getLabel());
                }
            }
            case "number" -> {
                schema.put("type", "number");
                if (field.getLabel() != null) {
                    schema.put("title", field.getLabel());
                }
                if (field.getConstraints() != null) {
                    applyNumberConstraints(schema, field.getConstraints());
                }
            }
            case "integer" -> {
                schema.put("type", "integer");
                if (field.getLabel() != null) {
                    schema.put("title", field.getLabel());
                }
                if (field.getConstraints() != null) {
                    applyNumberConstraints(schema, field.getConstraints());
                }
            }
            case "boolean" -> {
                schema.put("type", "boolean");
                if (field.getLabel() != null) {
                    schema.put("title", field.getLabel());
                }
            }
            case "enum" -> {
                schema.put("type", "string");
                if (field.getLabel() != null) {
                    schema.put("title", field.getLabel());
                }
                if (field.getConstraints() != null && field.getConstraints().getEnumValues() != null) {
                    ArrayNode enumNode = objectMapper.createArrayNode();
                    for (String val : field.getConstraints().getEnumValues()) {
                        enumNode.add(val);
                    }
                    schema.set("enum", enumNode);
                }
            }
            case "object" -> {
                schema.put("type", "object");
                if (field.getLabel() != null) {
                    schema.put("title", field.getLabel());
                }
                if (field.getNestedFields() != null && !field.getNestedFields().isEmpty()) {
                    ObjectNode nestedProps = objectMapper.createObjectNode();
                    ArrayNode nestedRequired = objectMapper.createArrayNode();

                    for (BuilderField nested : field.getNestedFields()) {
                        nestedProps.set(nested.getKey(), buildFieldSchema(nested));
                        if (nested.isRequired()) {
                            nestedRequired.add(nested.getKey());
                        }
                    }

                    schema.set("properties", nestedProps);
                    if (nestedRequired.size() > 0) {
                        schema.set("required", nestedRequired);
                    }
                }
            }
            case "array" -> {
                schema.put("type", "array");
                if (field.getLabel() != null) {
                    schema.put("title", field.getLabel());
                }
                if (field.getConstraints() != null) {
                    applyArrayConstraints(schema, field.getConstraints());
                }
                if (field.getArrayItemFields() != null && !field.getArrayItemFields().isEmpty()) {
                    ObjectNode itemSchema = objectMapper.createObjectNode();
                    itemSchema.put("type", "object");

                    ObjectNode itemProps = objectMapper.createObjectNode();
                    ArrayNode itemRequired = objectMapper.createArrayNode();

                    for (BuilderField itemField : field.getArrayItemFields()) {
                        itemProps.set(itemField.getKey(), buildFieldSchema(itemField));
                        if (itemField.isRequired()) {
                            itemRequired.add(itemField.getKey());
                        }
                    }

                    itemSchema.set("properties", itemProps);
                    if (itemRequired.size() > 0) {
                        itemSchema.set("required", itemRequired);
                    }
                    schema.set("items", itemSchema);
                }
            }
            default -> schema.put("type", "string");
        }

        return schema;
    }

    private void applyStringConstraints(ObjectNode schema, FieldConstraints constraints) {
        if (constraints.getMinLength() != null) {
            schema.put("minLength", constraints.getMinLength());
        }
        if (constraints.getMaxLength() != null) {
            schema.put("maxLength", constraints.getMaxLength());
        }
        if (constraints.getPattern() != null) {
            schema.put("pattern", constraints.getPattern());
        }
    }

    private void applyNumberConstraints(ObjectNode schema, FieldConstraints constraints) {
        if (constraints.getMinimum() != null) {
            schema.put("minimum", constraints.getMinimum());
        }
        if (constraints.getMaximum() != null) {
            schema.put("maximum", constraints.getMaximum());
        }
    }

    private void applyArrayConstraints(ObjectNode schema, FieldConstraints constraints) {
        if (constraints.getMinItems() != null) {
            schema.put("minItems", constraints.getMinItems());
        }
        if (constraints.getMaxItems() != null) {
            schema.put("maxItems", constraints.getMaxItems());
        }
    }

    // ===== Build UI Schema =====

    /**
     * Build UI Schema from BuilderState.
     * 
     * @param state The builder state
     * @return UI Schema as string
     */
    public String buildUiSchemaJson(BuilderState state) {
        try {
            ObjectNode schema = buildUiSchema(state);
            return objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(schema);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to serialize UI Schema", e);
        }
    }

    /**
     * Build UI Schema from BuilderState as ObjectNode.
     */
    public ObjectNode buildUiSchema(BuilderState state) {
        ObjectNode root = objectMapper.createObjectNode();

        // Build grid columns
        ArrayNode gridColumns = objectMapper.createArrayNode();
        for (BuilderGridColumn col : state.getGridColumns()) {
            ObjectNode colNode = objectMapper.createObjectNode();
            colNode.put("path", col.getFieldPath());
            colNode.put("label", col.getLabel() != null ? col.getLabel() : resolveLabel(state, col.getFieldPath()));
            if (col.getWidthPx() != null) {
                colNode.put("widthPx", col.getWidthPx());
            }
            gridColumns.add(colNode);
        }
        root.set("gridColumns", gridColumns);

        // Build sections
        ArrayNode sections = objectMapper.createArrayNode();
        for (BuilderSection section : state.getSections()) {
            ObjectNode sectionNode = objectMapper.createObjectNode();
            sectionNode.put("title", section.getTitle());
            if (section.getColumns() != null) {
                sectionNode.put("columns", section.getColumns());
            }

            ArrayNode fields = objectMapper.createArrayNode();
            for (BuilderControl control : section.getControls()) {
                ObjectNode fieldNode = objectMapper.createObjectNode();
                fieldNode.put("path", control.getFieldPath());
                fieldNode.put("label", control.getLabel() != null ? control.getLabel() : resolveLabel(state, control.getFieldPath()));
                if (control.getHint() != null) {
                    fieldNode.put("hint", control.getHint());
                }
                fields.add(fieldNode);
            }
            sectionNode.set("fields", fields);
            sections.add(sectionNode);
        }
        root.set("sections", sections);

        // Build arrays
        ArrayNode arrays = objectMapper.createArrayNode();
        for (BuilderArrayConfig arrayConfig : state.getArrays()) {
            ObjectNode arrayNode = objectMapper.createObjectNode();
            arrayNode.put("path", arrayConfig.getPath());
            arrayNode.put("title", arrayConfig.getTitle());

            ArrayNode columns = objectMapper.createArrayNode();
            for (BuilderArrayColumn col : arrayConfig.getColumns()) {
                ObjectNode colNode = objectMapper.createObjectNode();
                colNode.put("path", col.getFieldPath());
                colNode.put("label", col.getLabel() != null ? col.getLabel() : col.getFieldPath());
                if (col.getWidthPx() != null) {
                    colNode.put("widthPx", col.getWidthPx());
                }
                columns.add(colNode);
            }
            arrayNode.set("columns", columns);
            arrays.add(arrayNode);
        }
        root.set("arrays", arrays);

        return root;
    }

    /**
     * Resolve label from field path.
     */
    private String resolveLabel(BuilderState state, String fieldPath) {
        String[] parts = fieldPath.split("\\.");
        List<BuilderField> currentFields = state.getFields();

        for (int i = 0; i < parts.length; i++) {
            String part = parts[i];
            BuilderField found = null;

            for (BuilderField field : currentFields) {
                if (field.getKey().equals(part)) {
                    found = field;
                    break;
                }
            }

            if (found == null) {
                return fieldPath; // Fallback to path
            }

            if (i == parts.length - 1) {
                return found.getLabel() != null ? found.getLabel() : found.getKey();
            }

            // Navigate to nested fields
            if ("object".equals(found.getType()) && found.getNestedFields() != null) {
                currentFields = found.getNestedFields();
            } else if ("array".equals(found.getType()) && found.getArrayItemFields() != null) {
                currentFields = found.getArrayItemFields();
            } else {
                return fieldPath; // Fallback
            }
        }

        return fieldPath;
    }

    // ===== Validate Builder State =====

    /**
     * Validate a BuilderState for consistency and completeness.
     * 
     * @param state The builder state
     * @return Validation result with errors if any
     */
    public ValidationResult validateBuilderState(BuilderState state) {
        List<String> errors = new ArrayList<>();

        // Collect all valid field paths
        Set<String> validPaths = collectValidFieldPaths(state.getFields(), "");

        // Validate field definitions
        validateFields(state.getFields(), "", errors);

        // Validate sections reference valid fields
        for (BuilderSection section : state.getSections()) {
            if (section.getTitle() == null || section.getTitle().isBlank()) {
                errors.add("Section missing title");
            }
            for (BuilderControl control : section.getControls()) {
                if (!validPaths.contains(control.getFieldPath())) {
                    errors.add("Section '" + section.getTitle() + "' control references unknown field: " + control.getFieldPath());
                }
            }
        }

        // Validate grid columns reference valid fields
        for (BuilderGridColumn col : state.getGridColumns()) {
            if (!validPaths.contains(col.getFieldPath())) {
                errors.add("Grid column references unknown field: " + col.getFieldPath());
            }
        }

        // Validate array configs
        for (BuilderArrayConfig arrayConfig : state.getArrays()) {
            // Find the array field
            BuilderField arrayField = findFieldByPath(state.getFields(), arrayConfig.getPath());
            if (arrayField == null || !"array".equals(arrayField.getType())) {
                errors.add("Array config references non-existent or non-array field: " + arrayConfig.getPath());
                continue;
            }

            // Validate array columns reference valid item fields
            Set<String> itemPaths = collectValidFieldPaths(arrayField.getArrayItemFields(), "");
            for (BuilderArrayColumn col : arrayConfig.getColumns()) {
                if (!itemPaths.contains(col.getFieldPath())) {
                    errors.add("Array '" + arrayConfig.getPath() + "' column references unknown field: " + col.getFieldPath());
                }
            }
        }

        return errors.isEmpty() ? ValidationResult.valid() : ValidationResult.invalid(errors);
    }

    private void validateFields(List<BuilderField> fields, String prefix, List<String> errors) {
        Set<String> keys = new HashSet<>();

        for (BuilderField field : fields) {
            String path = prefix.isEmpty() ? field.getKey() : prefix + "." + field.getKey();

            // Check for duplicate keys
            if (keys.contains(field.getKey())) {
                errors.add("Duplicate field key: " + path);
            }
            keys.add(field.getKey());

            // Validate key format
            if (field.getKey() == null || !field.getKey().matches("^[a-zA-Z_][a-zA-Z0-9_]*$")) {
                errors.add("Invalid field key format: " + field.getKey() + " (must be alphanumeric + underscore, start with letter)");
            }

            // Validate type
            if (field.getType() == null || field.getType().isBlank()) {
                errors.add("Field missing type: " + path);
            }

            // Validate nested fields
            if ("object".equals(field.getType())) {
                if (field.getNestedFields() != null) {
                    validateFields(field.getNestedFields(), path, errors);
                }
            }

            // Validate array item fields
            if ("array".equals(field.getType())) {
                if (field.getArrayItemFields() != null) {
                    validateFields(field.getArrayItemFields(), path, errors);
                }
            }

            // Validate enum has values
            if ("enum".equals(field.getType())) {
                if (field.getConstraints() == null || 
                    field.getConstraints().getEnumValues() == null || 
                    field.getConstraints().getEnumValues().isEmpty()) {
                    errors.add("Enum field missing values: " + path);
                }
            }
        }
    }

    private Set<String> collectValidFieldPaths(List<BuilderField> fields, String prefix) {
        Set<String> paths = new HashSet<>();

        if (fields == null) return paths;

        for (BuilderField field : fields) {
            String path = prefix.isEmpty() ? field.getKey() : prefix + "." + field.getKey();
            paths.add(path);

            if ("object".equals(field.getType()) && field.getNestedFields() != null) {
                paths.addAll(collectValidFieldPaths(field.getNestedFields(), path));
            }
            // Note: array item fields are not included in top-level paths
        }

        return paths;
    }

    private BuilderField findFieldByPath(List<BuilderField> fields, String path) {
        String[] parts = path.split("\\.");
        List<BuilderField> current = fields;

        for (String part : parts) {
            BuilderField found = null;
            for (BuilderField field : current) {
                if (field.getKey().equals(part)) {
                    found = field;
                    break;
                }
            }
            if (found == null) {
                return null;
            }
            if ("object".equals(found.getType()) && found.getNestedFields() != null) {
                current = found.getNestedFields();
            } else if ("array".equals(found.getType())) {
                return found;
            } else {
                return found;
            }
        }

        return null;
    }

    // ===== Import from Schemas =====

    /**
     * Import BuilderState from existing schemas.
     * This is used when cloning or editing an existing version that may not have builderState.
     * 
     * @param dataSchemaJson JSON Schema string
     * @param uiSchemaJson UI Schema string
     * @return Reconstructed BuilderState
     */
    public BuilderState importFromSchemas(String dataSchemaJson, String uiSchemaJson) {
        try {
            JsonNode dataSchema = objectMapper.readTree(dataSchemaJson);
            JsonNode uiSchema = objectMapper.readTree(uiSchemaJson);
            return importFromSchemas(dataSchema, uiSchema);
        } catch (Exception e) {
            throw new RuntimeException("Failed to import from schemas", e);
        }
    }

    /**
     * Import BuilderState from existing schemas.
     */
    public BuilderState importFromSchemas(JsonNode dataSchema, JsonNode uiSchema) {
        BuilderState state = new BuilderState();

        // Import fields from data schema
        if (dataSchema.has("properties")) {
            Set<String> required = new HashSet<>();
            if (dataSchema.has("required")) {
                dataSchema.get("required").forEach(r -> required.add(r.asText()));
            }
            state.setFields(importFields(dataSchema.get("properties"), required));
        }

        // Import sections from UI schema
        if (uiSchema.has("sections")) {
            List<BuilderSection> sections = new ArrayList<>();
            for (JsonNode sectionNode : uiSchema.get("sections")) {
                BuilderSection section = new BuilderSection();
                section.setId(UUID.randomUUID().toString());
                section.setTitle(sectionNode.has("title") ? sectionNode.get("title").asText() : "Section");
                section.setColumns(sectionNode.has("columns") ? sectionNode.get("columns").asInt() : 2);

                List<BuilderControl> controls = new ArrayList<>();
                if (sectionNode.has("fields")) {
                    for (JsonNode fieldNode : sectionNode.get("fields")) {
                        BuilderControl control = new BuilderControl();
                        control.setFieldPath(fieldNode.get("path").asText());
                        if (fieldNode.has("label")) {
                            control.setLabel(fieldNode.get("label").asText());
                        }
                        if (fieldNode.has("hint")) {
                            control.setHint(fieldNode.get("hint").asText());
                        }
                        controls.add(control);
                    }
                }
                section.setControls(controls);
                sections.add(section);
            }
            state.setSections(sections);
        }

        // Import grid columns from UI schema
        if (uiSchema.has("gridColumns")) {
            List<BuilderGridColumn> gridColumns = new ArrayList<>();
            for (JsonNode colNode : uiSchema.get("gridColumns")) {
                BuilderGridColumn col = new BuilderGridColumn();
                col.setFieldPath(colNode.get("path").asText());
                if (colNode.has("label")) {
                    col.setLabel(colNode.get("label").asText());
                }
                if (colNode.has("widthPx")) {
                    col.setWidthPx(colNode.get("widthPx").asInt());
                }
                gridColumns.add(col);
            }
            state.setGridColumns(gridColumns);
        }

        // Import arrays from UI schema
        if (uiSchema.has("arrays")) {
            List<BuilderArrayConfig> arrays = new ArrayList<>();
            for (JsonNode arrayNode : uiSchema.get("arrays")) {
                BuilderArrayConfig arrayConfig = new BuilderArrayConfig();
                arrayConfig.setPath(arrayNode.get("path").asText());
                arrayConfig.setTitle(arrayNode.has("title") ? arrayNode.get("title").asText() : arrayConfig.getPath());

                List<BuilderArrayColumn> columns = new ArrayList<>();
                if (arrayNode.has("columns")) {
                    for (JsonNode colNode : arrayNode.get("columns")) {
                        BuilderArrayColumn col = new BuilderArrayColumn();
                        col.setFieldPath(colNode.get("path").asText());
                        if (colNode.has("label")) {
                            col.setLabel(colNode.get("label").asText());
                        }
                        if (colNode.has("widthPx")) {
                            col.setWidthPx(colNode.get("widthPx").asInt());
                        }
                        columns.add(col);
                    }
                }
                arrayConfig.setColumns(columns);
                arrays.add(arrayConfig);
            }
            state.setArrays(arrays);
        }

        return state;
    }

    private List<BuilderField> importFields(JsonNode properties, Set<String> required) {
        List<BuilderField> fields = new ArrayList<>();

        Iterator<Map.Entry<String, JsonNode>> iter = properties.fields();
        while (iter.hasNext()) {
            Map.Entry<String, JsonNode> entry = iter.next();
            String key = entry.getKey();
            JsonNode prop = entry.getValue();

            BuilderField field = importField(key, prop, required.contains(key));
            fields.add(field);
        }

        // Sort fields alphabetically for deterministic output
        fields.sort(Comparator.comparing(BuilderField::getKey));

        return fields;
    }

    private BuilderField importField(String key, JsonNode prop, boolean isRequired) {
        BuilderField field = new BuilderField();
        field.setKey(key);
        field.setRequired(isRequired);

        if (prop.has("title")) {
            field.setLabel(prop.get("title").asText());
        } else {
            field.setLabel(key);
        }

        if (prop.has("description")) {
            field.setDescription(prop.get("description").asText());
        }

        String type = prop.has("type") ? prop.get("type").asText() : "string";
        String format = prop.has("format") ? prop.get("format").asText() : null;

        // Determine field type
        if ("string".equals(type) && "date".equals(format)) {
            field.setType("date");
        } else if ("string".equals(type) && prop.has("enum")) {
            field.setType("enum");
            FieldConstraints constraints = new FieldConstraints();
            List<String> enumValues = new ArrayList<>();
            prop.get("enum").forEach(e -> enumValues.add(e.asText()));
            constraints.setEnumValues(enumValues);
            field.setConstraints(constraints);
        } else if ("object".equals(type)) {
            field.setType("object");
            if (prop.has("properties")) {
                Set<String> nestedRequired = new HashSet<>();
                if (prop.has("required")) {
                    prop.get("required").forEach(r -> nestedRequired.add(r.asText()));
                }
                field.setNestedFields(importFields(prop.get("properties"), nestedRequired));
            }
        } else if ("array".equals(type)) {
            field.setType("array");
            if (prop.has("items") && prop.get("items").has("properties")) {
                Set<String> itemRequired = new HashSet<>();
                if (prop.get("items").has("required")) {
                    prop.get("items").get("required").forEach(r -> itemRequired.add(r.asText()));
                }
                field.setArrayItemFields(importFields(prop.get("items").get("properties"), itemRequired));
            }

            // Import array constraints
            FieldConstraints constraints = new FieldConstraints();
            if (prop.has("minItems")) {
                constraints.setMinItems(prop.get("minItems").asInt());
            }
            if (prop.has("maxItems")) {
                constraints.setMaxItems(prop.get("maxItems").asInt());
            }
            field.setConstraints(constraints);
        } else {
            field.setType(type);

            // Import constraints
            FieldConstraints constraints = new FieldConstraints();
            boolean hasConstraints = false;

            if (prop.has("minLength")) {
                constraints.setMinLength(prop.get("minLength").asInt());
                hasConstraints = true;
            }
            if (prop.has("maxLength")) {
                constraints.setMaxLength(prop.get("maxLength").asInt());
                hasConstraints = true;
            }
            if (prop.has("pattern")) {
                constraints.setPattern(prop.get("pattern").asText());
                hasConstraints = true;
            }
            if (prop.has("minimum")) {
                constraints.setMinimum(prop.get("minimum").asDouble());
                hasConstraints = true;
            }
            if (prop.has("maximum")) {
                constraints.setMaximum(prop.get("maximum").asDouble());
                hasConstraints = true;
            }

            if (hasConstraints) {
                field.setConstraints(constraints);
            }
        }

        return field;
    }
}

