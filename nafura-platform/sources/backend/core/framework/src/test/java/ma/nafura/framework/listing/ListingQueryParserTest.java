package ma.nafura.platform.framework.listing;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Sort;

class ListingQueryParserTest {

    @Test
    void parsesFiltersSearchSortAndScope() {
        ListingQuery query = ListingQueryParser.parse(
                List.of("name:contains:foo", "code:eq:ABC"),
                null,
                "bar",
                "name,desc",
                2,
                50,
                "mine");

        assertEquals("bar", query.search());
        assertEquals(2, query.page());
        assertEquals(50, query.size());
        assertEquals(ListingScope.MINE, query.scope());
        assertEquals(2, query.filters().size());
        assertEquals("name", query.filters().get(0).field());
        assertEquals(FilterOperator.CONTAINS, query.filters().get(0).op());
        assertEquals("foo", query.filters().get(0).rawValue());
        assertEquals("name", query.sort().field());
        assertEquals(Sort.Direction.DESC, query.sort().direction());
    }

    @Test
    void parsesIsEmptyWithoutValue() {
        FilterClause clause = ListingQueryParser.parseFilterToken("description:isEmpty");
        assertEquals(FilterOperator.IS_EMPTY, clause.op());
        assertNull(clause.rawValue());
    }

    @Test
    void rejectsInvalidFilterToken() {
        assertThrows(ListingQueryException.class, () -> ListingQueryParser.parseFilterToken("onlyfield"));
    }

    @Test
    void defaultsScopeToAll() {
        ListingQuery query = ListingQueryParser.parse(List.of(), null, null, null, 0, 20, null);
        assertEquals(ListingScope.ALL, query.scope());
    }
}
