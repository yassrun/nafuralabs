package ma.nafura.etudes.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.etudes.api.dto.DossierConversionResultDto;
import ma.nafura.etudes.api.request.DossierConvertirDto;
import ma.nafura.etudes.api.request.DossierGagneDto;
import ma.nafura.etudes.api.request.DossierPerduDto;
import ma.nafura.etudes.domain.dossier.DossierEtude;
import ma.nafura.etudes.domain.dossier.StatutDossierEtude;
import ma.nafura.etudes.repository.AppelOffreClientRepository;
import ma.nafura.etudes.repository.AvisExecutionRepository;
import ma.nafura.etudes.repository.DevisRepository;
import ma.nafura.etudes.repository.DossierDocumentRepository;
import ma.nafura.etudes.repository.DossierEtudeRepository;
import ma.nafura.etudes.repository.DossierPieceAttendueRepository;
import ma.nafura.etudes.repository.DpgfNoeudRepository;
import ma.nafura.etudes.service.port.bc.ChainageAvalPort;
import ma.nafura.etudes.service.port.capability.EtudeApprovalPort;
import ma.nafura.etudes.service.port.bc.EtudeClientPort;
import ma.nafura.platform.framework.context.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class DossierEtudeChainageAvalTest {

    private static final UUID TENANT = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private static final UUID DOSSIER_ID = UUID.fromString("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

    @Mock
    private DossierEtudeRepository repository;

    @Mock
    private DpgfNoeudRepository noeudRepository;

    @Mock
    private DossierDocumentRepository documentRepository;

    @Mock
    private DevisRepository devisRepository;

    @Mock
    private ParametresEtudeService parametres;

    @Mock
    private EtudeApprovalPort approvalPort;

    @Mock
    private EtudeClientPort clientPort;

    @Mock
    private DevisService devisService;

    @Mock
    private AppelOffreClientService aocService;

    @Mock
    private AppelOffreClientRepository aocRepository;

    @Mock
    private DossierPieceAttendueService pieceAttendueService;

    @Mock
    private DossierPieceAttendueRepository pieceAttendueRepository;

    @Mock
    private ChargeEtudeService chargeEtudeService;

    @Mock
    private DossierIntervenantService intervenantService;

    @Mock
    private BudgetVentilationService budgetVentilationService;

    @Mock
    private ChainageAvalPort chainageAvalPort;

    private DossierEtudeService service;

    @BeforeEach
    void setUp() {
        TenantContext.setTenantId(TENANT);
        service = new DossierEtudeService(
                repository,
                noeudRepository,
                documentRepository,
                devisRepository,
                parametres,
                approvalPort,
                clientPort,
                devisService,
                aocService,
                aocRepository,
                pieceAttendueService,
                pieceAttendueRepository,
                chargeEtudeService,
                intervenantService,
                mock(AvisExecutionRepository.class),
                budgetVentilationService,
                chainageAvalPort,
                List.of());
        when(repository.save(any(DossierEtude.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void gagne_depuisDevisGenere() {
        DossierEtude dossier = dossier(StatutDossierEtude.DEVIS_GENERE);
        when(repository.findByIdAndTenantId(DOSSIER_ID, TENANT)).thenReturn(Optional.of(dossier));

        DossierGagneDto body = new DossierGagneDto();
        body.setDateAttribution(LocalDate.of(2026, 8, 1));
        body.setReferenceMarche("M-42");
        body.setMontantAttribue(new BigDecimal("150000"));

        DossierEtude out = service.gagne(DOSSIER_ID, body);
        assertThat(out.getStatus()).isEqualTo(StatutDossierEtude.GAGNE);
        assertThat(out.getReferenceMarche()).isEqualTo("M-42");
        assertThat(out.getMontantAttribue()).isEqualByComparingTo("150000");
    }

    @Test
    void perdu_enregistreMotif() {
        DossierEtude dossier = dossier(StatutDossierEtude.DEVIS_GENERE);
        when(repository.findByIdAndTenantId(DOSSIER_ID, TENANT)).thenReturn(Optional.of(dossier));

        DossierPerduDto body = new DossierPerduDto();
        body.setMotif("PRIX");
        body.setConcurrentRetenu("Concurrent X");
        body.setEcartPrixEstime(new BigDecimal("12000"));

        DossierEtude out = service.perdu(DOSSIER_ID, body);
        assertThat(out.getStatus()).isEqualTo(StatutDossierEtude.PERDU);
        assertThat(out.getMotifPerte()).isEqualTo("PRIX");
        assertThat(out.getConcurrentRetenu()).isEqualTo("Concurrent X");
    }

    @Test
    void gagne_horsEtat_refuse() {
        DossierEtude dossier = dossier(StatutDossierEtude.VALIDEE);
        when(repository.findByIdAndTenantId(DOSSIER_ID, TENANT)).thenReturn(Optional.of(dossier));
        DossierGagneDto body = new DossierGagneDto();
        body.setDateAttribution(LocalDate.now());
        assertThatThrownBy(() -> service.gagne(DOSSIER_ID, body))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("gagne_hors_etat");
    }

    @Test
    void convertir_appellePortEtPasseConvertie() {
        DossierEtude dossier = dossier(StatutDossierEtude.GAGNE);
        dossier.setClientId("client-1");
        dossier.setClientNom("MOA");
        dossier.setMontantAttribue(new BigDecimal("100000"));
        when(repository.findByIdAndTenantId(DOSSIER_ID, TENANT)).thenReturn(Optional.of(dossier));
        when(parametres.tvaTauxDefaut()).thenReturn(new BigDecimal("20"));
        when(budgetVentilationService.ventiler(any())).thenReturn(List.of());
        when(chainageAvalPort.convert(any()))
                .thenReturn(new ChainageAvalPort.ConversionResult("CH-1", "MA-1"));

        DossierConversionResultDto result = service.convertir(DOSSIER_ID, new DossierConvertirDto());

        assertThat(result.getChantierId()).isEqualTo("CH-1");
        assertThat(result.getMarcheId()).isEqualTo("MA-1");
        assertThat(result.getStatus()).isEqualTo("CONVERTIE");
        assertThat(dossier.getChantierGenereId()).isEqualTo("CH-1");
        assertThat(dossier.getStatus()).isEqualTo(StatutDossierEtude.CONVERTIE);

        ArgumentCaptor<ChainageAvalPort.ConversionCommand> cap =
                ArgumentCaptor.forClass(ChainageAvalPort.ConversionCommand.class);
        verify(chainageAvalPort).convert(cap.capture());
        assertThat(cap.getValue().montantHt()).isEqualByComparingTo("100000");
        assertThat(cap.getValue().clientId()).isEqualTo("client-1");
    }

    @Test
    void convertir_idempotentSiDejaChantier() {
        DossierEtude dossier = dossier(StatutDossierEtude.GAGNE);
        dossier.setChantierGenereId("CH-EXIST");
        dossier.setMarcheGenereId("MA-EXIST");
        when(repository.findByIdAndTenantId(DOSSIER_ID, TENANT)).thenReturn(Optional.of(dossier));

        DossierConversionResultDto result = service.convertir(DOSSIER_ID, new DossierConvertirDto());
        assertThat(result.getChantierId()).isEqualTo("CH-EXIST");
        assertThat(dossier.getStatus()).isEqualTo(StatutDossierEtude.GAGNE);
    }

    private static DossierEtude dossier(StatutDossierEtude status) {
        return DossierEtude.builder()
                .id(DOSSIER_ID)
                .tenantId(TENANT)
                .numero("ET-1")
                .objet("Affaire test")
                .status(status)
                .currentStep(5)
                .build();
    }
}
