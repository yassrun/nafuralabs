package ma.nafura.platform.framework.scope;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import org.junit.jupiter.api.Test;

class ScopeClosureTest {

    @Test
    void aGrantCoversTheNodeAndItsDescendantsOnly() {
        UUID root = UUID.randomUUID();
        UUID child = UUID.randomUUID();
        UUID grandchild = UUID.randomUUID();
        UUID sibling = UUID.randomUUID();
        Map<UUID, UUID> parents = new LinkedHashMap<>();
        parents.put(root, null);
        parents.put(child, root);
        parents.put(grandchild, child);
        parents.put(sibling, null);

        assertThat(ScopeClosure.descendants(parents, Set.of(root))).containsExactlyInAnyOrder(root, child, grandchild);
        assertThat(ScopeClosure.descendants(parents, Set.of(child))).containsExactlyInAnyOrder(child, grandchild);
    }

    @Test
    void aCycleDoesNotRunForever() {
        UUID left = UUID.randomUUID();
        UUID right = UUID.randomUUID();
        Map<UUID, UUID> parents = Map.of(left, right, right, left);

        assertThat(ScopeClosure.descendants(parents, Set.of(left))).containsExactlyInAnyOrder(left, right);
    }
}
