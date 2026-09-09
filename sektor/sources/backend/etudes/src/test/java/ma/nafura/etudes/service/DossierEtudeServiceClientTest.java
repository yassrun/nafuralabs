package ma.nafura.etudes.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import java.util.Optional;
import java.util.UUID;
import ma.nafura.etudes.api.request.DossierEtudeCreateDto;
import ma.nafura.etudes.api.request.DossierEtudeUpdateDto;
import ma.nafura.etudes.domain.devis.Devis;
import ma.nafura.etudes.domain.dossier.DossierEtude;
import ma.nafura.etudes.domain.dossier.StatutDossierEtude;
import ma.nafura.etudes.repository.AppelOffreClientRepository;
import ma.nafura.etudes.repository.DevisRepository;
import ma.nafura.etudes.repository.DossierDocumentRepository;
import ma.nafura.etudes.repository.DossierEtudeRepository;
import ma.nafura.etudes.repository.DossierPieceAttendueRepository;
import ma.nafura.etudes.repository.DpgfNoeudRepository;
import ma.nafura.etudes.service.port.capability.EtudeApprovalPort;
import ma.nafura.etudes.service.port.bc.EtudeClientPort;
import ma.nafura.platform.framework.context.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import ma.nafura.etudes.service.port.bc.ChainageAvalPort;
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
                .thenAnswer(inv -> {
                    String nom = inv.getArgument(1);
                    return nom != null && !nom.isBlank() ? nom.trim() : "Ingénieur test";
                });
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
                org.mockito.Mockito.mock(ma.nafura.etudes.repository.AvisExecutionRepository.class),
                org.mockito.Mockito.mock(DebourseDuNoeudService.class),
                org.mockito.Mockito.mock(ma.nafura.etudes.service.port.bc.ChainageAvalPort.class),
                org.mockito.Mockito.mock(ma.nafura.etudes.service.ConsultationEtudeService.class),
                org.mockito.Mockito.mock(ma.nafura.etudes.service.TransitionEtudeService.class),
                org.mockito.Mockito.mock(CompletudeEtudeService.class),
                org.mockito.Mockito.mock(DecisionCatalogueService.class),
                java.util.List.of());
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void create_sansMoa_refuse() {
        DossierEtudeCreateDto dto = new DossierEtudeCreateDto();
        dto.setObjet("Étude sans MOA");
        dto.setChargeEtudeUserId("cccccccc-cccc-cccc-cccc-cccccccccccc");

        assertThatThrownBy(() -> service.create(dto))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("etudes.moa.requis");
    }

    @Test
    void create_avecMoaTexte_sansPartner() {
        when(repository.countByTenantId(TENANT)).thenReturn(0L);
        when(repository.save(any())).thenAnswer(inv -> {
            DossierEtude d = inv.getArgument(0);
            if (d.getId() == null) {
                d.setId(UUID.randomUUID());
            }
            return d;
        });

        DossierEtudeCreateDto dto = new DossierEtudeCreateDto();
        dto.setObjet("Étude MOA texte");
        dto.setClientNom("Commune de Casablanca");
        dto.setChargeEtudeUserId("cccccccc-cccc-cccc-cccc-cccccccccccc");
        dto.setChargeEtudeNom("Ingé Demo");

        DossierEtude created = service.create(dto);

        assertThat(created.getClientId()).isNull();
        assertThat(created.getClientNom()).isEqualTo("Commune de Casablanca");
        assertThat(created.getChargeEtudeNom()).isEqualTo("Ingé Demo");
    }

    @Test
    void create_avecClient_normaliseDepuisPort() {
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
        dto.setChargeEtudeUserId("cccccccc-cccc-cccc-cccc-cccccccccccc");
        dto.setChargeEtudeNom("Ingé Demo");

        DossierEtude created = service.create(dto);

        assertThat(created.getClientId()).isEqualTo(CLIENT.toString());
        assertThat(created.getClientNom()).isEqualTo("OCP SA");
        assertThat(created.getChargeEtudeUserId()).isEqualTo("cccccccc-cccc-cccc-cccc-cccccccccccc");
        assertThat(created.getChargeEtudeNom()).isEqualTo("Ingé Demo");
    }

    @Test
    void update_moaTexte_sansPartner() {
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
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        DossierEtudeUpdateDto dto = new DossierEtudeUpdateDto();
        dto.setClientId("");
        dto.setClientNom("Commune de Rabat");

        DossierEtude updated = service.update(dossier.getId(), dto);

        assertThat(updated.getClientId()).isNull();
        assertThat(updated.getClientNom()).isEqualTo("Commune de Rabat");
    }

    @Test
    void create_clientInvalide_refuse() {
        when(clientPort.requireClientRole("not-a-uuid"))
                .thenThrow(new IllegalArgumentException("etudes.client.id_invalide"));

        DossierEtudeCreateDto dto = new DossierEtudeCreateDto();
        dto.setObjet("Étude");
        dto.setClientId("not-a-uuid");
        dto.setChargeEtudeUserId("cccccccc-cccc-cccc-cccc-cccccccccccc");

        assertThatThrownBy(() -> service.create(dto))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("etudes.client.id_invalide");
    }

    @Test
    void genererDevis_sansClient_refuse() {
        UUID id = UUID.randomUUID();
        DossierEtude dossier = DossierEtude.builder()
                .id(id)
                .tenantId(TENANT)
                .numero("DE-0009")
                .objet("Sans client")
                .status(StatutDossierEtude.VALIDEE)
                .dpgfId(UUID.randomUUID())
                .clientNom("MOA texte")
                .build();
        when(repository.findByIdAndTenantId(id, TENANT)).thenReturn(Optional.of(dossier));
        when(devisService.createFromDossier(dossier))
                .thenThrow(new IllegalArgumentException("etudes.gate.chiffrage.client_manquant"));

        assertThatThrownBy(() -> service.genererDevis(id, null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("etudes.gate.chiffrage.client_manquant");
    }

    @Test
    void genererDevis_clientIdFourni_lieEtGenere() {
        UUID id = UUID.randomUUID();
        UUID devisId = UUID.randomUUID();
        DossierEtude dossier = DossierEtude.builder()
                .id(id)
                .tenantId(TENANT)
                .numero("DE-0010")
                .objet("Lier client")
                .status(StatutDossierEtude.VALIDEE)
                .dpgfId(UUID.randomUUID())
                .clientNom("Commune de Tanger")
                .build();
        when(repository.findByIdAndTenantId(id, TENANT)).thenReturn(Optional.of(dossier));
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(clientPort.requireClientRole(CLIENT.toString()))
                .thenReturn(new EtudeClientPort.ClientSnapshot(CLIENT, "CLI-001", "Commune de Tanger"));
        when(devisService.createFromDossier(any())).thenAnswer(inv -> {
            DossierEtude d = inv.getArgument(0);
            assertThat(d.getClientId()).isEqualTo(CLIENT.toString());
            return Devis.builder().id(devisId).numero("DV-0010").build();
        });

        DossierEtude out = service.genererDevis(id, CLIENT.toString());

        assertThat(out.getClientId()).isEqualTo(CLIENT.toString());
        assertThat(out.getClientNom()).isEqualTo("Commune de Tanger");
        assertThat(out.getDevisGenereId()).isEqualTo(devisId);
        assertThat(out.getStatus()).isEqualTo(StatutDossierEtude.DEVIS_GENERE);
    }

    @Test
    void update_cadrageAo_persisteDelaiEtType() {
        UUID id = UUID.randomUUID();
        UUID aocId = UUID.randomUUID();
        DossierEtude dossier = DossierEtude.builder()
                .id(id)
                .tenantId(TENANT)
                .numero("DE-0320")
                .objet("Cadrage AO")
                .status(StatutDossierEtude.BROUILLON)
                .clientNom("RRA")
                .build();
        when(repository.findByIdAndTenantId(id, TENANT)).thenReturn(Optional.of(dossier));
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        ma.nafura.etudes.domain.appeloffre.AppelOffreClient aoc =
                ma.nafura.etudes.domain.appeloffre.AppelOffreClient.builder()
                        .id(aocId)
                        .tenantId(TENANT)
                        .numero("AOC-0320")
                        .reference("A049/RRA/2026")
                        .objet("Cadrage AO")
                        .donneurOrdre("RRA")
                        .type("PUBLIC")
                        .dateLimiteDepot(java.time.LocalDate.of(2026, 8, 31))
                        .delaiExecutionJours(180)
                        .status(ma.nafura.etudes.domain.appeloffre.AppelOffreClient.STATUS_A_ETUDIER)
                        .build();
        when(aocService.create(any())).thenReturn(aoc);
        when(aocRepository.findByIdAndTenantId(aocId, TENANT)).thenReturn(Optional.of(aoc));

        DossierEtudeUpdateDto dto = new DossierEtudeUpdateDto();
        dto.setObjet("Cadrage AO");
        dto.setClientNom("RRA");
        dto.setAoType("PUBLIC");
        dto.setAoReference("A049/RRA/2026");
        dto.setDateLimiteDepot(java.time.LocalDate.of(2026, 8, 31));
        dto.setDelaiExecutionJours(180);

        DossierEtude updated = service.update(id, dto);

        assertThat(updated.getAppelOffreClientId()).isEqualTo(aocId);
        assertThat(updated.getAoDelaiExecutionJours()).isEqualTo(180);
        assertThat(updated.getAoType()).isEqualTo("PUBLIC");
        assertThat(updated.getAoReference()).isEqualTo("A049/RRA/2026");
    }

    @Test
    void update_cadrageAo_sansDateLimite_persisteDelai() {
        UUID id = UUID.randomUUID();
        UUID aocId = UUID.randomUUID();
        DossierEtude dossier = DossierEtude.builder()
                .id(id)
                .tenantId(TENANT)
                .numero("DE-0271")
                .objet("Cadrage sans date")
                .status(StatutDossierEtude.BROUILLON)
                .clientNom("RRA")
                .build();
        when(repository.findByIdAndTenantId(id, TENANT)).thenReturn(Optional.of(dossier));
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        ma.nafura.etudes.domain.appeloffre.AppelOffreClient aoc =
                ma.nafura.etudes.domain.appeloffre.AppelOffreClient.builder()
                        .id(aocId)
                        .tenantId(TENANT)
                        .numero("AOC-0271")
                        .reference("A049/RRA/2026")
                        .objet("Cadrage sans date")
                        .donneurOrdre("RRA")
                        .type("PUBLIC")
                        .delaiExecutionJours(90)
                        .status(ma.nafura.etudes.domain.appeloffre.AppelOffreClient.STATUS_A_ETUDIER)
                        .build();
        when(aocService.create(any())).thenReturn(aoc);
        when(aocRepository.findByIdAndTenantId(aocId, TENANT)).thenReturn(Optional.of(aoc));

        DossierEtudeUpdateDto dto = new DossierEtudeUpdateDto();
        dto.setObjet("Cadrage sans date");
        dto.setClientNom("RRA");
        dto.setAoType("PUBLIC");
        dto.setAoReference("A049/RRA/2026");
        dto.setDelaiExecutionJours(90);

        DossierEtude updated = service.update(id, dto);

        assertThat(updated.getAppelOffreClientId()).isEqualTo(aocId);
        assertThat(updated.getAoDelaiExecutionJours()).isEqualTo(90);
        assertThat(updated.getAoType()).isEqualTo("PUBLIC");
    }
}
