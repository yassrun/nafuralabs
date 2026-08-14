package ma.nafura.platform.framework.search;

public record GlobalSearchResult(
        String id,
        String entityType,
        String title,
        String subtitle,
        String route,
        String icon,
        double score
) {
}
