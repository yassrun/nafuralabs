package ma.nafura.host.seed;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.List;

import ma.nafura.host.seed.SeedDataset.Kind;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.ByteArrayResource;
import tools.jackson.databind.json.JsonMapper;

class SeedCatalogTest {

    private static SeedDataset dataset(String id, Kind kind, String... after) {
        return new SeedDataset(id, kind, List.of(after), List.of(), id, id);
    }

    @Test
    void referenceDataComesFirstThenDependenciesThenIds() {
        List<SeedDataset> ordered = SeedCatalog.order(List.of(
                dataset("b.demo", Kind.DEMO),
                dataset("a.demo", Kind.DEMO, "z.reference"),
                dataset("z.reference", Kind.REFERENCE, "c.reference"),
                dataset("c.reference", Kind.REFERENCE)));

        assertThat(ordered).extracting(SeedDataset::id).containsExactly("c.reference", "z.reference", "a.demo", "b.demo");
    }

    @Test
    void rejectsDuplicatesUnknownDependenciesCyclesAndReferenceOnDemo() {
        assertThatThrownBy(() -> SeedCatalog.order(List.of(dataset("a.x", Kind.DEMO), dataset("a.x", Kind.DEMO))))
                .hasMessageContaining("declared twice");
        assertThatThrownBy(() -> SeedCatalog.order(List.of(dataset("a.x", Kind.DEMO, "a.nope"))))
                .hasMessageContaining("unknown seed a.nope");
        assertThatThrownBy(() -> SeedCatalog.order(List.of(dataset("a.x", Kind.DEMO, "a.y"), dataset("a.y", Kind.DEMO, "a.x"))))
                .hasMessageContaining("cycle");
        assertThatThrownBy(() -> SeedCatalog.order(List.of(dataset("a.ref", Kind.REFERENCE, "a.demo"), dataset("a.demo", Kind.DEMO))))
                .hasMessageContaining("cannot depend on demo");
    }

    @Test
    void readsAFileStrictly() {
        JsonMapper mapper = JsonMapper.builder().build();
        SeedDataset read = SeedCatalog.read(new ByteArrayResource("""
                { "id": "demo.categories", "kind": "reference",
                  "entities": [ { "entity": "DemoCategory", "key": ["code"], "records": [ { "code": "IT" } ] } ] }
                """.getBytes()), mapper.rebuild().enable(tools.jackson.databind.DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES).build());

        assertThat(read.kind()).isEqualTo(Kind.REFERENCE);
        assertThat(read.checksum()).hasSize(64);
        assertThatThrownBy(() -> SeedCatalog.read(new ByteArrayResource("""
                { "id": "demo.categories", "kind": "sample", "entities": [] }
                """.getBytes()), mapper)).hasMessageContaining("kind must be");
        assertThatThrownBy(() -> SeedCatalog.read(new ByteArrayResource("""
                { "id": "demo.categories", "kind": "demo", "entities": [ { "entity": "DemoCategory", "records": [] } ] }
                """.getBytes()), mapper)).hasMessageContaining("non-empty \"key\"");
    }
}
