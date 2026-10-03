package ma.nafura.host;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.persistence.autoconfigure.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

/** Main class of every product backend (set by nafura-host.gradle): products ship no Java outside their BCs. */
@SpringBootApplication(scanBasePackages = "ma.nafura.platform")
@EnableJpaRepositories(basePackages = "ma.nafura.platform")
@EntityScan(basePackages = "ma.nafura.platform")
public class NafuraHostApplication {

    public static void main(String[] args) {
        SpringApplication.run(NafuraHostApplication.class, args);
    }
}
