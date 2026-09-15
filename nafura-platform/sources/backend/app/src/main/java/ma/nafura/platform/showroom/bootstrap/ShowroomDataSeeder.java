package ma.nafura.platform.showroom.bootstrap;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import ma.nafura.platform.showroom.api.ShowroomCatalogService;

@Component
public class ShowroomDataSeeder implements ApplicationRunner {

    private final ShowroomCatalogService catalogService;

    public ShowroomDataSeeder(ShowroomCatalogService catalogService) {
        this.catalogService = catalogService;
    }

    @Override
    public void run(ApplicationArguments args) {
        catalogService.ensureSeeded();
    }
}
