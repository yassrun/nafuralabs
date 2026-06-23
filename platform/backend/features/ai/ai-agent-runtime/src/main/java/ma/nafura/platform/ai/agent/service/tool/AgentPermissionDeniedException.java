package ma.nafura.platform.ai.agent.service.tool;

public class AgentPermissionDeniedException extends RuntimeException {

    public AgentPermissionDeniedException(String message) {
        super(message);
    }
}
