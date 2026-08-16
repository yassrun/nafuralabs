package ma.nafura.platform.framework.api.error;

public class StorageQuotaExceededException extends RuntimeException {

    public StorageQuotaExceededException(String message) {
        super(message);
    }
}
