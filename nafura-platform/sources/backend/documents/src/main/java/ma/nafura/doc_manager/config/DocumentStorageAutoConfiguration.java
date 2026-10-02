package ma.nafura.platform.collaboration.docmanager.config;

import java.nio.file.Path;

import ma.nafura.platform.collaboration.docmanager.storage.DocumentStorage;
import ma.nafura.platform.collaboration.docmanager.storage.LocalDocumentStorage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;

/** Local document storage unless a product or MinIO ({@code documents.minio.endpoint}) provides one. */
@AutoConfiguration
public class DocumentStorageAutoConfiguration {

    @Bean
    @ConditionalOnMissingBean
    DocumentStorage documentStorage(
            @Value("${app.storage.local.base-path:${java.io.tmpdir}/nafura-attachments}") String basePath) {
        return new LocalDocumentStorage(Path.of(basePath, "documents"));
    }
}
