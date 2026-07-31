package ma.nafura.platform.ai.conversation.context;

import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
public class TableSchema {
    private String name;
    private String domain;
    private String zone;
    private String entity;
    private String description;
    /** core = always in prompt; extended = included when domain matches */
    private String category;
    /** Business terms mapped to this table (aliases for LLM grounding) */
    private List<String> aliases;
    /** Short SQL hints or status values for the model */
    private List<String> hints;
    private List<ColumnSchema> columns;

    @Data
    public static class ColumnSchema {
        private String name;
        private String type;
        private Boolean pk;
        private String description;
        private Map<String, Object> fk;
    }
}
