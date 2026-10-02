package ma.nafura.platform.framework.record;

import java.util.UUID;

/**
 * Opens an approval for a lifecycle transition. Implemented by the approval capability, which calls
 * {@link LifecycleEngine#onApprovalDecided} once the request is approved or rejected.
 */
public interface ApprovalGateway {

    void request(String entityType, UUID entityId, String title, String approverRole);
}
