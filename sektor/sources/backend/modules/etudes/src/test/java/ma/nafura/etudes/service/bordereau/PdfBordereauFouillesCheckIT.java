
package ma.nafura.etudes.service.bordereau;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assumptions.assumeTrue;

import java.nio.file.Files;
import java.nio.file.Path;
import org.junit.jupiter.api.Test;

class PdfBordereauFouillesCheckIT {
    private static final Path SAMPLE = Path.of("C:/Users/yassiveco/Desktop/zenit/BDP-2-17.pdf");

    @Test
    void article_1_1_1_startsWithFouilles() throws Exception {
        assumeTrue(Files.isRegularFile(SAMPLE), "BDP-2-17.pdf absent");
        var parse = new PdfBordereauLayoutParser().parse(Files.readAllBytes(SAMPLE));
        var a111 = parse.articleCandidates().stream()
                .filter(a -> a.code() != null && a.code().replace(" ", "").equals("1-1-1"))
                .findFirst();
        assertThat(a111).isPresent();
        System.out.println("1-1-1=" + a111.get().libelle());
        assertThat(a111.get().libelle().toUpperCase()).contains("FOUILLES");
        assertThat(a111.get().libelle().toUpperCase()).contains("PUITS");
        assertThat(a111.get().libelle().toUpperCase()).doesNotStartWith("TRANCHE");
        var a112 = parse.articleCandidates().stream()
                .filter(a -> a.code() != null && a.code().replace(" ", "").equals("1-1-2"))
                .findFirst();
        assertThat(a112).isPresent();
        System.out.println("1-1-2=" + a112.get().libelle());
        assertThat(a112.get().libelle().toUpperCase()).contains("EVACUATION");
    }
}
