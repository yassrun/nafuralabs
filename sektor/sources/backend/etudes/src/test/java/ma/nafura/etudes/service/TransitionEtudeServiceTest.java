package ma.nafura.etudes.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;

import java.math.BigDecimal;
import java.util.UUID;
import ma.nafura.etudes.domain.audit.TransitionEtude;
import ma.nafura.etudes.repository.TransitionEtudeRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class TransitionEtudeServiceTest {

    private static final UUID TENANT = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");

    @Mock private TransitionEtudeRepository repository;

    private TransitionEtudeService service;

    @BeforeEach
    void setUp() {
        TenantContext.setTenantId(TENANT);
        service = new TransitionEtudeService(repository);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    /** SEKTOR-209/25 — l'exception de marge garde les trois montants qui ont fondé la décision. */
    @Test
    void consignerGain_conserveVenteDebourseEtMarge() {
        service.consignerGain(
                TransitionEtude.ENTITE_DOSSIER,
                "dossier-1",
                "DEVIS_GENERE",
                "GAGNE",
                UUID.randomUUID(),
                "Vente stratégique",
                new BigDecimal("500000.00"),
                new BigDecimal("582600.00"),
                new BigDecimal("-82600.00"));

        ArgumentCaptor<TransitionEtude> entry = ArgumentCaptor.forClass(TransitionEtude.class);
        verify(repository).save(entry.capture());
        assertThat(entry.getValue().getMontantVenteHt()).isEqualByComparingTo("500000.00");
        assertThat(entry.getValue().getDebourseInitialHt()).isEqualByComparingTo("582600.00");
        assertThat(entry.getValue().getMargeHt()).isEqualByComparingTo("-82600.00");
    }
}
