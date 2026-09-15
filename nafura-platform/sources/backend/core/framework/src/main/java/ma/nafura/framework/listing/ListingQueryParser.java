package ma.nafura.platform.framework.listing;

import java.util.ArrayList;
import java.util.List;
import org.springframework.data.domain.Sort;

/**
 * Parses HTTP list query parameters into a {@link ListingQuery}.
 */
public final class ListingQueryParser {

    private ListingQueryParser() {}

    public static ListingQuery parse(
            List<String> filterParams,
            String search,
            String q,
            String sort,
            int page,
            int size,
            String scope) {

        String effectiveSearch = hasText(search) ? search.trim() : (hasText(q) ? q.trim() : null);
        List<FilterClause> filters = parseFilters(filterParams);
        ListingSort listingSort = parseSort(sort);
        ListingScope listingScope = ListingScope.fromWire(scope);

        return new ListingQuery(effectiveSearch, filters, listingSort, page, size, listingScope);
    }

    static List<FilterClause> parseFilters(List<String> filterParams) {
        if (filterParams == null || filterParams.isEmpty()) {
            return List.of();
        }
        List<FilterClause> clauses = new ArrayList<>();
        for (String token : filterParams) {
            if (token == null || token.isBlank()) {
                continue;
            }
            clauses.add(parseFilterToken(token.trim()));
        }
        return clauses;
    }

    static FilterClause parseFilterToken(String token) {
        String[] parts = token.split(":", 3);
        if (parts.length < 2) {
            throw new ListingQueryException("Invalid filter token (expected field:op[:value]): " + token);
        }
        String field = parts[0].trim();
        if (field.isEmpty()) {
            throw new ListingQueryException("Filter field is required: " + token);
        }
        FilterOperator op = FilterOperator.fromWire(parts[1].trim());
        String rawValue = parts.length > 2 ? parts[2] : null;
        if (op == FilterOperator.IS_EMPTY || op == FilterOperator.IS_NOT_EMPTY) {
            rawValue = null;
        } else if (rawValue == null || rawValue.isBlank()) {
            throw new ListingQueryException("Filter value is required for operator " + op.wireName() + ": " + token);
        }
        return new FilterClause(field, op, rawValue);
    }

    static ListingSort parseSort(String sort) {
        if (!hasText(sort)) {
            return null;
        }
        String[] parts = sort.split(",", 2);
        String field = parts[0].trim();
        if (field.isEmpty()) {
            throw new ListingQueryException("Sort field is required");
        }
        Sort.Direction direction = parts.length > 1 && "desc".equalsIgnoreCase(parts[1].trim())
                ? Sort.Direction.DESC
                : Sort.Direction.ASC;
        return new ListingSort(field, direction);
    }

    private static boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
