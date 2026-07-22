package ma.nafura.etudes.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.util.List;
import ma.nafura.etudes.api.request.ImportNoeudDto;
import org.junit.jupiter.api.Test;

class BordereauImportServiceCompterTest {

    @Test
    void compterArticlesInclutLesNonExploitables() {
        ImportNoeudDto lot = new ImportNoeudDto();
        lot.setType("LOT");
        lot.setCode("1");
        lot.setLibelle("Lot");

        ImportNoeudDto ok = article("A1", "m2", new BigDecimal("2"));
        ImportNoeudDto ignored = article("A2", null, null);
        lot.setEnfants(List.of(ok, ignored));

        assertThat(BordereauImportService.compterArticles(List.of(lot))).isEqualTo(2);
        assertThat(DpgfService.articleExploitable(ok)).isTrue();
        assertThat(DpgfService.articleExploitable(ignored)).isFalse();
    }

    private static ImportNoeudDto article(String code, String unite, BigDecimal quantite) {
        ImportNoeudDto dto = new ImportNoeudDto();
        dto.setType("ARTICLE");
        dto.setCode(code);
        dto.setLibelle(code);
        dto.setUnite(unite);
        dto.setQuantite(quantite);
        return dto;
    }
}
