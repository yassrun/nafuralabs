package ma.nafura.platform.showroom.api;

import java.time.Instant;
import java.util.List;

import jakarta.validation.constraints.NotBlank;

public final class ShowroomApiModels {

    private ShowroomApiModels() {
    }

    public record ProductResponse(
        String id,
        String code,
        String name,
        String status,
        String category,
        String description,
        Instant createdAt
    ) {
    }

    public record CreateProductRequest(
        @NotBlank String code,
        @NotBlank String name,
        @NotBlank String status,
        @NotBlank String category,
        String description
    ) {
    }

    public record UpdateProductRequest(
        String code,
        String name,
        String status,
        String category,
        String description
    ) {
    }

    public record CatalogSection(
        String key,
        String title,
        List<String> routes
    ) {
    }

    public record CatalogResponse(
        String appName,
        String apiBaseUrl,
        Instant generatedAt,
        List<CatalogSection> sections,
        List<ProductResponse> seedProducts
    ) {
    }
}
