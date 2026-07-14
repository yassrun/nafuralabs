package ma.nafura.usageops;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;

@SpringBootApplication(scanBasePackages = {
        "ma.nafura.platform",
        "ma.nafura.usageops"
})
@EnableJpaRepositories(basePackages = {
        "ma.nafura.platform",
        "ma.nafura.usageops"
})
@EntityScan(basePackages = {
        "ma.nafura.platform",
        "ma.nafura.usageops"
})
@EnableAsync
@EnableScheduling
@EnableMethodSecurity
@ConfigurationPropertiesScan(basePackages = "ma.nafura.usageops")
public class UsageOpsApplication {

    public static void main(String[] args) {
        SpringApplication.run(UsageOpsApplication.class, args);
    }
}
