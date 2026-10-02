package ma.nafura.platform.collaboration.docmanager.storage;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

class LocalDocumentStorageTest {

    @TempDir
    Path root;

    @Test
    void storesReadsAndDeletesUnderTenantKey() throws Exception {
        LocalDocumentStorage storage = new LocalDocumentStorage(root);
        UUID tenant = UUID.randomUUID();

        String key = storage.upload(tenant, UUID.randomUUID(), "N°1.pdf",
                new ByteArrayInputStream("pdf".getBytes(StandardCharsets.UTF_8)), "application/pdf");

        assertThat(key).startsWith(tenant + "/");
        assertThat(storage.exists(key)).isTrue();
        try (InputStream in = storage.download(key)) {
            assertThat(new String(in.readAllBytes(), StandardCharsets.UTF_8)).isEqualTo("pdf");
        }
        storage.delete(key);
        assertThat(storage.exists(key)).isFalse();
    }

    @Test
    void rejectsKeysEscapingTheRoot() {
        LocalDocumentStorage storage = new LocalDocumentStorage(root.resolve("docs"));

        assertThatThrownBy(() -> storage.download("../secret.txt")).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> storage.exists("a/../../x")).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> storage.delete("")).isInstanceOf(IllegalArgumentException.class);
    }
}
