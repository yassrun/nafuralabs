package ma.nafura.venuecatalog.compliance;

import ma.nafura.platform.collaboration.docmanager.storage.ObjectStorage;
import org.springframework.stereotype.Service;

import java.security.MessageDigest;
import java.time.Duration;
import java.util.HexFormat;
import java.util.Map;
import java.util.UUID;

@Service
public class VenueCatalogMediaStorageService {

    private final ObjectStorage objectStorage;
    private final VenueCatalogStorageProperties storageProperties;

    public VenueCatalogMediaStorageService(
            ObjectStorage objectStorage,
            VenueCatalogStorageProperties storageProperties
    ) {
        this.objectStorage = objectStorage;
        this.storageProperties = storageProperties;
    }

    public StoredObject storeGooglePhoto(UUID catalogPlaceId, byte[] content, Map<String, String> metadata) {
        String checksum = sha256Prefix(content);
        String storageKey = "google/" + catalogPlaceId + "/" + checksum + ".jpg";
        try {
            objectStorage.ensureBucket(storageProperties.getBucket());
            objectStorage.put(
                    storageProperties.getBucket(),
                    storageKey,
                    content,
                    "image/jpeg",
                    metadata);
            return new StoredObject(storageKey, "sha256:" + checksum);
        } catch (Exception e) {
            throw new MediaStorageException("Failed to store catalog media", e);
        }
    }

    public String signedUrl(String storageKey) {
        try {
            return objectStorage.presignGet(
                    storageProperties.getBucket(),
                    storageKey,
                    Duration.ofMinutes(storageProperties.getPublicReadSignedUrlTtlMinutes()));
        } catch (Exception e) {
            throw new MediaStorageException("Failed to sign media URL", e);
        }
    }

    public void delete(String storageKey) {
        try {
            objectStorage.delete(storageProperties.getBucket(), storageKey);
        } catch (Exception e) {
            throw new MediaStorageException("Failed to delete media object", e);
        }
    }

    private static String sha256Prefix(byte[] content) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(content);
            return HexFormat.of().formatHex(hash).substring(0, 12);
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }

    public record StoredObject(String storageKey, String checksum) {}
}
