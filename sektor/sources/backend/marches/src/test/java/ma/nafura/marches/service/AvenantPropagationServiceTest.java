package ma.nafura.marches.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import ma.nafura.marches.api.dto.AvenantImpactSimulationDto;
import ma.nafura.marches.domain.model.Avenant;
import ma.nafura.marches.domain.model.ContratMarche;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class AvenantPropagationServiceTest {

    private AvenantPropagationService service;

    @BeforeEach
    void setUp() {
        service = new AvenantPropagationService();
    }

    @Test
    void applyIncreasesContratMontantHtByAvenantDelta() {
        ContratMarche contrat = ContratMarche.builder()
                .id("mar-001")
                .numero("MAR-2026-001")
                .montantHt(new BigDecimal("38200000"))
                .dureeMois(18)
                .build();
        Avenant avenant = Avenant.builder()
                .id("av-test")
                .montantHt(new BigDecimal("2200000"))
                .prolongationJours(45)
                .build();

        AvenantImpactSimulationDto result = service.apply(avenant, contrat);

        assertThat(result.getMontantHtActuel()).isEqualByComparingTo("38200000");
        assertThat(result.getDeltaMontantHt()).isEqualByComparingTo("2200000");
        assertThat(result.getMontantHtApres()).isEqualByComparingTo("40400000");
        assertThat(contrat.getMontantHt()).isEqualByComparingTo("40400000");
    }

    @Test
    void applyExtendsDureeMoisByProlongationOverThirtyDays() {
        ContratMarche contrat = ContratMarche.builder()
                .id("mar-001")
                .montantHt(new BigDecimal("1000000"))
                .dureeMois(12)
                .build();
        Avenant avenant = Avenant.builder()
                .id("av-delai")
                .montantHt(BigDecimal.ZERO)
                .prolongationJours(45)
                .build();

        AvenantImpactSimulationDto result = service.apply(avenant, contrat);

        assertThat(result.getDeltaDureeMois()).isEqualTo(1);
        assertThat(result.getDureeMoisApres()).isEqualTo(13);
        assertThat(contrat.getDureeMois()).isEqualTo(13);
    }

    @Test
    void simulateReportsNegativeMontantDelta() {
        ContratMarche contrat = ContratMarche.builder()
                .id("mar-001")
                .montantHt(new BigDecimal("38200000"))
                .dureeMois(18)
                .build();
        Avenant avenant = Avenant.builder()
                .id("av-neg")
                .montantHt(new BigDecimal("-350000"))
                .prolongationJours(0)
                .build();

        AvenantImpactSimulationDto result = service.simulate(avenant, contrat);

        assertThat(result.getMontantHtApres()).isEqualByComparingTo("37850000");
        assertThat(contrat.getMontantHt()).isEqualByComparingTo("38200000");
    }
}
