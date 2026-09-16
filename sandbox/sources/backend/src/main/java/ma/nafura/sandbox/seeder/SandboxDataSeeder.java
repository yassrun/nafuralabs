package ma.nafura.sandbox.seeder;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import ma.nafura.sandbox.service.SandboxProductService;

@Component
public class SandboxDataSeeder implements ApplicationRunner {

    private final SandboxProductService productService;

    public SandboxDataSeeder(SandboxProductService productService) {
        this.productService = productService;
    }

    @Override
    public void run(ApplicationArguments args) {
        productService.ensureSeeded();
    }
}
