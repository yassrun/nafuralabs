package ma.nafura.platform.collaboration.docmanager.attachment;

import io.minio.GetPresignedObjectUrlArgs;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import io.minio.RemoveObjectArgs;
import io.minio.http.Method;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;

import java.io.InputStream;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

/**
 * S3-compatible file storage (MinIO / AWS S3) for attachments.
 * Selected when {@code app.storage.type=s3}.
 */
@Slf4j
public class S3FileStorageService implements FileStorageService {

    private static final int PRESIGNED_URL_EXPIRY_SECONDS = (int) TimeUnit.HOURS.toSeconds(1);

    private final MinioClient minioClient;
    private final String bucket;

    public S3FileStorageService(MinioClient minioClient, String bucket) {
        this.minioClient = minioClient;
        this.bucket = bucket;
    }

    @Override
    public String store(UUID tenantId, String entityType, String entityId, String fileName, String mimeType,
                        InputStream content, long sizeBytes) {
        String key = buildKey(tenantId, entityType, entityId, fileName);
        try {
            minioClient.putObject(
                    PutObjectArgs.builder()
                            .bucket(bucket)
                            .object(key)
                            .stream(content, sizeBytes, -1)
                            .contentType(mimeType != null ? mimeType : "application/octet-stream")
                            .build());
            return key;
        } catch (Exception e) {
            throw new FileStorageException("Failed to store file in S3: " + fileName, e);
        }
    }

    @Override
    public String getDownloadUrl(String storedKey) {
        try {
            return minioClient.getPresignedObjectUrl(
                    GetPresignedObjectUrlArgs.builder()
                            .method(Method.GET)
                            .bucket(bucket)
                            .object(storedKey)
                            .expiry(PRESIGNED_URL_EXPIRY_SECONDS)
                            .build());
        } catch (Exception e) {
            log.warn("Failed to generate presigned URL for key: {}", storedKey, e);
            throw new FileStorageException("Failed to generate download URL", e);
        }
    }

    @Override
    public void delete(String storedKey) {
        try {
            minioClient.removeObject(
                    RemoveObjectArgs.builder()
                            .bucket(bucket)
                            .object(storedKey)
                            .build());
        } catch (Exception e) {
            log.warn("Failed to delete object from S3: {}", storedKey, e);
        }
    }

    @Override
    public Optional<Resource> getResource(String storedKey) {
        // S3 uses presigned URLs; no direct Resource streaming from this service.
        return Optional.empty();
    }

    private static String buildKey(UUID tenantId, String entityType, String entityId, String fileName) {
        String safeName = sanitizeFileName(fileName);
        String unique = UUID.randomUUID().toString() + "_" + safeName;
        return tenantId + "/" + entityType + "/" + entityId + "/" + unique;
    }

    private static String sanitizeFileName(String fileName) {
        if (fileName == null || fileName.isBlank()) {
            return "file";
        }
        return fileName.replaceAll("[^a-zA-Z0-9._-]", "_");
    }
}
