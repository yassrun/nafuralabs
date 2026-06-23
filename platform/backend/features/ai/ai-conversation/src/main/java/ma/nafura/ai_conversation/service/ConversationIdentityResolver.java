package ma.nafura.platform.ai.conversation.service;

import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.platform.framework.context.UserContext;
import ma.nafura.platform.ai.llm.model.ScopeType;
import org.springframework.stereotype.Component;

@Component
public class ConversationIdentityResolver {

    public String currentActorSub() {
        if (UserContext.getUserIdOrNull() != null) {
            return UserContext.getUserIdOrNull().toString();
        }
        if (UserContext.getUserEmail() != null && !UserContext.getUserEmail().isBlank()) {
            return UserContext.getUserEmail().trim().toLowerCase();
        }
        return "anonymous";
    }

    public String currentTenantId() {
        return TenantContext.getTenantIdOrNull() != null
            ? TenantContext.getTenantIdOrNull().toString()
            : null;
    }

    public ScopeType currentScopeType() {
        return currentTenantId() != null ? ScopeType.TENANT : ScopeType.GLOBAL;
    }
}


