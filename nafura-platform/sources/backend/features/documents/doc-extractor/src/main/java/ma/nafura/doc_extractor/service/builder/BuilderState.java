package ma.nafura.platform.documents.docextractor.service.builder;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

/**
 * BuilderState - The canonical in-memory model for DocType definition.
 *
 * This single model is used to generate BOTH:
 * 1. Data Schema JSON (jsonSchema)
 * 2. UI Schema JSON (uiSchema)
 *
 * The frontend edits ONLY BuilderState; the backend generates the schemas.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class BuilderState {

    /**
     * Root-level field definitions.
     */
    @Builder.Default
    private List<BuilderField> fields = new ArrayList<>();

    /**
     * Form sections layout for the record dialog.
     */
    @Builder.Default
    private List<BuilderSection> sections = new ArrayList<>();

    /**
     * Grid columns for the workspace table.
     */
    @Builder.Default
    private List<BuilderGridColumn> gridColumns = new ArrayList<>();

    /**
     * Array table configurations.
     */
    @Builder.Default
    private List<BuilderArrayConfig> arrays = new ArrayList<>();

    /**
     * Field definition.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class BuilderField {
        private String key;
        private String label;
        private String type; // string, number, integer, boolean, date, enum, object, array
        private boolean required;
        private String description;
        private FieldConstraints constraints;
        private FieldHints hints;
        private List<BuilderField> nestedFields;
        private List<BuilderField> arrayItemFields;
    }

    /**
     * Field constraints based on type.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class FieldConstraints {
        // String constraints
        private Integer minLength;
        private Integer maxLength;
        private String pattern;

        // Number/integer constraints
        private Double minimum;
        private Double maximum;

        // Enum constraints
        private List<String> enumValues;

        // Array constraints
        private Integer minItems;
        private Integer maxItems;
    }

    /**
     * UI hints for field rendering.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class FieldHints {
        private String placeholder;
        private String appearance; // fill, outline
        private Boolean readonly;
        private Integer widthPx;
    }

    /**
     * Layout section definition.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class BuilderSection {
        private String id;
        private String title;
        @Builder.Default
        private Integer columns = 2;
        @Builder.Default
        private List<BuilderControl> controls = new ArrayList<>();
    }

    /**
     * A control in the layout, referencing a field.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class BuilderControl {
        private String fieldPath; // Dotted path to the field
        private String label; // Optional label override
        private String hint;
    }

    /**
     * Grid column configuration.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class BuilderGridColumn {
        private String fieldPath;
        private String label;
        private Integer widthPx;
    }

    /**
     * Array table configuration.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class BuilderArrayConfig {
        private String path;
        private String title;
        @Builder.Default
        private List<BuilderArrayColumn> columns = new ArrayList<>();
    }

    /**
     * Column in an array table.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class BuilderArrayColumn {
        private String fieldPath;
        private String label;
        private Integer widthPx;
    }
}

