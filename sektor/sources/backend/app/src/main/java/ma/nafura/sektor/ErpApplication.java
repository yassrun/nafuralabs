package ma.nafura.sektor;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication(scanBasePackages = {
    "ma.nafura.platform",
    "ma.nafura.sektor",
    "ma.nafura.socle",
    "ma.nafura.catalogue",
    "ma.nafura.finance",
    "ma.nafura.achats",
    "ma.nafura.ventes",
    "ma.nafura.chantiers",
    "ma.nafura.etudes",
    "ma.nafura.rh",
    "ma.nafura.hse",
    "ma.nafura.marches"
})
@EnableJpaRepositories(basePackages = {
    "ma.nafura.platform",
    "ma.nafura.sektor",
    "ma.nafura.socle",
    "ma.nafura.catalogue",
    "ma.nafura.finance",
    "ma.nafura.achats",
    "ma.nafura.ventes",
    "ma.nafura.chantiers",
    "ma.nafura.etudes",
    "ma.nafura.rh",
    "ma.nafura.hse",
    "ma.nafura.marches"
})
@EntityScan(basePackages = {
    "ma.nafura.platform",
    "ma.nafura.sektor",
    "ma.nafura.socle",
    "ma.nafura.catalogue",
    "ma.nafura.finance",
    "ma.nafura.achats",
    "ma.nafura.ventes",
    "ma.nafura.chantiers",
    "ma.nafura.etudes",
    "ma.nafura.rh",
    "ma.nafura.hse",
    "ma.nafura.marches"
})
public class ErpApplication {

    public static void main(String[] args) {
        SpringApplication.run(ErpApplication.class, args);
    }
}
