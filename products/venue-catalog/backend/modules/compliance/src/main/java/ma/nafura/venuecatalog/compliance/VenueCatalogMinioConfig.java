package ma.nafura.venuecatalog.compliance;

import io.minio.GetPresignedObjectUrlArgs;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import io.minio.RemoveObjectArgs;
import io.minio.http.Method;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class VenueCatalogMinioConfig {

    @Bean("venueCatalogMinioClient")
    @ConditionalOnProperty(name = "app.storage.type", havingValue = "s3", matchIfMissing = true)
    public MinioClient venueCatalogMinioClient(
            @Value("${app.storage.s3.endpoint:http://localhost:9000}") String endpoint,
            @Value("${app.storage.s3.access-key:minioadmin}") String accessKey,
            @Value("${app.storage.s3.secret-key:minioadmin}") String secretKey,
            @Value("${app.storage.s3.region:us-east-1}") String region
    ) {
        return MinioClient.builder()
                .endpoint(endpoint)
                .credentials(accessKey, secretKey)
                .region(region)
                .build();
    }
}
