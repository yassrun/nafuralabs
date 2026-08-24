package ma.nafura.chantiers.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.List;
import ma.nafura.chantiers.api.dto.BudgetArbreDto;
import ma.nafura.chantiers.api.dto.BudgetChantierDto;
import ma.nafura.chantiers.api.request.BudgetChantierUpsertDto;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/** AC-8 — plus d'agrégat stocké : la vue par rubrique se calcule, l'écriture est refusée. */
@ExtendWith(MockitoExtension.class)
class BudgetChantierServiceTest {

    @Mock private BudgetArbreService arbreService;

    @InjectMocks private BudgetChantierService service;

    /** Toute tentative d'écrire un budget par rubrique au chantier est refusée. */
    @Test
    void ecritureDunBudgetParRubriqueAuChantier_refusee() {
        assertThatThrownBy(() -> service.upsert("ch-1", new BudgetChantierUpsertDto()))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("agregat_non_stocke");
    }

    /** La lecture par rubrique reste offerte — dérivée de l'arbre, jamais lue dans une table. */
    @Test
    void lectureParRubrique_dériveeDeLArbre() {
        when(arbreService.lireArbre("ch-1")).thenReturn(BudgetArbreDto.builder()
                .chantierId("ch-1")
                .code("CH-2026-001")
                .name("Résidence")
                .client("MOA")
                .lots(List.of())
                .totaux(BudgetArbreDto.TotauxDto.builder()
                        .venduHt(new BigDecimal("15000.00"))
                        .deboursePrevuHt(new BigDecimal("9000.00"))
                        .debourseReviseHt(new BigDecimal("9500.00"))
                        .debourseReelHt(new BigDecimal("4000.00"))
                        .build())
                .rubriques(List.of(BudgetArbreDto.RubriqueTotalDto.builder()
                        .rubrique("MATIERE")
                        .label("Matière")
                        .prevuHt(new BigDecimal("9000.00"))
                        .reviseHt(new BigDecimal("9500.00"))
                        .reelHt(new BigDecimal("4000.00"))
                        .ecartHt(new BigDecimal("5500.00"))
                        .build()))
                .build());

        BudgetChantierDto dto = service.getByChantierId("ch-1");

        assertThat(dto.getPrevisionnelHt()).isEqualByComparingTo("9000.00");
        assertThat(dto.getReviseHt()).isEqualByComparingTo("9500.00");
        assertThat(dto.getRealiseHt()).isEqualByComparingTo("4000.00");
        // L'engagé vient d'Achats : personne ne l'alimente ici, il vaut zéro et le dit.
        assertThat(dto.getEngageHt()).isEqualByComparingTo("0.00");
        assertThat(dto.getLignes()).singleElement().satisfies(ligne -> {
            assertThat(ligne.getRubrique()).isEqualTo("MATIERE");
            assertThat(ligne.getLabel()).isEqualTo("Matière");
            assertThat(ligne.getEcartHt()).isEqualByComparingTo("5500.00");
        });
    }
}
