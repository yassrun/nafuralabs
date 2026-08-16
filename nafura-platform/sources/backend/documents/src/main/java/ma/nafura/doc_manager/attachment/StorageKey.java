package ma.nafura.platform.collaboration.docmanager.attachment;

import java.util.UUID;

final class StorageKey {

    private StorageKey() {
    }

    static boolean belongsToTenant(String key, UUID tenantId) {
        if (key == null || key.isBlank() || tenantId == null) {
            return false;
        }
        String prefix = tenantId + "/";
        if (key.startsWith("local:")) {
            return key.startsWith("local:" + prefix);
        }
        return key.startsWith(prefix);
    }
}
