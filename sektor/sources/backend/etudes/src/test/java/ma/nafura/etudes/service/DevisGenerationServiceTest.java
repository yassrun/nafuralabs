package ma.nafura.etudes.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import ma.nafura.etudes.domain.model.DevisLigne;
import ma.nafura.etudes.domain.model.Dpgf;
import ma.nafura.etudes.domain.model.DpgfNoeud;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class DevisGenerationServiceTest {

    private DevisGenerationService service;
    private static final UUID TENANT_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");

    @BeforeEach
    void setUp() {
        service = new DevisGenerationService();
    }

    @Test
    void toDevisLignesProducesChapitreAndOuvrageLines() {
        DpgfNoeud article = DpgfNoeud.builder()
                .type(DpgfNoeud.TYPE_ARTICLE)
                .code("01.01.001")
                .libelle("Pose")
                .articleId(UUID.fromString("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"))
                .quantite(new BigDecimal("2"))
                .unite("m²")
                .prixUnitaire(new BigDecimal("15"))
                .total(new BigDecimal("30"))
                .build();
        DpgfNoeud sousLot = container(DpgfNoeud.TYPE_SOUS_LOT, "01.01", "SL", article);
        DpgfNoeud lot = container(DpgfNoeud.TYPE_LOT, "01", "Lot 1", sousLot);

        Dpgf dpgf = Dpgf.builder()
                .numero("DPGF-2026-001")
                .projetNom("Projet")
                .hierarchie(List.of(lot))
                .build();

        List<DevisLigne> lignes = service.toDevisLignes(
                dpgf, UUID.fromString("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"), TENANT_ID);

        assertThat(lignes).hasSize(2);
        assertThat(lignes.get(0).getType()).isEqualTo(DevisLigne.TYPE_CHAPITRE);
        assertThat(lignes.get(0).getDesignation()).contains("DPGF-2026-001").contains("Projet");

        DevisLigne ouvrage = lignes.get(1);
        assertThat(ouvrage.getType()).isEqualTo(DevisLigne.TYPE_OUVRAGE);
        assertThat(ouvrage.getParentLigneId()).isEqualTo(lignes.get(0).getId());
        assertThat(ouvrage.getDesignation()).isEqualTo("Lot 1 — SL — Pose");
        assertThat(ouvrage.getTotalHt()).isEqualByComparingTo(new BigDecimal("30.00"));
        assertThat(ouvrage.getCode()).isEqualTo("01.01.001");
    }

    @Test
    void toDevisLignesComputesTotalWhenArticleTotalMissing() {
        DpgfNoeud article = DpgfNoeud.builder()
                .type(DpgfNoeud.TYPE_ARTICLE)
                .code("02.01.001")
                .libelle("Dalle")
                .quantite(new BigDecimal("10"))
                .prixUnitaire(new BigDecimal("8.5"))
                .build();
        DpgfNoeud lot = container(DpgfNoeud.TYPE_LOT, "02", "Gros oeuvre", article);

        Dpgf dpgf = Dpgf.builder()
                .numero("DPGF-2026-002")
                .hierarchie(List.of(lot))
                .build();

        List<DevisLigne> lignes = service.toDevisLignes(dpgf, null, TENANT_ID);

        assertThat(lignes.stream().filter(l -> DevisLigne.TYPE_OUVRAGE.equals(l.getType())))
                .singleElement()
                .extracting(DevisLigne::getTotalHt)
                .isEqualTo(new BigDecimal("85.00"));
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
