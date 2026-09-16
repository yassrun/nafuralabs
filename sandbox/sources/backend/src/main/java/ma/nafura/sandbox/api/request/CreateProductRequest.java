package ma.nafura.sandbox.api.request;

import jakarta.validation.constraints.NotBlank;

public record CreateProductRequest(
    @NotBlank String code,
    @NotBlank String name,
    @NotBlank String status,
    @NotBlank String category,
    String description
) {
}
