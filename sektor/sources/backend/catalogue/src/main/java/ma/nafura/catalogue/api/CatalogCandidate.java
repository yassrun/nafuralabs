package ma.nafura.catalogue.api;

public record CatalogCandidate(
        String itemId,
        String code,
        String name,
        String unite,
        String nature,
        Double score) {}
