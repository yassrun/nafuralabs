package ma.nafura.venuecatalog;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication(scanBasePackages = {
        "ma.nafura.platform",
        "ma.nafura.venuecatalog"
})
@EnableJpaRepositories(basePackages = {
        "ma.nafura.venuecatalog"
})
@EntityScan(basePackages = {
        "ma.nafura.venuecatalog"
})
@EnableAsync
@EnableScheduling
@ConfigurationPropertiesScan(basePackages = "ma.nafura.venuecatalog")
public class VenueCatalogApplication {

    public static void main(String[] args) {
        SpringApplication.run(VenueCatalogApplication.class, args);
    }
}
