package ma.nafura.sandbox.api.request;

public record UpdateProductRequest(
    String code,
    String name,
    String status,
    String category,
    String description
) {
}
