package ma.nafura.marches.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;
import java.util.UUID;
import ma.nafura.marches.domain.contrat.ContratMarche;
import ma.nafura.marches.repository.BpuLigneRepository;
import ma.nafura.marches.repository.ContratMarcheRepository;
import ma.nafura.marches.seeders.ContratMarcheSeedService;
import ma.nafura.marches.service.port.ChantierVentePort;
import ma.nafura.platform.framework.context.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.beans.factory.ObjectProvider;

@ExtendWith(MockitoExtension.class)
class ContratMarcheServiceTest {

    private static final UUID TENANT = UUID.fromString("00000000-0000-0000-0000-000000000001");

    @Mock private ContratMarcheRepository contratRepository;
    @Mock private BpuLigneRepository ligneRepository;
    @Mock private ContratMarcheSeedService seedService;
    @Mock private ObjectProvider<ChantierVentePort> portProvider;
    @Mock private ChantierVentePort port;

    private ContratMarcheService service;

    @BeforeEach
    void setUp() {
        TenantContext.setTenantId(TENANT);
        service = new ContratMarcheService(contratRepository, ligneRepository, seedService, portProvider);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void notifier_basculeLaVenteDuChantier() {
        ContratMarche draft = ContratMarche.builder()
                .id("mar-001")
                .tenantId(TENANT)
                .chantierId("ch-1")
                .status(ContratMarche.STATUS_BROUILLON)
                .build();
        when(contratRepository.findByIdAndTenantId("mar-001", TENANT)).thenReturn(Optional.of(draft));
        when(contratRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(portProvider.getIfAvailable()).thenReturn(port);

        ContratMarche notified = service.notifier("mar-001");

        assertThat(notified.getStatus()).isEqualTo(ContratMarche.STATUS_NOTIFIE);
        verify(port).basculerVersMarche("ch-1");
    }
}
