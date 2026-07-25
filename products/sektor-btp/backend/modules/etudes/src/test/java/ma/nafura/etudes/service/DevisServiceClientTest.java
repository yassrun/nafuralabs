package ma.nafura.etudes.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.UUID;
import ma.nafura.etudes.domain.model.Devis;
import ma.nafura.etudes.domain.model.DossierEtude;
import ma.nafura.etudes.domain.model.Dpgf;
import ma.nafura.etudes.repository.DevisRepository;
import ma.nafura.etudes.repository.DevisVersionRepository;
import ma.nafura.etudes.service.port.EtudeClientPort;
import ma.nafura.platform.framework.context.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class DevisServiceClientTest {

    private static final UUID TENANT = UUID.fromString("cccccccc-cccc-cccc-cccc-cccccccccccc");
    private static final UUID CLIENT = UUID.fromString("dddddddd-dddd-dddd-dddd-dddddddddddd");
    private static final UUID DPGF = UUID.fromString("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");

    @Mock
    private DevisRepository repository;

    @Mock
    private DevisVersionRepository versionRepository;

    @Mock
    private DevisSeedService seedService;

    @Mock
    private DpgfService dpgfService;

    @Mock
    private DevisGenerationService generationService;

    @Mock
    private EtudeClientPort clientPort;

    private DevisService service;

    @BeforeEach
    void setUp() {
        TenantContext.setTenantId(TENANT);
        service = new DevisService(
                repository, versionRepository, seedService, dpgfService, generationService, clientPort);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void createFromDossier_sansClient_refuse() {
        DossierEtude dossier = DossierEtude.builder()
                .id(UUID.randomUUID())
                .dpgfId(DPGF)
                .build();
        when(clientPort.requireClientRole(null))
                .thenThrow(new IllegalArgumentException("etudes.gate.chiffrage.client_manquant"));

        assertThatThrownBy(() -> service.createFromDossier(dossier))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("etudes.gate.chiffrage.client_manquant");
    }

    @Test
    void createFromDossier_propageUuidEtNom() {
        DossierEtude dossier = DossierEtude.builder()
                .id(UUID.randomUUID())
                .dpgfId(DPGF)
                .clientId(CLIENT.toString())
                .clientNom("Ancien nom")
                .build();
        when(clientPort.requireClientRole(CLIENT.toString()))
                .thenReturn(new EtudeClientPort.ClientSnapshot(CLIENT, "CLI-001", "OCP Promotion SA"));
        when(dpgfService.getById(DPGF))
                .thenReturn(Dpgf.builder()
                        .id(DPGF)
                        .numero("DPGF-1")
                        .projetNom("Projet")
                        .tvaTaux(new BigDecimal("20"))
                        .build());
        when(generationService.toDevisLignes(any(), any(), any())).thenReturn(new ArrayList<>());
        when(repository.countByTenantIdAndNumeroStartingWith(any(), any())).thenReturn(0L);
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Devis devis = service.createFromDossier(dossier);

        assertThat(devis.getClientId()).isEqualTo(CLIENT.toString());
        assertThat(devis.getClientName()).isEqualTo("OCP Promotion SA");
        assertThat(devis.getClientId()).doesNotContain("cli-default");
    }

    @Test
    void createFromDpgf_sansClient_refuse() {
        assertThatThrownBy(() -> service.createFromDpgf(DPGF))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("etudes.gate.chiffrage.client_manquant");
    }
}
