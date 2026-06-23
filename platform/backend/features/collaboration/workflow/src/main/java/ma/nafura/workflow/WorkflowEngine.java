package ma.nafura.platform.collaboration.workflow;

import ma.nafura.platform.collaboration.workflow.domain.model.WorkflowInstance;

import java.util.UUID;

public interface WorkflowEngine {

    WorkflowInstance trigger(String event, WorkflowContext context);

    void advance(UUID instanceId);

    void complete(UUID instanceId);

    void cancel(UUID instanceId);
}

