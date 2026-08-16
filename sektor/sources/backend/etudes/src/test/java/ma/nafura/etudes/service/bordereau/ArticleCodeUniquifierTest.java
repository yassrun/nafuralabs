package ma.nafura.etudes.service.bordereau;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.util.List;
import ma.nafura.etudes.api.request.ImportNoeudDto;
import org.junit.jupiter.api.Test;

class ArticleCodeUniquifierTest {

    @Test
    void suffixeLesVariantesQuiPartagentLeMemeCode() {
        ImportNoeudDto lot = lot("4", List.of(
                article("4.4", "COMPTEUR Magasins"),
                article("4.4", "COMPTEUR sanitaire"),
                article("4.6", "PPR 20"),
                article("4.6", "PPR 25"),
                article("4.6", "PPR 32"),
                article("4.5", "Unique")));

        ArticleCodeUniquifier.uniquify(List.of(lot));

        List<String> codes = lot.getEnfants().stream().map(ImportNoeudDto::getCode).toList();
        assertThat(codes).containsExactly("4.4a", "4.4b", "4.6a", "4.6b", "4.6c", "4.5");
    }

    @Test
    void eviteUneCollisionAvecUnSuffixeDejaPris() {
        ImportNoeudDto lot = lot("4", List.of(
                article("4.4", "A"),
                article("4.4", "B"),
                article("4.4a", "Deja la")));

        ArticleCodeUniquifier.uniquify(List.of(lot));

        assertThat(lot.getEnfants()).extracting(ImportNoeudDto::getCode)
                .containsExactly("4.4b", "4.4c", "4.4a");
    }

    @Test
    void laisseUnCodeUniqueIntact() {
        ImportNoeudDto lot = lot("1", List.of(article("1", "Seul"), article("2", "Autre")));

        ArticleCodeUniquifier.uniquify(List.of(lot));

        assertThat(lot.getEnfants()).extracting(ImportNoeudDto::getCode).containsExactly("1", "2");
    }

    private static ImportNoeudDto lot(String code, List<ImportNoeudDto> enfants) {
        ImportNoeudDto lot = new ImportNoeudDto();
        lot.setType("LOT");
        lot.setCode(code);
        lot.setLibelle("Lot");
        lot.setEnfants(enfants);
        return lot;
    }

    private static ImportNoeudDto article(String code, String libelle) {
        ImportNoeudDto dto = new ImportNoeudDto();
        dto.setType("ARTICLE");
        dto.setCode(code);
        dto.setLibelle(libelle);
        dto.setUnite("U");
        dto.setQuantite(BigDecimal.ONE);
        return dto;
    }
}
