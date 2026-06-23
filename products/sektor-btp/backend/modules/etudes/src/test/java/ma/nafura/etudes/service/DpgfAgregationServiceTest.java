package ma.nafura.etudes.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.util.List;
import ma.nafura.etudes.api.dto.DpgfLotTotalDto;
import ma.nafura.etudes.domain.model.DpgfNoeud;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class DpgfAgregationServiceTest {

    private DpgfAgregationService service;

    @BeforeEach
    void setUp() {
        service = new DpgfAgregationService();
    }

    @Test
    void sumArticlesRollsUpNestedArticleTotals() {
        DpgfNoeud art1 = article("01.01.001", new BigDecimal("100.50"));
        DpgfNoeud art2 = article("01.01.002", new BigDecimal("49.50"));
        DpgfNoeud sousLot = container(DpgfNoeud.TYPE_SOUS_LOT, "01.01", "Sous-lot terrassement", art1, art2);
        DpgfNoeud lot = container(DpgfNoeud.TYPE_LOT, "01", "Lot terrassement", sousLot);

        BigDecimal total = service.sumArticles(List.of(lot));

        assertThat(total).isEqualByComparingTo(new BigDecimal("150.00"));
    }

    @Test
    void totauxByLotReturnsPerLotRollup() {
        DpgfNoeud lot1Art = article("01.01.001", new BigDecimal("80"));
        DpgfNoeud lot1Sous = container(DpgfNoeud.TYPE_SOUS_LOT, "01.01", "SL1", lot1Art);
        DpgfNoeud lot1 = container(DpgfNoeud.TYPE_LOT, "01", "Terrassement", lot1Sous);

        DpgfNoeud lot2Art1 = article("02.01.001", new BigDecimal("120.25"));
        DpgfNoeud lot2Art2 = article("02.01.002", new BigDecimal("29.75"));
        DpgfNoeud lot2Sous = container(DpgfNoeud.TYPE_SOUS_LOT, "02.01", "SL2", lot2Art1, lot2Art2);
        DpgfNoeud lot2 = container(DpgfNoeud.TYPE_LOT, "02", "Gros oeuvre", lot2Sous);

        List<DpgfLotTotalDto> totaux = service.totauxByLot(List.of(lot1, lot2));

        assertThat(totaux).hasSize(2);
        assertThat(totaux.get(0).code()).isEqualTo("01");
        assertThat(totaux.get(0).total()).isEqualByComparingTo(new BigDecimal("80.00"));
        assertThat(totaux.get(1).code()).isEqualTo("02");
        assertThat(totaux.get(1).total()).isEqualByComparingTo(new BigDecimal("150.00"));
    }

    @Test
    void sumArticlesIgnoresNonArticleNodeTotals() {
        DpgfNoeud art = article("01.01.001", new BigDecimal("50"));
        DpgfNoeud sousLot = container(DpgfNoeud.TYPE_SOUS_LOT, "01.01", "SL", art);
        sousLot.setTotal(new BigDecimal("999"));
        DpgfNoeud lot = container(DpgfNoeud.TYPE_LOT, "01", "Lot", sousLot);
        lot.setTotal(new BigDecimal("888"));

        assertThat(service.sumArticles(List.of(lot))).isEqualByComparingTo(new BigDecimal("50.00"));
    }

    private static DpgfNoeud article(String code, BigDecimal total) {
        return DpgfNoeud.builder()
                .type(DpgfNoeud.TYPE_ARTICLE)
                .code(code)
                .libelle("Article " + code)
                .total(total)
                .build();
    }

    private static DpgfNoeud container(String type, String code, String libelle, DpgfNoeud... enfants) {
        DpgfNoeud node = DpgfNoeud.builder()
                .type(type)
                .code(code)
                .libelle(libelle)
                .build();
        node.setEnfants(List.of(enfants));
        return node;
    }
}
