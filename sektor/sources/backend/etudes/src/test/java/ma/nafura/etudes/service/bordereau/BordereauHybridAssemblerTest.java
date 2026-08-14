package ma.nafura.etudes.service.bordereau;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.util.List;
import java.util.Set;
import ma.nafura.etudes.api.request.ImportNoeudDto;
import ma.nafura.etudes.api.request.ImportTreeRequest;
import ma.nafura.etudes.domain.dpgf.DpgfNoeud;
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
    void assembleLocalOnly_keepsUncodedSousLotBanners() {
        // Villa Kenitra : LOT → « MENUISERIE BOIS » → articles → « Lot Menuiserie métallique »
        List<BordereauRowCandidate> rows = List.of(
                new BordereauRowCandidate(
                        "lot1", 1, 0, "1", "LOT 1 : MENUISERIE BOIS, ALUMINIUM ET METALLIQUE",
                        null, null, BordereauRowCandidate.Kind.LOT, 0.95, "lot"),
                new BordereauRowCandidate(
                        "sl1", 1, 1, null, "MENUISERIE BOIS",
                        null, null, BordereauRowCandidate.Kind.SOUS_LOT, 0.9, "bois"),
                new BordereauRowCandidate(
                        "a1", 1, 2, "1.1", "Portes isoplanes", "U", new BigDecimal("6"),
                        BordereauRowCandidate.Kind.ARTICLE, 0.95, "a1"),
                new BordereauRowCandidate(
                        "a7", 1, 3, "1.7", "Pld3", "U", new BigDecimal("1"),
                        BordereauRowCandidate.Kind.ARTICLE, 0.95, "a7"),
                new BordereauRowCandidate(
                        "sl2", 1, 4, "1.2", "Lot Menuiserie métallique",
                        null, null, BordereauRowCandidate.Kind.SOUS_LOT, 0.9, "metal"),
                new BordereauRowCandidate(
                        "am1", 1, 5, "1.2", "Escalier métallique", "U", new BigDecimal("1"),
                        BordereauRowCandidate.Kind.ARTICLE, 0.95, "am1"));
        BordereauParseResult parse = new BordereauParseResult(
                1, 400, rows, Set.of(1), BordereauParseResult.Quality.USABLE, null);

        ImportTreeRequest tree = assembler.assembleLocalOnly(parse);
        assertThat(tree.getArbre()).hasSize(1);
        ImportNoeudDto lot = tree.getArbre().get(0);
        assertThat(lot.getLibelle()).contains("MENUISERIE");
        assertThat(lot.getEnfants())
                .filteredOn(n -> DpgfNoeud.TYPE_SOUS_LOT.equals(n.getType()))
                .hasSize(2);
        assertThat(lot.getEnfants().get(0).getLibelle()).containsIgnoringCase("BOIS");
        assertThat(lot.getEnfants().get(0).getEnfants())
                .extracting(ImportNoeudDto::getCode)
                .containsExactly("1.1", "1.7");
        assertThat(lot.getEnfants().get(1).getLibelle()).containsIgnoringCase("métallique");
        assertThat(lot.getEnfants().get(1).getEnfants())
                .extracting(ImportNoeudDto::getCode)
                .containsExactly("1.2");
    }

    @Test
    void assembleLocalOnly_promotesSousLotToRootLotByCodePrefix() {
        ImportTreeRequest tree = assembler.assembleLocalOnly(sampleParse());
        assertThat(tree.getArbre()).hasSize(1);
        assertThat(tree.getArbre().get(0).getType()).isEqualTo(DpgfNoeud.TYPE_LOT);
        assertThat(tree.getArbre().get(0).getLibelle()).containsIgnoringCase("SOUS LOT");
        assertThat(countArticles(tree.getArbre())).isEqualTo(2);
        // No market title as root
        assertThat(tree.getArbre().get(0).getLibelle()).doesNotContain("PLATEFORME");
    }

    @Test
    void assembleLocalOnly_splitsMultipleSousLotsByCodePrefix() {
        List<BordereauRowCandidate> rows = List.of(
                new BordereauRowCandidate(
                        "g1", 1, 0, null, "SOUS LOT N° 1: TERRASSEMENT", null, null,
                        BordereauRowCandidate.Kind.SOUS_LOT, 0.9, "sl1"),
                new BordereauRowCandidate(
                        "r0", 1, 1, "1-1-1", "FOUILLES", "M3", new BigDecimal("10"),
                        BordereauRowCandidate.Kind.ARTICLE, 0.9, "a"),
                new BordereauRowCandidate(
                        "g2", 2, 2, null, "SOUS LOT N° 2: CHARPENTE", null, null,
                        BordereauRowCandidate.Kind.SOUS_LOT, 0.9, "sl2"),
                new BordereauRowCandidate(
                        "r1", 2, 3, "2.2.1", "STRUCTURE", "KG", new BigDecimal("100"),
                        BordereauRowCandidate.Kind.ARTICLE, 0.9, "b"),
                new BordereauRowCandidate(
                        "noise", 1, 4, null,
                        "TRAVAUX DE CONSTRUCTION DE LA PLATEFORME AGRO RABAT-LOT-AMENAGEMENTS",
                        null, null, BordereauRowCandidate.Kind.LOT, 0.5, "noise"));
        BordereauParseResult parse = new BordereauParseResult(
                2, 400, rows, Set.of(1, 2), BordereauParseResult.Quality.USABLE, null);

        ImportTreeRequest tree = assembler.assembleLocalOnly(parse);
        assertThat(tree.getArbre()).hasSize(2);
        assertThat(tree.getArbre())
                .noneMatch(n -> n.getLibelle() != null && n.getLibelle().contains("PLATEFORME"));
        assertThat(tree.getArbre().get(0).getLibelle()).contains("TERRASSEMENT");
        assertThat(tree.getArbre().get(1).getLibelle()).contains("CHARPENTE");
        assertThat(countArticles(tree.getArbre().get(0).getEnfants())).isEqualTo(1);
        assertThat(countArticles(tree.getArbre().get(1).getEnfants())).isEqualTo(1);
    }

    @Test
    void assembleLocalOnly_doesNotLetSubsectionRenameLot() {
        List<BordereauRowCandidate> rows = List.of(
                new BordereauRowCandidate(
                        "g0", 1, 0, "1", "TERRASSEMENT - GROS-ŒUVRE", null, null,
                        BordereauRowCandidate.Kind.SECTION, 0.9, "lot1"),
                new BordereauRowCandidate(
                        "g1", 1, 1, "1-1", "TRAVAUX EN TERRASSEMENTS ET FONDATION", null, null,
                        BordereauRowCandidate.Kind.SECTION, 0.8, "s1"),
                new BordereauRowCandidate(
                        "g5", 2, 2, "1-05", "MAÇONNERIES ET CLOISONNEMENTS", null, null,
                        BordereauRowCandidate.Kind.SOUS_LOT, 0.8, "s5"),
                new BordereauRowCandidate(
                        "r0", 1, 3, "1-1-1", "FOUILLES", "M3", new BigDecimal("10"),
                        BordereauRowCandidate.Kind.ARTICLE, 0.9, "a"));
        BordereauParseResult parse = new BordereauParseResult(
                2, 400, rows, Set.of(1, 2), BordereauParseResult.Quality.USABLE, null);

        ImportTreeRequest tree = assembler.assembleLocalOnly(parse);
        assertThat(tree.getArbre()).hasSize(1);
        assertThat(tree.getArbre().get(0).getLibelle()).containsIgnoringCase("TERRASSEMENT");
        assertThat(tree.getArbre().get(0).getLibelle()).containsIgnoringCase("GROS");
        assertThat(tree.getArbre().get(0).getLibelle()).doesNotContain("MAÇONNERIES");
    }

    @Test
    void assembleLocalOnly_doesNotLetAccessorySectionRenameLot() {
        List<BordereauRowCandidate> rows = List.of(
                new BordereauRowCandidate(
                        "g0", 1, 0, "1", "TERRASSEMENT - GROS-ŒUVRE", null, null,
                        BordereauRowCandidate.Kind.SECTION, 0.9, "lot1"),
                new BordereauRowCandidate(
                        "gBad", 9, 1, "1", "PORTE SAVON LIQUIDE", null, null,
                        BordereauRowCandidate.Kind.SECTION, 0.5, "bad"),
                new BordereauRowCandidate(
                        "g5", 2, 2, "1-05", "MAÇONNERIES ET CLOISONNEMENTS", null, null,
                        BordereauRowCandidate.Kind.SOUS_LOT, 0.8, "s5"),
                new BordereauRowCandidate(
                        "r0", 1, 3, "1-1-1", "FOUILLES", "M3", new BigDecimal("10"),
                        BordereauRowCandidate.Kind.ARTICLE, 0.9, "a"),
                new BordereauRowCandidate(
                        "r1", 1, 4, "1-1-2", "REMBLAI", "M3", new BigDecimal("5"),
                        BordereauRowCandidate.Kind.ARTICLE, 0.9, "b"),
                new BordereauRowCandidate(
                        "r2", 1, 5, "1-5-1", "MUR", "M2", new BigDecimal("50"),
                        BordereauRowCandidate.Kind.ARTICLE, 0.9, "c"));
        BordereauParseResult parse = new BordereauParseResult(
                9, 400, rows, Set.of(1, 2, 9), BordereauParseResult.Quality.USABLE, null);

        ImportTreeRequest tree = assembler.assembleLocalOnly(parse);
        assertThat(tree.getArbre().get(0).getLibelle()).containsIgnoringCase("TERRASSEMENT");
        assertThat(tree.getArbre().get(0).getLibelle()).containsIgnoringCase("GROS");
        assertThat(tree.getArbre().get(0).getLibelle()).doesNotContain("SAVON");
        assertThat(tree.getArbre().get(0).getLibelle()).doesNotContain("MAÇONNERIES");
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
