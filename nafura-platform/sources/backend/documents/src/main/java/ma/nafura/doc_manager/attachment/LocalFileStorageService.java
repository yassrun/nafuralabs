package ma.nafura.platform.collaboration.docmanager.attachment;

import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Optional;
import java.util.UUID;

/**
 * Local filesystem storage for attachments.
 * Selected when {@code app.storage.type=local} (default).
 */
@Slf4j
public class LocalFileStorageService implements FileStorageService {

    private final String basePath;

    public LocalFileStorageService(String basePath) {
        this.basePath = basePath;
    }

    @Override
    public String store(UUID tenantId, String entityType, String entityId, String fileName, String mimeType,
                        InputStream content, long sizeBytes) {
        try {
            Path dir = Path.of(basePath, tenantId.toString(), entityType, entityId);
            Files.createDirectories(dir);
            String safeName = sanitizeFileName(fileName);
            String key = dir.resolve(safeName).toString();
            Files.copy(content, Path.of(key), StandardCopyOption.REPLACE_EXISTING);
            return "local:" + tenantId + "/" + entityType + "/" + entityId + "/" + safeName;
        } catch (IOException e) {
            throw new FileStorageException("Failed to store file: " + fileName, e);
        }
    }

    @Override
    public String getDownloadUrl(String storedKey) {
        if (!storedKey.startsWith("local:")) {
            return storedKey;
        }
        return "/api/v1/platform/collaboration/attachments/download?key=" + storedKey;
    }

    @Override
    public void delete(String storedKey) {
        if (!storedKey.startsWith("local:")) {
            return;
        }
        try {
            String path = storedKey.substring("local:".length()).replace("/", java.io.File.separator);
            Path fullPath = Path.of(basePath).resolve(path);
            Files.deleteIfExists(fullPath);
        } catch (IOException e) {
            log.warn("Failed to delete stored file: {}", storedKey, e);
        }
    }

    @Override
    public Optional<Resource> getResource(String storedKey) {
        if (!storedKey.startsWith("local:")) {
            return Optional.empty();
        }
        try {
            String pathPart = storedKey.substring("local:".length()).replace("/", java.io.File.separator);
            Path fullPath = Path.of(basePath).resolve(pathPart);
            if (!Files.exists(fullPath) || !Files.isReadable(fullPath)) {
                return Optional.empty();
            }
            return Optional.of(new UrlResource(fullPath.toUri()));
        } catch (Exception e) {
            log.warn("Failed to get resource for key: {}", storedKey, e);
            return Optional.empty();
        }
    }

    private static String sanitizeFileName(String fileName) {
        if (fileName == null || fileName.isBlank()) {
            return UUID.randomUUID().toString();
        }
        return fileName.replaceAll("[^a-zA-Z0-9._-]", "_");
    }
}

