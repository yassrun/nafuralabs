package ma.nafura.platform.collaboration.docmanager.storage;

import ma.nafura.platform.framework.api.error.PayloadTooLargeException;

public final class DocumentLimits {

    public static final long MAX_FILE_BYTES = 50L * 1024 * 1024;

    private DocumentLimits() {
    }

    public static void refuseIfTooLarge(long sizeBytes) {
        if (sizeBytes > MAX_FILE_BYTES) {
            throw new PayloadTooLargeException("File exceeds 50 MiB");
        }
    }
}
