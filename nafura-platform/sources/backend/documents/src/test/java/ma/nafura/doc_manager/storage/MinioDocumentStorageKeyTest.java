package ma.nafura.platform.collaboration.docmanager.storage;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.UUID;
import org.junit.jupiter.api.Test;

class MinioDocumentStorageKeyTest {

    @Test
    void objectKeyOmitsOriginalFileName() {
        UUID tenant = UUID.fromString("a5e802e9-abd4-47db-9242-8c4942a3d3db");
        UUID document = UUID.fromString("4f8d5d79-7eb5-4e38-9105-a38b66f2072f");

        String key = MinioDocumentStorage.buildStorageKey(tenant, document);

        assertThat(key).matches(
                "a5e802e9-abd4-47db-9242-8c4942a3d3db/\\d{4}/\\d{2}/4f8d5d79-7eb5-4e38-9105-a38b66f2072f");
        assertThat(key).doesNotContain("CPS");
        assertThat(key).doesNotContain("°");
    }
}
