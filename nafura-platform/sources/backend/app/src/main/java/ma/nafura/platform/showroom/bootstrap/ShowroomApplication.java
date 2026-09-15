package ma.nafura.platform.showroom.bootstrap;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication(scanBasePackages = "ma.nafura.platform.showroom")
@EnableJpaRepositories(basePackages = "ma.nafura.platform.showroom")
@EntityScan(basePackages = "ma.nafura.platform.showroom")
public class ShowroomApplication {

    public static void main(String[] args) {
        SpringApplication.run(ShowroomApplication.class, args);
    }
}
