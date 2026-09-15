package ma.nafura.platform.framework.listing;

import java.util.List;

public record ListingQuery(
        String search,
        List<FilterClause> filters,
        ListingSort sort,
        int page,
        int size,
        ListingScope scope) {

    public ListingQuery {
        filters = filters != null ? List.copyOf(filters) : List.of();
        scope = scope != null ? scope : ListingScope.ALL;
    }
}
