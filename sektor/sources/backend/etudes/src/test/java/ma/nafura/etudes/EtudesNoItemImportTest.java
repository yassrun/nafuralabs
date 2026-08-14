package ma.nafura.etudes;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Stream;
import org.junit.jupiter.api.Test;

/**
 * SEKTOR-101 — Études ne réimporte pas item / stock Catalogue.
 * Rouge si un source Java du module reprend ces packages.
 */
class EtudesNoItemImportTest {

    private static final String FORBIDDEN_ITEM = "ma.nafura." + "item";
    private static final String FORBIDDEN_STOCK = "ma.nafura." + "stock";

    @Test
    void sources_doNotImportItemOrStock() throws IOException {
        List<String> hits = new ArrayList<>();
        Path root = Path.of("src/main/java");
        assertThat(root).isDirectory();
        try (Stream<Path> walk = Files.walk(root)) {
            walk.filter(p -> p.toString().endsWith(".java")).forEach(p -> {
                try {
                    String text = Files.readString(p);
                    if (text.contains(FORBIDDEN_ITEM) || text.contains(FORBIDDEN_STOCK)) {
                        hits.add(p.toString());
                    }
                } catch (IOException ex) {
                    throw new IllegalStateException(p.toString(), ex);
                }
            });
        }
        assertThat(hits)
                .as("etudes/src/main/java must not import item or stock packages")
                .isEmpty();
    }

    @Test
    void detector_isRedOnReintroducedImport() {
        String sneak = "import " + FORBIDDEN_ITEM + ".domain.model.Item;";
        assertThat(sneak.contains(FORBIDDEN_ITEM)).isTrue();
    }
}
