package ma.nafura.sandbox.showroom.bootstrap;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import ma.nafura.sandbox.showroom.service.ShowroomProductService;

@Component
public class ShowroomDataSeeder implements ApplicationRunner {

    private final ShowroomProductService productService;

    public ShowroomDataSeeder(ShowroomProductService productService) {
        this.productService = productService;
    }

    @Override
    public void run(ApplicationArguments args) {
        productService.ensureSeeded();
    }
}
