package ma.nafura.sandbox.service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import ma.nafura.platform.framework.service.crud.JpaCrudService;
import ma.nafura.sandbox.api.request.CreateProductRequest;
import ma.nafura.sandbox.api.request.UpdateProductRequest;
import ma.nafura.sandbox.domain.SandboxProduct;
import ma.nafura.sandbox.domain.SandboxProductRepository;
import ma.nafura.sandbox.mapper.SandboxProductMapper;

@Service
public class SandboxProductService extends JpaCrudService<String, SandboxProduct, CreateProductRequest, UpdateProductRequest> {

    private static final String STATUS_ACTIVE = "Active";
    private static final String STATUS_DRAFT = "Draft";
    private static final String CATEGORY_MATERIAL = "Matériau";
    private static final String CATEGORY_TOOL = "Outillage";
    private static final String CATEGORY_CONSUMABLE = "Consommable";

    private final SandboxProductRepository productRepository;

    public SandboxProductService(SandboxProductRepository productRepository, SandboxProductMapper productMapper) {
        super(productRepository, productMapper);
        this.productRepository = productRepository;
    }

    @Transactional
    public void ensureSeeded() {
        if (productRepository.count() == 0) {
            seed();
        }
    }

    private void seed() {
        String[] categories = { CATEGORY_MATERIAL, CATEGORY_TOOL, CATEGORY_CONSUMABLE };
        productRepository.save(product("prd-01", "PRD-01", "Ciment CPJ 45", STATUS_ACTIVE, CATEGORY_MATERIAL, "Sac 50 kg", 1));
        productRepository.save(product("prd-02", "PRD-02", "Fer 12 mm", STATUS_ACTIVE, CATEGORY_MATERIAL, "Barre 12 m", 2));
        productRepository.save(product("prd-03", "PRD-03", "Sable 0/2", STATUS_DRAFT, CATEGORY_MATERIAL, "m³", 3));
        productRepository.save(product("prd-04", "PRD-04", "Gravier 5/15", STATUS_ACTIVE, CATEGORY_MATERIAL, null, 4));
        productRepository.save(product("prd-05", "PRD-05", "Béton C25/30", STATUS_DRAFT, CATEGORY_MATERIAL, null, 5));
        for (int index = 6; index <= 36; index++) {
            String id = "prd-" + String.format("%02d", index);
            String code = "PRD-" + String.format("%02d", index);
            productRepository.save(product(
                id,
                code,
                "Article " + index,
                index % 3 == 0 ? STATUS_DRAFT : STATUS_ACTIVE,
                categories[index % categories.length],
                index % 4 == 0 ? "Demo row" : null,
                index
            ));
        }
    }

    private static SandboxProduct product(
        String id,
        String code,
        String name,
        String status,
        String category,
        String description,
        int seed
    ) {
        int day = (seed % 27) + 1;
        int month = (seed % 12) + 1;
        Instant createdAt = LocalDate.of(2025, month, day).atStartOfDay().toInstant(ZoneOffset.UTC);
        return new SandboxProduct(id, code, name, status, category, description, createdAt);
    }
}
