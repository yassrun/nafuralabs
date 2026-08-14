package ma.nafura.platform.framework.scheduling;

import java.util.UUID;
import java.util.stream.Stream;

/**
 * Abstraction for providing active tenant IDs for tenant-scoped jobs.
 * Implemented in tenancy module and injected where needed.
 */
public interface TenantProvider {

    /**
     * Stream of active tenant IDs.
     */
    Stream<UUID> activeTenantIds();
}

