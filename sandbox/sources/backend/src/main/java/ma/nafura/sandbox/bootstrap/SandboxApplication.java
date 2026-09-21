package ma.nafura.sandbox.bootstrap;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.persistence.autoconfigure.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication(scanBasePackages = {
    "ma.nafura.sandbox",
    "ma.nafura.platform.collaboration.notification"
})
@EnableJpaRepositories(basePackages = {
    "ma.nafura.sandbox",
    "ma.nafura.platform.collaboration.notification"
})
@EntityScan(basePackages = {
    "ma.nafura.sandbox",
    "ma.nafura.platform.collaboration.notification"
})
public class SandboxApplication {

    public static void main(String[] args) {
        SpringApplication.run(SandboxApplication.class, args);
    }
}
