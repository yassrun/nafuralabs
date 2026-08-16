package ma.nafura.platform.collaboration.docmanager.service;

import ma.nafura.platform.framework.api.error.StorageQuotaExceededException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class DocumentQuotaPolicy {

    private final long ceilingBytes;
    private final DocumentUsageService usage;

    public DocumentQuotaPolicy(
            @Value("${documents.quota.bytes:0}") long ceilingBytes,
            DocumentUsageService usage) {
        this.ceilingBytes = ceilingBytes;
        this.usage = usage;
    }

    public static DocumentQuotaPolicy unlimited() {
        return new DocumentQuotaPolicy(0, (DocumentUsageService) null);
    }

    public void refuseIfNewObjectExceeds(long newBytes, boolean alreadyPresent) {
        if (ceilingBytes <= 0 || alreadyPresent) {
            return;
        }
        long used = usage == null ? 0 : usage.usageBytesOfCurrentTenant();
        if (used + newBytes > ceilingBytes) {
            throw new StorageQuotaExceededException("Tenant storage quota exceeded");
        }
    }
}
