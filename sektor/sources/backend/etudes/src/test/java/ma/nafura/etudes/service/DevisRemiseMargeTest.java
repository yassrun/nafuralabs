package ma.nafura.etudes.service;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;

import java.math.BigDecimal;
import ma.nafura.etudes.domain.devis.Devis;
import ma.nafura.etudes.repository.AppelOffreClientRepository;
import ma.nafura.etudes.repository.DevisRepository;
import ma.nafura.etudes.repository.DevisVersionRepository;
import ma.nafura.etudes.service.port.bc.EtudeClientPort;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import ma.nafura.etudes.seeders.DevisSeedService;

class DevisRemiseMargeTest {

    private DevisService service;

    @BeforeEach
    void setUp() {
        service = new DevisService(
                mock(DevisRepository.class),
                mock(DevisVersionRepository.class),
                mock(DevisSeedService.class),
                mock(DpgfService.class),
                mock(DevisGenerationService.class),
                mock(EtudeClientPort.class),
                mock(AppelOffreClientRepository.class),
                mock(JdbcTemplate.class));
    }

    @Test
    void remiseInferieureOuEgaleMarge_ok() {
        Devis devis = Devis.builder().remiseGlobalePercent(new BigDecimal("7")).build();
        assertThatCode(() -> service.assertRemiseVsMarge(devis)).doesNotThrowAnyException();

        devis.setRemiseGlobalePercent(new BigDecimal("5"));
        assertThatCode(() -> service.assertRemiseVsMarge(devis)).doesNotThrowAnyException();
    }

    @Test
    void remiseSupMarge_bloque() {
        Devis devis = Devis.builder().remiseGlobalePercent(new BigDecimal("8")).build();
        assertThatThrownBy(() -> service.assertRemiseVsMarge(devis))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("remise_sup_marge");
    }

    @Test
    void sansRemise_ok() {
        assertThatCode(() -> service.assertRemiseVsMarge(Devis.builder().build()))
                .doesNotThrowAnyException();
    }
}
