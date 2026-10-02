package ma.nafura.platform.hosttests;

import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.persistence.autoconfigure.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

/** The platform with every capability, as a product host embeds it. */
@SpringBootApplication(scanBasePackages = "ma.nafura.platform")
@EnableJpaRepositories(basePackages = "ma.nafura.platform")
@EntityScan(basePackages = {"ma.nafura.platform", "ma.nafura.geo"})
public class AllCapabilitiesApplication {
}
