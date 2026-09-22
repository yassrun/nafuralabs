package ma.nafura.sandbox.bootstrap;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.persistence.autoconfigure.EntityScan;
import org.springframework.context.annotation.Bean;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication(scanBasePackages = {
    "ma.nafura.sandbox",
    "ma.nafura.platform"
})
@EnableJpaRepositories(basePackages = {
    "ma.nafura.sandbox",
    "ma.nafura.platform"
})
@EntityScan(basePackages = {
    "ma.nafura.sandbox",
    "ma.nafura.platform"
})
public class SandboxApplication {

    @Bean
    ObjectMapper objectMapper() {
        return new ObjectMapper();
    }

    public static void main(String[] args) {
        SpringApplication.run(SandboxApplication.class, args);
    }
}
