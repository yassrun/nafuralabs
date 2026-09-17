package ma.nafura.platform.showroom.api;

import static ma.nafura.platform.showroom.api.ShowroomApiModels.CatalogResponse;
import static ma.nafura.platform.showroom.api.ShowroomApiModels.CatalogSection;
import static ma.nafura.platform.showroom.api.ShowroomApiModels.CreateProductRequest;
import static ma.nafura.platform.showroom.api.ShowroomApiModels.ProductResponse;
import static ma.nafura.platform.showroom.api.ShowroomApiModels.UpdateProductRequest;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import ma.nafura.platform.showroom.domain.ShowroomProduct;
import ma.nafura.platform.showroom.domain.ShowroomProductRepository;

@Service
public class ShowroomCatalogService {

    private static final String STATUS_ACTIVE = "Active";
    private static final String STATUS_DRAFT = "Draft";
    private static final String CATEGORY_MATERIAL = "Mat\u00e9riau";
    private static final String CATEGORY_TOOL = "Outillage";
    private static final String CATEGORY_CONSUMABLE = "Consommable";

    private final ShowroomProductRepository productRepository;

    public ShowroomCatalogService(ShowroomProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    @Transactional
    public void ensureSeeded() {
        if (productRepository.count() == 0) {
            seed();
        }
    }

    public CatalogResponse catalog() {
        return new CatalogResponse(
            "Anatomy Showroom",
            "/api",
            Instant.now(),
            List.of(
                new CatalogSection("archetypes", "Archetypes", List.of(
                    "/archetypes/listing",
                    "/archetypes/listing-tree",
                    "/archetypes/details/:id",
                    "/archetypes/details-1n/:id",
                    "/archetypes/master-slave",
                    "/archetypes/tree",
                    "/archetypes/wizard",
                    "/archetypes/settings",
                    "/archetypes/dashboard",
                    "/archetypes/document-workspace"
                )),
                new CatalogSection("components", "Components", List.of(
                    "/components/atoms/*",
                    "/components/molecules/*",
                    "/components/organisms/*"
                )),
                new CatalogSection("platform", "Platform demo", List.of(
                    "/api/showroom/products",
                    "/actuator/health",
                    "/h2-console"
                ))
            ),
            listProducts()
        );
    }

    @Transactional(readOnly = true)
    public List<ProductResponse> listProducts() {
        return productRepository.findAllByOrderByCodeAsc().stream()
            .map(this::toResponse)
            .toList();
    }

    @Transactional(readOnly = true)
    public ProductResponse getProduct(String id) {
        return toResponse(requireProduct(id));
    }

    @Transactional
    public ProductResponse createProduct(CreateProductRequest request) {
        String id = "prd-" + Long.toHexString(System.currentTimeMillis());
        ShowroomProduct created = new ShowroomProduct(
            id,
            request.code(),
            request.name(),
            request.status(),
            request.category(),
            request.description(),
            Instant.now()
        );
        return toResponse(productRepository.save(created));
    }

    @Transactional
    public ProductResponse updateProduct(String id, UpdateProductRequest request) {
        ShowroomProduct current = requireProduct(id);
        if (request.code() != null) {
            current.setCode(request.code());
        }
        if (request.name() != null) {
            current.setName(request.name());
        }
        if (request.status() != null) {
            current.setStatus(request.status());
        }
        if (request.category() != null) {
            current.setCategory(request.category());
        }
        if (request.description() != null) {
            current.setDescription(request.description());
        }
        return toResponse(productRepository.save(current));
    }

    @Transactional
    public void deleteProduct(String id) {
        if (!productRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Product " + id + " not found");
        }
        productRepository.deleteById(id);
    }

    private ShowroomProduct requireProduct(String id) {
        return productRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product " + id + " not found"));
    }

    private ProductResponse toResponse(ShowroomProduct product) {
        return new ProductResponse(
            product.getId(),
            product.getCode(),
            product.getName(),
            product.getStatus(),
            product.getCategory(),
            product.getDescription(),
            product.getCreatedAt()
        );
    }

    private void seed() {
        String[] categories = { CATEGORY_MATERIAL, CATEGORY_TOOL, CATEGORY_CONSUMABLE };
        productRepository.save(product("prd-01", "PRD-01", "Ciment CPJ 45", STATUS_ACTIVE, CATEGORY_MATERIAL, "Sac 50 kg", 1));
        productRepository.save(product("prd-02", "PRD-02", "Fer 12 mm", STATUS_ACTIVE, CATEGORY_MATERIAL, "Barre 12 m", 2));
        productRepository.save(product("prd-03", "PRD-03", "Sable 0/2", STATUS_DRAFT, CATEGORY_MATERIAL, "m\u00b3", 3));
        productRepository.save(product("prd-04", "PRD-04", "Gravier 5/15", STATUS_ACTIVE, CATEGORY_MATERIAL, null, 4));
        productRepository.save(product("prd-05", "PRD-05", "Béton C25/30", STATUS_DRAFT, CATEGORY_MATERIAL, null, 5));
        for (int i = 6; i <= 36; i++) {
            String id = "prd-" + String.format("%02d", i);
            String code = "PRD-" + String.format("%02d", i);
            productRepository.save(product(
                id,
                code,
                "Article " + i,
                i % 3 == 0 ? STATUS_DRAFT : STATUS_ACTIVE,
                categories[i % categories.length],
                i % 4 == 0 ? "Demo row" : null,
                i
            ));
        }
    }

    private static ShowroomProduct product(
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
        return new ShowroomProduct(id, code, name, status, category, description, createdAt);
    }
}
