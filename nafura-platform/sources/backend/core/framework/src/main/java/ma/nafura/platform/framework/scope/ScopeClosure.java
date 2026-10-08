package ma.nafura.platform.framework.scope;

import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/** Nodes visible from a set of grant roots: the roots and every descendant via {@code parent}. */
public final class ScopeClosure {

    private ScopeClosure() {
    }

    public static Set<UUID> descendants(Map<UUID, UUID> parentById, Collection<UUID> roots) {
        Map<UUID, List<UUID>> children = new LinkedHashMap<>();
        for (Map.Entry<UUID, UUID> entry : parentById.entrySet()) {
            if (entry.getValue() != null) {
                children.computeIfAbsent(entry.getValue(), key -> new ArrayList<>()).add(entry.getKey());
            }
        }
        Set<UUID> visible = new LinkedHashSet<>();
        ArrayDeque<UUID> queue = new ArrayDeque<>();
        for (UUID root : roots) {
            if (parentById.containsKey(root)) {
                queue.add(root);
            }
        }
        while (!queue.isEmpty()) {
            UUID id = queue.removeFirst();
            if (!visible.add(id)) {
                continue;
            }
            for (UUID child : children.getOrDefault(id, List.of())) {
                queue.add(child);
            }
        }
        return visible;
    }
}
