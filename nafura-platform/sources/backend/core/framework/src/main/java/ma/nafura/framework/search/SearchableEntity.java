package ma.nafura.platform.framework.search;

import java.util.List;
import java.util.UUID;

public interface SearchableEntity {

    String entityType();

    List<GlobalSearchResult> search(String query, UUID tenantId, int limit);
}
