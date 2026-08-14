package ma.nafura.catalogue.domain;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Locale;
import java.util.stream.Stream;
import org.junit.jupiter.api.Test;

/**
 * AC L14 : aucune table catalog_* ne porte tenant_id ; aucune FK sortante hors catalog_*.
 * Parse les changelogs SQL du module — échoue le build si violé.
 */
class CatalogNoTenantFkContractTest {

    @Test
    void changelogs_catalog_sans_tenant_ni_fk_externe() throws IOException {
        Path root = Path.of("src/main/resources/db/changelog");
        assertThat(Files.isDirectory(root)).as("changelog dir").isTrue();

        try (Stream<Path> paths = Files.walk(root)) {
            paths.filter(p -> p.toString().endsWith(".sql")).forEach(this::assertSqlSafe);
        }
    }

    private void assertSqlSafe(Path sqlFile) {
        String sql;
        try {
            sql = Files.readString(sqlFile).toLowerCase(Locale.ROOT);
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
        String name = sqlFile.getFileName().toString();

        // permissions data file may touch role_permission — skip FK/tenant rules for data/
        if (sqlFile.toString().replace('\\', '/').contains("/data/")) {
            return;
        }
        // item_match est volontairement tenant (L15) — hors invariant catalog_*
        if (name.contains("item_match")) {
            assertThat(sql).as("%s doit porter tenant_id", name).contains("tenant_id");
            assertThat(sql)
                    .as("%s ne doit pas FK vers table tenant métier", name)
                    .doesNotContain("references items")
                    .doesNotContain("references catalog_");
            return;
        }

        assertThat(sql)
                .as("%s ne doit pas déclarer tenant_id", name)
                .doesNotContain("tenant_id");

        int idx = 0;
        while ((idx = sql.indexOf("references ", idx)) >= 0) {
            int start = idx + "references ".length();
            int end = start;
            while (end < sql.length() && (Character.isLetterOrDigit(sql.charAt(end)) || sql.charAt(end) == '_')) {
                end++;
            }
            String target = sql.substring(start, end).trim();
            assertThat(target)
                    .as("%s FK vers %s — seules tables catalog_* autorisées", name, target)
                    .startsWith("catalog_");
            idx = end;
        }
    }
}
