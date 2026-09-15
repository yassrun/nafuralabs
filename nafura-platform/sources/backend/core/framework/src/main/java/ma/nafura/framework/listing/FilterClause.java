package ma.nafura.platform.framework.listing;

public record FilterClause(String field, FilterOperator op, String rawValue) {}
