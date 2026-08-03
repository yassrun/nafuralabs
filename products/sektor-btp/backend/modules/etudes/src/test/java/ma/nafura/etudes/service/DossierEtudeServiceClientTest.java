package ma.nafura.etudes.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import java.util.Optional;
import java.util.UUID;
import ma.nafura.etudes.api.request.DossierEtudeCreateDto;
import ma.nafura.etudes.api.request.DossierEtudeUpdateDto;
import ma.nafura.etudes.domain.model.DossierEtude;
import ma.nafura.etudes.domain.model.StatutDossierEtude;
import ma.nafura.etudes.repository.AppelOffreClientRepository;
import ma.nafura.etudes.repository.DevisRepository;
import ma.nafura.etudes.repository.DossierDocumentRepository;
import ma.nafura.etudes.repository.DossierEtudeRepository;
import ma.nafura.etudes.repository.DossierPieceAttendueRepository;
import ma.nafura.etudes.repository.DpgfNoeudRepository;
import ma.nafura.etudes.service.port.EtudeApprovalPort;
import ma.nafura.etudes.service.port.EtudeClientPort;
import ma.nafura.platform.framework.context.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class DossierEtudeServiceClientTest {

    private static final UUID TENANT = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private static final UUID CLIENT = UUID.fromString("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

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
                java.util.List.of());
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void create_sansClient_refuse() {
        when(clientPort.requireClientRole(null))
                .thenThrow(new IllegalArgumentException("etudes.gate.chiffrage.client_manquant"));

        DossierEtudeCreateDto dto = new DossierEtudeCreateDto();
        dto.setObjet("Étude sans client");

        assertThatThrownBy(() -> service.create(dto))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("etudes.gate.chiffrage.client_manquant");
    }

    @Test
    void create_avecClient_normaliseDepuisPort() {
        when(repository.existsByTenantIdAndNumero(any(), any())).thenReturn(false);
        when(repository.countByTenantId(TENANT)).thenReturn(0L);
        when(repository.save(any())).thenAnswer(inv -> {
            DossierEtude d = inv.getArgument(0);
            if (d.getId() == null) {
                d.setId(UUID.randomUUID());
            }
            return d;
        });
        when(clientPort.requireClientRole(CLIENT.toString()))
                .thenReturn(new EtudeClientPort.ClientSnapshot(CLIENT, "CLI-001", "OCP SA"));

        DossierEtudeCreateDto dto = new DossierEtudeCreateDto();
        dto.setObjet("Étude avec client");
        dto.setClientId(CLIENT.toString());
        dto.setClientNom("Nom forgé par le front");

        DossierEtude created = service.create(dto);

        assertThat(created.getClientId()).isEqualTo(CLIENT.toString());
        assertThat(created.getClientNom()).isEqualTo("OCP SA");
    }

    @Test
    void update_effaceClient_refuse() {
        DossierEtude dossier = DossierEtude.builder()
                .id(UUID.randomUUID())
                .tenantId(TENANT)
                .numero("DE-0001")
                .objet("X")
                .status(StatutDossierEtude.BROUILLON)
                .clientId(CLIENT.toString())
                .clientNom("OCP SA")
                .build();
        when(repository.findByIdAndTenantId(dossier.getId(), TENANT)).thenReturn(Optional.of(dossier));
        when(clientPort.requireClientRole(""))
                .thenThrow(new IllegalArgumentException("etudes.gate.chiffrage.client_manquant"));

        DossierEtudeUpdateDto dto = new DossierEtudeUpdateDto();
        dto.setClientId("");

        assertThatThrownBy(() -> service.update(dossier.getId(), dto))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("etudes.gate.chiffrage.client_manquant");
    }

    @Test
    void create_clientInvalide_refuse() {
        when(repository.existsByTenantIdAndNumero(any(), any())).thenReturn(false);
        when(repository.countByTenantId(TENANT)).thenReturn(0L);
        when(clientPort.requireClientRole("not-a-uuid"))
                .thenThrow(new IllegalArgumentException("etudes.client.id_invalide"));

        DossierEtudeCreateDto dto = new DossierEtudeCreateDto();
        dto.setObjet("Étude");
        dto.setClientId("not-a-uuid");

        assertThatThrownBy(() -> service.create(dto))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("etudes.client.id_invalide");
    }
}
