package ma.nafura.host;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.persistence.autoconfigure.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication(scanBasePackages = "ma.nafura.platform")
@EnableJpaRepositories(basePackages = "ma.nafura.platform")
@EntityScan(basePackages = "ma.nafura.platform")
public class PlatformHostApplication {

    public static void main(String[] args) {
        SpringApplication.run(PlatformHostApplication.class, args);
    }
}
