package ma.nafura.etudes.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;
import ma.nafura.etudes.api.request.DossierEtudeCreateDto;
import ma.nafura.etudes.domain.dossier.DossierEtude;
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
import org.hibernate.exception.ConstraintViolationException;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;

@ExtendWith(MockitoExtension.class)
class DossierEtudeServiceNumeroRetryTest {

    private static final UUID TENANT = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");

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

    private DossierEtudeService service;

    @BeforeEach
    void setUp() {
        TenantContext.setTenantId(TENANT);
        org.mockito.Mockito.lenient()
                .when(parametres.fraisGenerauxPercentDefaut())
                .thenReturn(java.math.BigDecimal.TEN);
        org.mockito.Mockito.lenient()
                .when(parametres.margePercentDefaut())
                .thenReturn(java.math.BigDecimal.TEN);
        org.mockito.Mockito.lenient()
                .when(parametres.tvaTauxDefaut())
                .thenReturn(new java.math.BigDecimal("20"));
        org.mockito.Mockito.lenient()
                .when(chargeEtudeService.requireIngenieur(any(), any()))
                .thenReturn("Ingénieur test");
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
                org.mockito.Mockito.mock(DossierIntervenantService.class),
                org.mockito.Mockito.mock(AvisExecutionRepository.class),
                org.mockito.Mockito.mock(DebourseDuNoeudService.class),
                org.mockito.Mockito.mock(ChainageAvalPort.class),
                org.mockito.Mockito.mock(ConsultationEtudeService.class),
                org.mockito.Mockito.mock(TransitionEtudeService.class),
                org.mockito.Mockito.mock(CompletudeEtudeService.class),
                org.mockito.Mockito.mock(DecisionCatalogueService.class),
                java.util.List.of());
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void create_numeroAuto_collisionSurUk_retenteEtReussit() {
        when(repository.countByTenantId(TENANT)).thenReturn(0L, 1L);

        AtomicInteger saveCalls = new AtomicInteger();
        when(repository.save(any())).thenAnswer(inv -> {
            DossierEtude d = inv.getArgument(0);
            if (d.getId() == null) {
                d.setId(UUID.randomUUID());
            }
            if (saveCalls.getAndIncrement() == 0) {
                throw numeroUniqueViolation();
            }
            return d;
        });

        DossierEtudeCreateDto dto = new DossierEtudeCreateDto();
        dto.setObjet("Étude concurrente");
        dto.setClientNom("Commune test");
        dto.setChargeEtudeUserId("cccccccc-cccc-cccc-cccc-cccccccccccc");

        DossierEtude created = service.create(dto);

        assertThat(created.getNumero()).isEqualTo("DE-0002");
        assertThat(saveCalls.get()).isEqualTo(2);
        verify(repository, times(2)).countByTenantId(TENANT);
        verify(repository, never()).existsByTenantIdAndNumero(any(), any());
    }

    @Test
    void create_numeroExplicite_duplique_refuseSansRetente() {
        when(repository.existsByTenantIdAndNumero(TENANT, "DE-0042")).thenReturn(true);

        DossierEtudeCreateDto dto = new DossierEtudeCreateDto();
        dto.setNumero("DE-0042");
        dto.setObjet("Étude numéro imposé");
        dto.setClientNom("Commune test");
        dto.setChargeEtudeUserId("cccccccc-cccc-cccc-cccc-cccccccccccc");

        assertThatThrownBy(() -> service.create(dto))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("etudes.dossier.numero_existe");

        verify(repository, never()).save(any());
    }

    private static DataIntegrityViolationException numeroUniqueViolation() {
        return new DataIntegrityViolationException(
                "duplicate key value violates unique constraint \"dossiers_etude_numero_uk\"",
                new ConstraintViolationException(
                        "duplicate key",
                        null,
                        "dossiers_etude_numero_uk"));
    }
}
