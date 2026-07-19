package ma.nafura.erp;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication(scanBasePackages = {
    "ma.nafura.platform",
    "ma.nafura.erp",
    "ma.nafura.item",
    "ma.nafura.stock",
    "ma.nafura.currency",
    "ma.nafura.finance",
    "ma.nafura.partner",
    "ma.nafura.achats",
    "ma.nafura.ventes",
    "ma.nafura.chantiers",
    "ma.nafura.etudes",
    "ma.nafura.rh",
    "ma.nafura.hse",
    "ma.nafura.marches",
    "ma.nafura.approbations"
})
@EnableJpaRepositories(basePackages = {
    "ma.nafura.platform",
    "ma.nafura.erp",
    "ma.nafura.item",
    "ma.nafura.stock",
    "ma.nafura.currency",
    "ma.nafura.finance",
    "ma.nafura.partner",
    "ma.nafura.achats",
    "ma.nafura.ventes",
    "ma.nafura.chantiers",
    "ma.nafura.etudes",
    "ma.nafura.rh",
    "ma.nafura.hse",
    "ma.nafura.marches",
    "ma.nafura.approbations"
})
@EntityScan(basePackages = {
    "ma.nafura.platform",
    "ma.nafura.erp",
    "ma.nafura.item",
    "ma.nafura.stock",
    "ma.nafura.currency",
    "ma.nafura.finance",
    "ma.nafura.partner",
    "ma.nafura.achats",
    "ma.nafura.ventes",
    "ma.nafura.chantiers",
    "ma.nafura.etudes",
    "ma.nafura.rh",
    "ma.nafura.hse",
    "ma.nafura.marches",
    "ma.nafura.approbations"
})
public class ErpApplication {

    public static void main(String[] args) {
        SpringApplication.run(ErpApplication.class, args);
    }
}
