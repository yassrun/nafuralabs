package ma.nafura.buildintelligence;

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
        "ma.nafura.buildintelligence"
})
@EnableJpaRepositories(basePackages = "ma.nafura.buildintelligence")
@EntityScan(basePackages = "ma.nafura.buildintelligence")
@EnableAsync
@EnableScheduling
@EnableMethodSecurity
@ConfigurationPropertiesScan(basePackages = "ma.nafura.buildintelligence")
public class BuildIntelligenceApplication {

    public static void main(String[] args) {
        SpringApplication.run(BuildIntelligenceApplication.class, args);
    }
}
