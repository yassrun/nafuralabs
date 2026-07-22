package ma.nafura.etudes.service.bordereau;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.util.List;
import java.util.Set;
import ma.nafura.etudes.api.request.ImportNoeudDto;
import ma.nafura.etudes.api.request.ImportTreeRequest;
import ma.nafura.etudes.domain.model.DpgfNoeud;
import org.junit.jupiter.api.Test;

class BordereauHybridAssemblerTest {

    private final BordereauHybridAssembler assembler = new BordereauHybridAssembler();
    private final ObjectMapper mapper = new ObjectMapper();

    @Test
    void assemble_usesLocalValuesAndLlmHierarchy() throws Exception {
        BordereauParseResult parse = sampleParse();
        var classification = mapper.readTree("""
                {
                  "lots": [
                    {
                      "code": "1",
                      "libelle": "Terrassement",
                      "children": [
                        {
                          "code": "1-1",
                          "libelle": "Fondations",
                          "articleRowIds": ["r0", "r1"]
                        }
                      ]
                    }
                  ]
                }
                """);

        ImportTreeRequest tree = assembler.assemble(parse, classification);
        assertThat(tree.getArbre()).hasSize(1);
        ImportNoeudDto lot = tree.getArbre().get(0);
        assertThat(lot.getType()).isEqualTo(DpgfNoeud.TYPE_LOT);
        assertThat(lot.getEnfants()).hasSize(1);
        ImportNoeudDto sous = lot.getEnfants().get(0);
        assertThat(sous.getType()).isEqualTo(DpgfNoeud.TYPE_SOUS_LOT);
        assertThat(sous.getEnfants()).hasSize(2);
        assertThat(sous.getEnfants().get(0).getCode()).isEqualTo("1-1-1");
        assertThat(sous.getEnfants().get(0).getUnite()).isEqualTo("M3");
        assertThat(sous.getEnfants().get(0).getQuantite()).isEqualByComparingTo("10");
        assertThat(sous.getEnfants().get(1).getLibelle()).contains("REGARD");
    }

    @Test
    void assemble_putsUnassignedArticlesInOrphanLot() throws Exception {
        BordereauParseResult parse = sampleParse();
        var classification = mapper.readTree("""
                {
                  "lots": [
                    {
                      "libelle": "Lot A",
                      "articleRowIds": ["r0"]
                    }
                  ]
                }
                """);

        ImportTreeRequest tree = assembler.assemble(parse, classification);
        assertThat(tree.getArbre()).hasSize(2);
        ImportNoeudDto orphan = tree.getArbre().get(1);
        assertThat(orphan.getLibelle()).isEqualTo("A classer");
        assertThat(orphan.getEnfants()).hasSize(1);
        assertThat(orphan.getEnfants().get(0).getCode()).isEqualTo("1-2-1");
    }

    @Test
    void assembleLocalOnly_buildsTreeFromDetectedGroups() {
        ImportTreeRequest tree = assembler.assembleLocalOnly(sampleParse());
        assertThat(tree.getArbre()).isNotEmpty();
        assertThat(countArticles(tree.getArbre())).isEqualTo(2);
    }

    @Test
    void buildClassifierPrompt_listsRowIds() {
        String prompt = assembler.buildClassifierPrompt(sampleParse());
        assertThat(prompt).contains("r0").contains("r1").contains("GROUPES").contains("ARTICLES");
    }

    private static BordereauParseResult sampleParse() {
        List<BordereauRowCandidate> rows = List.of(
                new BordereauRowCandidate(
                        "g0", 1, 0, "1", "SOUS LOT N° 1", null, null,
                        BordereauRowCandidate.Kind.SOUS_LOT, 0.8, "SOUS LOT"),
                new BordereauRowCandidate(
                        "r0", 1, 1, "1-1-1", "FOUILLES EN PUITS", "M3", new BigDecimal("10"),
                        BordereauRowCandidate.Kind.ARTICLE, 0.9, "1-1-1 FOUILLES"),
                new BordereauRowCandidate(
                        "r1", 1, 2, "1-2-1", "REGARD EN BETON", "U", new BigDecimal("5"),
                        BordereauRowCandidate.Kind.ARTICLE, 0.9, "1-2-1 REGARD"));
        return new BordereauParseResult(
                1, 500, rows, Set.of(1), BordereauParseResult.Quality.USABLE, null);
    }

    private static int countArticles(List<ImportNoeudDto> nodes) {
        int n = 0;
        for (ImportNoeudDto node : nodes) {
            if (DpgfNoeud.TYPE_ARTICLE.equals(node.getType())) {
                n++;
            }
            if (node.getEnfants() != null) {
                n += countArticles(node.getEnfants());
            }
        }
        return n;
    }
}
