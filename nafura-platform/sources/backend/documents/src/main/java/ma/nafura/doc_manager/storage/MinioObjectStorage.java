package ma.nafura.platform.collaboration.docmanager.storage;

import io.minio.BucketExistsArgs;
import io.minio.GetPresignedObjectUrlArgs;
import io.minio.MakeBucketArgs;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import io.minio.RemoveObjectArgs;
import io.minio.StatObjectArgs;
import io.minio.errors.ErrorResponseException;
import io.minio.http.Method;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.io.ByteArrayInputStream;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.TimeUnit;

@Component
@ConditionalOnProperty(name = "app.storage.type", havingValue = "s3")
public class MinioObjectStorage implements ObjectStorage {

    private final MinioClient minioClient;

    public MinioObjectStorage(
            @Qualifier("attachmentS3MinioClient") MinioClient minioClient
    ) {
        this.minioClient = minioClient;
    }

    @Override
    public void ensureBucket(String bucket) {
        try {
            boolean exists = minioClient.bucketExists(
                    BucketExistsArgs.builder().bucket(bucket).build());
            if (!exists) {
                minioClient.makeBucket(MakeBucketArgs.builder().bucket(bucket).build());
            }
        } catch (Exception exception) {
            throw new ObjectStorageException("Failed to ensure object storage bucket " + bucket, exception);
        }
    }

    @Override
    public void put(
            String bucket,
            String key,
            byte[] content,
            String contentType,
            Map<String, String> metadata
    ) {
        try {
            minioClient.putObject(
                    PutObjectArgs.builder()
                            .bucket(bucket)
                            .object(key)
                            .stream(new ByteArrayInputStream(content), content.length, -1)
                            .contentType(contentType)
                            .userMetadata(metadata)
                            .build());
        } catch (Exception exception) {
            throw new ObjectStorageException("Failed to store object " + key, exception);
        }
    }

    @Override
    public void delete(String bucket, String key) {
        try {
            minioClient.removeObject(
                    RemoveObjectArgs.builder().bucket(bucket).object(key).build());
        } catch (Exception exception) {
            throw new ObjectStorageException("Failed to delete object " + key, exception);
        }
    }

    @Override
    public boolean exists(String bucket, String key) {
        try {
            minioClient.statObject(
                    StatObjectArgs.builder().bucket(bucket).object(key).build());
            return true;
        } catch (ErrorResponseException exception) {
            if ("NoSuchKey".equals(exception.errorResponse().code())) {
                return false;
            }
            throw new ObjectStorageException("Failed to inspect object " + key, exception);
        } catch (Exception exception) {
            throw new ObjectStorageException("Failed to inspect object " + key, exception);
        }
    }

    @Override
    public String presignGet(String bucket, String key, Duration ttl) {
        try {
            long seconds = Math.max(1, ttl.toSeconds());
            return minioClient.getPresignedObjectUrl(
                    GetPresignedObjectUrlArgs.builder()
                            .method(Method.GET)
                            .bucket(bucket)
                            .object(key)
                            .expiry((int) Math.min(seconds, 604800), TimeUnit.SECONDS)
                            .build());
        } catch (Exception exception) {
            throw new ObjectStorageException("Failed to sign object URL " + key, exception);
        }
    }
}
