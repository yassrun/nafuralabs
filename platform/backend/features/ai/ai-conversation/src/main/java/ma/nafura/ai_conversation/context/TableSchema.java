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
    private String category;
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
