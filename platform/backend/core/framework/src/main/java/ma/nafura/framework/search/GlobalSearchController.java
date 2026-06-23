package ma.nafura.platform.framework.search;

import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/platform/search")
public class GlobalSearchController {

    private final GlobalSearchService globalSearchService;

    public GlobalSearchController(GlobalSearchService globalSearchService) {
        this.globalSearchService = globalSearchService;
    }

    @GetMapping
    public ResponseEntity<GlobalSearchResponse> search(
            @RequestParam("q") String query,
            @RequestParam(value = "types", required = false) String types,
            @RequestParam(value = "size", defaultValue = "10") int size
    ) {
        String trimmed = query != null ? query.trim() : "";
        if (trimmed.length() < 2) {
            return ResponseEntity.ok(new GlobalSearchResponse(List.of(), 0));
        }
        int safeSize = Math.min(Math.max(1, size), 20);
        Set<String> requestedTypes = parseTypes(types);
        GlobalSearchService.SearchResponse result = globalSearchService.search(
                trimmed,
                TenantContext.getTenantIdOrNull(),
                requestedTypes,
                safeSize
        );
        return ResponseEntity.ok(new GlobalSearchResponse(result.results(), result.total()));
    }

    private Set<String> parseTypes(String value) {
        if (value == null || value.isBlank()) {
            return Set.of();
        }
        Set<String> out = new LinkedHashSet<>();
        Arrays.stream(value.split(","))
                .map(item -> item == null ? "" : item.trim().toLowerCase(Locale.ROOT))
                .filter(item -> !item.isBlank())
                .forEach(out::add);
        return out;
    }

    public record GlobalSearchResponse(
            java.util.List<GlobalSearchResult> results,
            int total
    ) {
    }
}
