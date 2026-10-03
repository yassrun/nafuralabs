package ma.nafura.host.seed;

import java.util.UUID;

import ma.nafura.platform.tenancy.domain.model.Tenant;
import ma.nafura.platform.tenancy.repository.TenantRepository;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;

/** At startup, after the organization and the lab users exist: brings every organization up to its data sets. */
@Order(50)
public class SeedRunner implements ApplicationRunner {

    private final TenantSeeder seeder;
    private final TenantRepository tenants;

    public SeedRunner(TenantSeeder seeder, TenantRepository tenants) {
        this.seeder = seeder;
        this.tenants = tenants;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (seeder.isEmpty()) {
            return;
        }
        for (UUID tenantId : tenants.findAll().stream().map(Tenant::getId).toList()) {
            seeder.seed(tenantId);
        }
    }
}
