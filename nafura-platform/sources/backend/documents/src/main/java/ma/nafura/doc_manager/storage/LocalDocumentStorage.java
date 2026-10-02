package ma.nafura.platform.collaboration.docmanager.storage;

import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

/** Filesystem storage for documents when no MinIO endpoint is configured (lab, single-node installs). */
public class LocalDocumentStorage implements DocumentStorage {

    private final Path root;

    public LocalDocumentStorage(Path root) {
        this.root = root.toAbsolutePath().normalize();
    }

    @Override
    public String upload(UUID tenantId, UUID documentId, String fileName, InputStream inputStream, String contentType) {
        String storageKey = MinioDocumentStorage.buildStorageKey(tenantId, documentId);
        Path target = resolve(storageKey);
        try {
            Files.createDirectories(target.getParent());
            Files.copy(inputStream, target, StandardCopyOption.REPLACE_EXISTING);
            return storageKey;
        } catch (IOException e) {
            throw new MinioDocumentStorage.StorageException("Failed to store document", e);
        }
    }

    @Override
    public InputStream download(String storageKey) {
        try {
            return Files.newInputStream(resolve(storageKey));
        } catch (IOException e) {
            throw new MinioDocumentStorage.StorageException("Failed to read document", e);
        }
    }

    @Override
    public void delete(String storageKey) {
        try {
            Files.deleteIfExists(resolve(storageKey));
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }

    @Override
    public boolean exists(String storageKey) {
        return Files.isRegularFile(resolve(storageKey));
    }

    /** Rejects keys that would escape the storage root (e.g. "../"). */
    Path resolve(String storageKey) {
        Path path = root.resolve(storageKey).normalize();
        if (!path.startsWith(root) || path.equals(root)) {
            throw new IllegalArgumentException("Invalid storage key");
        }
        return path;
    }
}
