package ma.nafura.platform.collaboration.docmanager.attachment;

import org.springframework.core.io.Resource;

import java.io.InputStream;
import java.util.Optional;
import java.util.UUID;

/**
 * Abstraction for file storage (local filesystem, S3, etc.).
 */
public interface FileStorageService {

    String store(UUID tenantId, String entityType, String entityId, String fileName, String mimeType,
                 InputStream content, long sizeBytes);

    String getDownloadUrl(String storedKey);

    void delete(String storedKey);

    Optional<Resource> getResource(String storedKey);
}

