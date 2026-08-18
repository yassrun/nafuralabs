package ma.nafura.platform.ai.conversation.tool;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SqlQueryResult {
    private List<String> columns;
    private List<Map<String, Object>> rows;
    private int rowCount;
    private boolean truncated;
    private long executionTimeMs;
    private String explanation;
}
