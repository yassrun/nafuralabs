package ma.nafura.platform.ai.agent.service.tool;

import java.util.Locale;
import java.util.Set;
import ma.nafura.platform.ai.agent.service.AgentExecutionContext;
import ma.nafura.platform.framework.context.UserContext;
import org.springframework.stereotype.Component;

@Component
public class AgentPermissionChecker {

    public void checkRead(AgentExecutionContext ctx, String domain, String entity) {
        check(ctx, domain, entity, "read", "view");
    }

    public void checkWrite(AgentExecutionContext ctx, String domain, String entity) {
        check(ctx, domain, entity, "write", "modify");
    }

    public void checkDelete(AgentExecutionContext ctx, String domain, String entity) {
        check(ctx, domain, entity, "delete", "delete");
    }

    private void check(AgentExecutionContext ctx, String domain, String entity, String operation, String verb) {
        Set<String> permissions = UserContext.getPermissions();
        if (UserContext.isSuperAdmin() || permissions == null || permissions.isEmpty()) {
            return;
        }

        String normalizedDomain = normalize(domain);
        String normalizedEntity = normalize(entity);
        String permission = normalizedDomain + "." + normalizedEntity + "." + operation;

        if (!UserContext.hasPermission(permission)) {
            throw new AgentPermissionDeniedException(
                    "You don't have permission to " + verb + " " + normalizedEntity
            );
        }
    }

    private String normalize(String value) {
        if (value == null || value.isBlank()) {
            return "unknown";
        }
        return value.trim().toLowerCase(Locale.ROOT).replace(' ', '-').replace('_', '-');
    }
}
