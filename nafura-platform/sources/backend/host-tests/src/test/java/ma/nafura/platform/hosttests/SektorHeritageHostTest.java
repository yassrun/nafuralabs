package ma.nafura.platform.hosttests;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Stream;
import org.junit.jupiter.api.Test;

/**
 * Spec 04 — aucune classe de la plateforme ne publie {@code ErpEntityTransitionEvent}
 * (héritage Sektor, adressage par rôle). Sektor peut encore le faire.
 */
class SektorHeritageHostTest {

    private static final Set<String> ALLOWED = Set.of(
            "ErpEntityTransitionEvent.java",
            "ErpNotificationPublisher.java",
            "ErpDomainNotificationListener.java");

    @Test
    void platformBackendDoesNotPublishErpEntityTransitionEvent() throws IOException {
        Path backend = backendRoot();
        assertThat(backend.resolve("core/framework").toFile()).exists();

        List<String> offenders = new ArrayList<>();
        try (Stream<Path> paths = Files.walk(backend)) {
            paths.filter(path -> path.toString().endsWith(".java"))
                    .filter(path -> !path.toString().contains(Path.of("build").toString()))
                    .filter(path -> !path.toString().contains(Path.of("host-tests").toString()))
                    .forEach(path -> {
                        String name = path.getFileName().toString();
                        if (ALLOWED.contains(name)) {
                            return;
                        }
                        String source;
                        try {
                            source = Files.readString(path);
                        } catch (IOException e) {
                            throw new RuntimeException(path.toString(), e);
                        }
                        if (source.contains("ErpEntityTransitionEvent") || source.contains("ErpNotificationPublisher")) {
                            offenders.add(backend.relativize(path).toString().replace('\\', '/'));
                        }
                    });
        }

        assertThat(offenders)
                .as("publier ErpEntityTransitionEvent est interdit hors héritage Sektor — utiliser notify du cycle de vie JSON")
                .isEmpty();
    }

    private static Path backendRoot() {
        Path cwd = Path.of("").toAbsolutePath();
        if (cwd.getFileName().toString().equals("host-tests") && Files.isDirectory(cwd.resolve("../core"))) {
            return cwd.getParent().normalize();
        }
        Path fromProperty = Path.of(System.getProperty("user.dir")).toAbsolutePath();
        if (fromProperty.getFileName().toString().equals("host-tests")) {
            return fromProperty.getParent().normalize();
        }
        Path candidate = fromProperty.resolve("nafura-platform/sources/backend");
        if (Files.isDirectory(candidate)) {
            return candidate.normalize();
        }
        throw new IllegalStateException("Cannot locate nafura-platform/sources/backend from " + cwd);
    }
}
