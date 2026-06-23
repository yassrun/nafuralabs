package ma.nafura.etudes.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import ma.nafura.etudes.domain.model.DpgfNoeud;
import ma.nafura.etudes.repository.DpgfNoeudRepository;
import ma.nafura.etudes.repository.DpgfRepository;
import ma.nafura.etudes.repository.OuvrageRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class DpgfServiceBuildTreeTest {

    private DpgfService service;

    @BeforeEach
    void setUp() {
        service = new DpgfService(
                mock(DpgfRepository.class),
                mock(DpgfNoeudRepository.class),
                mock(MetreService.class),
                mock(OuvrageRepository.class),
                new DpgfAgregationService());
    }

    @Test
    void buildTreeKeepsChildrenWhenParentOrdreIsHigherThanChildOrdre() {
        DpgfNoeud lot1 = lot("1", 1);
        DpgfNoeud lot2 = lot("2", 2);
        DpgfNoeud sousLot2 = sousLot("2.1", lot2.getId(), 1);
        DpgfNoeud article2 = article("2.1", sousLot2.getId(), new BigDecimal("432000"));

        List<DpgfNoeud> roots = service.buildTree(List.of(sousLot2, article2, lot2, lot1));

        assertThat(roots).hasSize(2);
        DpgfNoeud builtLot2 = roots.stream().filter(n -> "2".equals(n.getCode())).findFirst().orElseThrow();
        assertThat(builtLot2.getEnfants()).hasSize(1);
        assertThat(builtLot2.getEnfants().get(0).getEnfants()).hasSize(1);
        assertThat(builtLot2.getEnfants().get(0).getEnfants().get(0).getTotal())
                .isEqualByComparingTo(new BigDecimal("432000"));
    }

    private static DpgfNoeud lot(String code, int ordre) {
        return DpgfNoeud.builder()
                .id(UUID.randomUUID())
                .type(DpgfNoeud.TYPE_LOT)
                .code(code)
                .libelle("Lot " + code)
                .ordre(ordre)
                .build();
    }

    private static DpgfNoeud sousLot(String code, UUID parentId, int ordre) {
        return DpgfNoeud.builder()
                .id(UUID.randomUUID())
                .parentId(parentId)
                .type(DpgfNoeud.TYPE_SOUS_LOT)
                .code(code)
                .libelle("Sous-lot " + code)
                .ordre(ordre)
                .build();
    }

    private static DpgfNoeud article(String code, UUID parentId, BigDecimal total) {
        return DpgfNoeud.builder()
                .id(UUID.randomUUID())
                .parentId(parentId)
                .type(DpgfNoeud.TYPE_ARTICLE)
                .code(code)
                .libelle("Article " + code)
                .total(total)
                .ordre(1)
                .build();
    }
}
