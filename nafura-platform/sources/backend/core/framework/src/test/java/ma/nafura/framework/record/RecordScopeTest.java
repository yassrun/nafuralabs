package ma.nafura.platform.framework.record;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.UUID;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import ma.nafura.platform.framework.domain.TenantEntity;

class RecordScopeTest {

    private static final ObjectMapper JSON = new ObjectMapper();

    public static class Node extends TenantEntity {
        private UUID parentId;

        public UUID getParentId() {
            return parentId;
        }

        public void setParentId(UUID parentId) {
            this.parentId = parentId;
        }
    }

    @Test
    void aNodeDeclaresItsParent() throws Exception {
        RecordDescriptor descriptor = RecordDescriptor.parse("node.json", JSON.readTree("""
                {"entity":"demo.category","scope":{"node":true,"parent":"parentId"},"properties":{}}
                """), Node.class);

        assertThat(descriptor.scope().node()).isTrue();
        assertThat(descriptor.scope().parent()).isEqualTo("parentId");
    }

    @Test
    void aScopeIsANodeOrAReference() {
        assertThatThrownBy(() -> RecordDescriptor.parse("node.json", JSON.readTree("""
                {"entity":"demo.category","scope":{"node":true,"of":"demo.category","field":"parentId"},"properties":{}}
                """), Node.class))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("node or a reference");
    }
}
