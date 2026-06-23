package ma.nafura.platform.framework.search;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;

@Service
public class GlobalSearchService {

    private final List<SearchableEntity> searchableEntities;
    private final GlobalSearchProperties properties;

    public GlobalSearchService(
            List<SearchableEntity> searchableEntities,
            GlobalSearchProperties properties
    ) {
        this.searchableEntities = searchableEntities != null ? searchableEntities : List.of();
        this.properties = properties;
    }

    public SearchResponse search(String query, UUID tenantId, int limit) {
        return search(query, tenantId, null, limit);
    }

    public SearchResponse search(String query, UUID tenantId, Set<String> requestedTypes, int limit) {
        if (!properties.isEnabled()) {
            return new SearchResponse(List.of(), 0);
        }
        String normalizedQuery = query != null ? query.trim() : "";
        if (tenantId == null || normalizedQuery.length() < properties.getMinQueryLength()) {
            return new SearchResponse(List.of(), 0);
        }

        int safeTotalLimit = clamp(limit, 1, Math.max(1, properties.getMaxTotalResults()));
        int perTypeLimit = Math.min(safeTotalLimit, Math.max(1, properties.getMaxResultsPerType()));
        Set<String> allowedTypes = normalizeTypes(requestedTypes);

        List<SearchableEntity> activeSearchers = searchableEntities.stream()
                .filter(searcher -> allowedTypes.isEmpty() || allowedTypes.contains(searcher.entityType().toLowerCase(Locale.ROOT)))
                .toList();

        List<GlobalSearchResult> rawResults = activeSearchers.parallelStream()
                .flatMap(searcher -> safeSearch(searcher, normalizedQuery, tenantId, perTypeLimit).stream())
                .toList();

        List<GlobalSearchResult> ordered = rawResults.stream()
                .sorted(Comparator
                        .comparingDouble(GlobalSearchResult::score).reversed()
                        .thenComparing(result -> result.title() != null ? result.title() : ""))
                .toList();

        Map<String, GlobalSearchResult> dedup = new LinkedHashMap<>();
        for (GlobalSearchResult result : ordered) {
            String dedupKey = (result.entityType() + ":" + result.id()).toLowerCase(Locale.ROOT);
            dedup.putIfAbsent(dedupKey, result);
        }

        List<GlobalSearchResult> unique = new ArrayList<>(dedup.values());
        int total = unique.size();
        if (unique.size() > safeTotalLimit) {
            unique = unique.subList(0, safeTotalLimit);
        }
        return new SearchResponse(unique, total);
    }

    private List<GlobalSearchResult> safeSearch(
            SearchableEntity searcher,
            String query,
            UUID tenantId,
            int perTypeLimit
    ) {
        try {
            return searcher.search(query, tenantId, perTypeLimit);
        } catch (Exception ignored) {
            return List.of();
        }
    }

    private Set<String> normalizeTypes(Set<String> requestedTypes) {
        Set<String> fromRequest = requestedTypes != null
                ? requestedTypes.stream()
                        .map(value -> value == null ? null : value.trim().toLowerCase(Locale.ROOT))
                        .filter(value -> value != null && !value.isBlank())
                        .collect(Collectors.toSet())
                : Set.of();

        if (fromRequest.isEmpty()) {
            Set<String> configured = properties.getEnabledTypes() != null
                    ? properties.getEnabledTypes().stream()
                            .map(value -> value == null ? null : value.trim().toLowerCase(Locale.ROOT))
                            .filter(value -> value != null && !value.isBlank())
                            .collect(Collectors.toSet())
                    : Set.of();
            return configured;
        }
        return fromRequest;
    }

    private int clamp(int value, int min, int max) {
        return Math.max(min, Math.min(max, value));
    }

    public record SearchResponse(List<GlobalSearchResult> results, int total) {
    }
}
