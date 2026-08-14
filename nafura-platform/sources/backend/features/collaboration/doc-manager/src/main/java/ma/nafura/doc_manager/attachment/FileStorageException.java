package ma.nafura.platform.collaboration.docmanager.attachment;

/**
 * Thrown when file storage operations fail.
 */
public class FileStorageException extends RuntimeException {

    public FileStorageException(String message) {
        super(message);
    }

    public FileStorageException(String message, Throwable cause) {
        super(message, cause);
    }
}

