package ma.nafura.venuecatalog.compliance;

import io.minio.GetPresignedObjectUrlArgs;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import io.minio.RemoveObjectArgs;
import io.minio.http.Method;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
public class VenueCatalogMediaStorageService {

    private final MinioClient minioClient;
    private final VenueCatalogStorageProperties storageProperties;

    public VenueCatalogMediaStorageService(
            @Qualifier("venueCatalogMinioClient") MinioClient minioClient,
            VenueCatalogStorageProperties storageProperties
    ) {
        this.minioClient = minioClient;
        this.storageProperties = storageProperties;
    }

    public StoredObject storeGooglePhoto(UUID catalogPlaceId, byte[] content, Map<String, String> metadata) {
        String checksum = sha256Prefix(content);
        String storageKey = "google/" + catalogPlaceId + "/" + checksum + ".jpg";
        try {
            minioClient.putObject(
                    PutObjectArgs.builder()
                            .bucket(storageProperties.getBucket())
                            .object(storageKey)
                            .stream(new ByteArrayInputStream(content), content.length, -1)
                            .contentType("image/jpeg")
                            .userMetadata(metadata)
                            .build()
            );
            return new StoredObject(storageKey, "sha256:" + checksum);
        } catch (Exception e) {
            throw new MediaStorageException("Failed to store media in MinIO", e);
        }
    }

    public String signedUrl(String storageKey) {
        try {
            return minioClient.getPresignedObjectUrl(
                    GetPresignedObjectUrlArgs.builder()
                            .method(Method.GET)
                            .bucket(storageProperties.getBucket())
                            .object(storageKey)
                            .expiry(storageProperties.getPublicReadSignedUrlTtlMinutes(), TimeUnit.MINUTES)
                            .build()
            );
        } catch (Exception e) {
            throw new MediaStorageException("Failed to sign media URL", e);
        }
    }

    public void delete(String storageKey) {
        try {
            minioClient.removeObject(
                    RemoveObjectArgs.builder()
                            .bucket(storageProperties.getBucket())
                            .object(storageKey)
                            .build()
            );
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
