package ma.nafura.sandbox.showroom.api.request;

public record UpdateProductRequest(
    String code,
    String name,
    String status,
    String category,
    String description
) {
}
