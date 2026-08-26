package ma.nafura.chantiers;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.regex.Pattern;
import java.util.stream.Stream;
import org.junit.jupiter.api.Test;

/**
 * SEKTOR-192 (continuite-etude-devis-chantier) — la frontière de BC est préservée : le cœur
 * Chantiers ne dépend pas du module Études/Devis. La conversion transporte un DTO/versionné
 * explicite (le port {@code ChainageAvalPort} vit côté etudes, son adapter dans app) ; jamais
 * un import du domaine Études dans le domaine Chantiers.
 */
class ChantiersNoEtudesDependencyTest {

    private static final Pattern ETUDES_PROJECT = Pattern.compile(
            "project\\s*\\(\\s*['\"]\\s*:sektor:etudes\\s*['\"]\\s*\\)");

    @Test
    void buildGradle_hasNoSektorEtudesProject() throws Exception {
        Path gradle = Path.of("build.gradle");
        assertThat(gradle).exists();
        String text = Files.readString(gradle);
        assertThat(ETUDES_PROJECT.matcher(text).find())
                .as("chantiers/build.gradle must not depend on the etudes module")
                .isFalse();
    }

    @Test
    void mainJava_hasNoEtudesImport() throws Exception {
        Path main = Path.of("src/main/java");
        assertThat(main).exists();
        try (Stream<Path> files = Files.walk(main)) {
            long importsEtudes = files
                    .filter(p -> p.toString().endsWith(".java"))
                    .filter(p -> {
                        try {
                            return Files.readString(p).contains("import ma.nafura.etudes");
                        } catch (Exception e) {
                            return false;
                        }
                    })
                    .count();
            assertThat(importsEtudes)
                    .as("no ma.nafura.etudes import may exist in the chantiers BC core")
                    .isZero();
        }
    }

    @Test
    void detector_isRedOnReintroducedEtudesProject() {
        String sneak = "implementation project(':sektor:etudes')";
        assertThat(ETUDES_PROJECT.matcher(sneak).find()).isTrue();
    }
}
