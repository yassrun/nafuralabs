package ma.nafura.venuecatalog.place.application;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import java.util.Locale;
import java.util.Set;

/**
 * Maps API sort keys for catalog place listing.
 * Native queries embed ORDER BY via a composite {@code sortKey} param
 * (Spring Data Pageable Sort is unreliable on native SQL with joins).
 */
public final class PlaceListSort {

    private static final Set<String> FIELDS = Set.of(
            "updatedAt",
            "canonicalName",
            "status",
            "cityCode",
            "primaryCategory",
            "venueType",
            "aiDecision",
            "layaliScore"
    );

    private PlaceListSort() {}

    public record Parsed(String sortKey, Pageable pageable) {}

    /**
     * @param sortParam {@code field,dir} e.g. {@code updatedAt,desc}
     * @return composite sortKey for native ORDER BY CASE + unsorted pageable
     */
    public static Parsed parse(int page, int size, String sortParam) {
        String field = "updatedAt";
        String dir = "desc";
        if (sortParam != null && !sortParam.isBlank()) {
            String[] parts = sortParam.split(",", 2);
            String requested = parts[0].trim();
            if (FIELDS.contains(requested)) {
                field = requested;
            }
            if (parts.length > 1) {
                String requestedDir = parts[1].trim().toLowerCase(Locale.ROOT);
                if ("asc".equals(requestedDir) || "desc".equals(requestedDir)) {
                    dir = requestedDir;
                }
            }
        }
        String sortKey = field + "_" + dir;
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, size), Sort.unsorted());
        return new Parsed(sortKey, pageable);
    }
}
