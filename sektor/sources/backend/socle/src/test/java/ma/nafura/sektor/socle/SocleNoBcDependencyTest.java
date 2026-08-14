package ma.nafura.sektor.socle;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.regex.Pattern;
import org.junit.jupiter.api.Test;

/**
 * SEKTOR-101 — socle ne reprend pas de jar BC. Rouge si on recâble
 * {@code project(':sektor:catalogue|finance|chantiers|rh')}.
 */
class SocleNoBcDependencyTest {

    private static final Pattern BC_PROJECT = Pattern.compile(
            "project\\s*\\(\\s*['\"]:sektor:(catalogue|finance|chantiers|rh)['\"]\\s*\\)");

    @Test
    void buildGradle_hasNoSektorBcProject() throws Exception {
        Path gradle = Path.of("build.gradle");
        assertThat(gradle).exists();
        String text = Files.readString(gradle);
        assertThat(BC_PROJECT.matcher(text).find())
                .as("socle/build.gradle must not depend on a Sektor BC module")
                .isFalse();
    }

    @Test
    void detector_isRedOnReintroducedBcDep() {
        String sneak = "implementation project(':sektor:catalogue')";
        assertThat(BC_PROJECT.matcher(sneak).find()).isTrue();
    }
}
