package ma.nafura.platform.framework.listing;

import static org.junit.jupiter.api.Assertions.assertThrows;

import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class ListingSpecificationBuilderTest {

    @Test
    void rejectsDisallowedFilterField() {
        ListingQuery query = new ListingQuery(
                null,
                List.of(new FilterClause("secret", FilterOperator.EQ, "x")),
                null,
                0,
                20,
                ListingScope.ALL);

        assertThrows(
                ListingQueryException.class,
                () -> ListingSpecificationBuilder.build(query, Set.of("name"), UUID.randomUUID()));
    }

    @Test
    void ignoresFiltersWhenAllowlistEmpty() {
        ListingQuery query = new ListingQuery(
                null,
                List.of(new FilterClause("name", FilterOperator.EQ, "x")),
                null,
                0,
                20,
                ListingScope.ALL);

        ListingSpecificationBuilder.build(query, Set.of(), UUID.randomUUID());
    }
}
