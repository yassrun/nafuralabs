package ma.nafura.platform.collaboration.workflow;

import lombok.Builder;
import lombok.Data;

import java.util.Map;
import java.util.UUID;

@Data
@Builder
public class WorkflowContext {
    private String entityType;
    private UUID entityId;
    private String initiatedBy;
    private String templateCode;
    private Map<String, Object> payload;
}

