package ma.nafura.venuecatalog;

import ma.nafura.platform.collaboration.docmanager.attachment.StorageConfig;
import ma.nafura.platform.collaboration.docmanager.storage.MinioObjectStorage;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.context.annotation.Import;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication(scanBasePackages = {
        "ma.nafura.platform.integrations.googleplaces",
        "ma.nafura.platform.jobrunner",
        "ma.nafura.platform.geo",
        "ma.nafura.platform.ai.llm",
        "ma.nafura.venuecatalog"
})
@EnableJpaRepositories(basePackages = {
        "ma.nafura.venuecatalog",
        "ma.nafura.platform.ai.llm"
})
@EntityScan(basePackages = {
        "ma.nafura.venuecatalog",
        "ma.nafura.platform.ai.llm"
})
@EnableAsync
@EnableScheduling
@ConfigurationPropertiesScan(basePackages = "ma.nafura.venuecatalog")
@Import({StorageConfig.class, MinioObjectStorage.class})
public class VenueCatalogApplication {

    public static void main(String[] args) {
        SpringApplication.run(VenueCatalogApplication.class, args);
    }
}
