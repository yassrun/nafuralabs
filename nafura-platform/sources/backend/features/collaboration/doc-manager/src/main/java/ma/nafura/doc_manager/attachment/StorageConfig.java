package ma.nafura.platform.collaboration.docmanager.attachment;

import io.minio.MinioClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Configures the active file storage implementation based on {@code app.storage.type}.
 * Default is {@code local}; set to {@code s3} for S3-compatible storage (MinIO / AWS S3).
 */
@Configuration
public class StorageConfig {

    @Bean
    @ConditionalOnProperty(name = "app.storage.type", havingValue = "local", matchIfMissing = true)
    public FileStorageService localStorage(
            @Value("${app.storage.local.base-path:${nafura.collaboration.attachment.local.base-path:${java.io.tmpdir}/nafura-attachments}}") String basePath) {
        return new LocalFileStorageService(basePath);
    }

    @Bean("attachmentS3MinioClient")
    @ConditionalOnProperty(name = "app.storage.type", havingValue = "s3")
    public MinioClient attachmentS3MinioClient(
            @Value("${app.storage.s3.endpoint}") String endpoint,
            @Value("${app.storage.s3.access-key}") String accessKey,
            @Value("${app.storage.s3.secret-key}") String secretKey,
            @Value("${app.storage.s3.region:us-east-1}") String region) {
        return MinioClient.builder()
                .endpoint(endpoint)
                .credentials(accessKey, secretKey)
                .region(region)
                .build();
    }

    @Bean
    @ConditionalOnProperty(name = "app.storage.type", havingValue = "s3")
    public FileStorageService s3Storage(
            @org.springframework.beans.factory.annotation.Qualifier("attachmentS3MinioClient") MinioClient minioClient,
            @Value("${app.storage.s3.bucket}") String bucket) {
        return new S3FileStorageService(minioClient, bucket);
    }
}
