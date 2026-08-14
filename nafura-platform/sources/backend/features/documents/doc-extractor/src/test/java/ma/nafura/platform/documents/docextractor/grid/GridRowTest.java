package ma.nafura.platform.documents.docextractor.grid;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import org.junit.jupiter.api.Test;

class GridRowTest {

    @Test
    void cell_returnsEmptyOutsideRange() {
        GridRow row = GridRow.of("p1", 1, List.of("A", "B"));
        assertThat(row.cell(0)).isEqualTo("A");
        assertThat(row.cell(1)).isEqualTo("B");
        assertThat(row.cell(2)).isEmpty();
        assertThat(row.cell(-1)).isEmpty();
    }

    @Test
    void firstFilledColumn_skipsBlanks() {
        GridRow row = GridRow.of("p1", 1, List.of("", "  ", "LOT"));
        assertThat(row.firstFilledColumn()).isEqualTo(2);
    }
}
