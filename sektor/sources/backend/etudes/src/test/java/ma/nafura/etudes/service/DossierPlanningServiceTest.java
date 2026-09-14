package ma.nafura.etudes.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.etudes.api.request.DossierPlanningActiviteRequest;
import ma.nafura.etudes.api.request.DossierPlanningRessourceRequest;
import ma.nafura.etudes.domain.dossier.DossierEtude;
import ma.nafura.etudes.domain.dossier.StatutDossierEtude;
import ma.nafura.etudes.domain.dpgf.Dpgf;
import ma.nafura.etudes.domain.dpgf.DpgfNoeud;
import ma.nafura.etudes.domain.planning.DossierPlanningActivite;
import ma.nafura.etudes.domain.planning.DossierPlanningRessource;
import ma.nafura.etudes.repository.DossierEtudeRepository;
import ma.nafura.etudes.repository.DossierPlanningActiviteRepository;
import ma.nafura.etudes.repository.DossierPlanningRessourceRepository;
import ma.nafura.etudes.repository.DpgfNoeudRepository;
import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.platform.framework.context.UserContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class DossierPlanningServiceTest {

    private static final UUID TENANT = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final UUID DOSSIER = UUID.fromString("22222222-2222-2222-2222-222222222222");
    private static final UUID DPGF = UUID.fromString("44444444-4444-4444-4444-444444444444");
    private static final UUID LOT = UUID.fromString("55555555-5555-5555-5555-555555555555");

    private DossierEtudeRepository dossierRepository;
    private DossierPlanningActiviteRepository activiteRepository;
    private DossierPlanningRessourceRepository ressourceRepository;
    private DpgfNoeudRepository noeudRepository;
    private DossierPlanningService service;

    @BeforeEach
    void setUp() {
        TenantContext.setTenantId(TENANT);
        UserContext.setUserRole("OWNER");
        dossierRepository = mock(DossierEtudeRepository.class);
        activiteRepository = mock(DossierPlanningActiviteRepository.class);
        ressourceRepository = mock(DossierPlanningRessourceRepository.class);
        noeudRepository = mock(DpgfNoeudRepository.class);
        service = new DossierPlanningService(
                dossierRepository,
                activiteRepository,
                ressourceRepository,
                noeudRepository,
                new EtudeSaisiePolicy());

        DossierEtude dossier = DossierEtude.builder()
                .id(DOSSIER)
                .tenantId(TENANT)
                .numero("ET-1")
                .objet("x")
                .status(StatutDossierEtude.IN_PROGRESS)
                .dpgfId(DPGF)
                .build();
        when(dossierRepository.findByIdAndTenantId(DOSSIER, TENANT)).thenReturn(Optional.of(dossier));
        when(activiteRepository.findByTenantIdAndDossierIdOrderByOrdreAscCreatedAtAsc(TENANT, DOSSIER))
                .thenReturn(List.of());
        when(ressourceRepository.findByTenantIdAndDossierIdOrderByTypeAscOrdreAscCreatedAtAsc(
                        TENANT, DOSSIER))
                .thenReturn(List.of());
        when(activiteRepository.save(any(DossierPlanningActivite.class))).thenAnswer(inv -> {
            DossierPlanningActivite a = inv.getArgument(0);
            if (a.getId() == null) {
                a.setId(UUID.randomUUID());
            }
            return a;
        });
        when(ressourceRepository.save(any(DossierPlanningRessource.class))).thenAnswer(inv -> {
            DossierPlanningRessource a = inv.getArgument(0);
            if (a.getId() == null) {
                a.setId(UUID.randomUUID());
            }
            return a;
        });
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
        UserContext.clear();
    }

    @Test
    void creeActiviteHorsLot() {
        DossierPlanningActiviteRequest dto = new DossierPlanningActiviteRequest();
        dto.setLibelle("Installation de chantier");
        dto.setDateDebut(LocalDate.of(2026, 10, 1));
        dto.setDateFin(LocalDate.of(2026, 10, 8));

        DossierPlanningActivite saved = service.creerActivite(DOSSIER, dto);

        assertThat(saved.getLibelle()).isEqualTo("Installation de chantier");
        assertThat(saved.getDpgfNoeudId()).isNull();
        assertThat(saved.getDateDebut()).isEqualTo(LocalDate.of(2026, 10, 1));
    }

    @Test
    void lieActiviteAuLotVendu() {
        Dpgf dpgf = Dpgf.builder().id(DPGF).tenantId(TENANT).build();
        DpgfNoeud lot = DpgfNoeud.builder()
                .id(LOT)
                .tenantId(TENANT)
                .type(DpgfNoeud.TYPE_LOT)
                .code("1")
                .libelle("Gros œuvre")
                .dpgf(dpgf)
                .build();
        when(noeudRepository.findByIdAndTenantId(LOT, TENANT)).thenReturn(Optional.of(lot));

        DossierPlanningActiviteRequest dto = new DossierPlanningActiviteRequest();
        dto.setLibelle("Gros œuvre RDC");
        dto.setDpgfNoeudId(LOT);
        dto.setDateDebut(LocalDate.of(2026, 10, 9));
        dto.setDateFin(LocalDate.of(2026, 11, 20));

        DossierPlanningActivite saved = service.creerActivite(DOSSIER, dto);

        assertThat(saved.getDpgfNoeudId()).isEqualTo(LOT);
        assertThat(saved.getLotLibelle()).contains("Gros œuvre");
    }

    @Test
    void refuseDatesInversees() {
        DossierPlanningActiviteRequest dto = new DossierPlanningActiviteRequest();
        dto.setLibelle("x");
        dto.setDateDebut(LocalDate.of(2026, 11, 1));
        dto.setDateFin(LocalDate.of(2026, 10, 1));

        assertThatThrownBy(() -> service.creerActivite(DOSSIER, dto))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("etudes.planning.dates_invalides");
    }

    @Test
    void creeRessourceHumaineSansAffectation() {
        DossierPlanningRessourceRequest dto = new DossierPlanningRessourceRequest();
        dto.setType("HUMAIN");
        dto.setLibelle("Ingénieur");
        dto.setQuantite(new BigDecimal("2"));

        DossierPlanningRessource saved = service.creerRessource(DOSSIER, dto);

        assertThat(saved.getType()).isEqualTo("HUMAIN");
        assertThat(saved.getLibelle()).isEqualTo("Ingénieur");
        assertThat(saved.getQuantite()).isEqualByComparingTo("2");
        assertThat(saved.getEmployeId()).isNull();
    }

    @Test
    void refuseTypeInconnu() {
        DossierPlanningRessourceRequest dto = new DossierPlanningRessourceRequest();
        dto.setType("ENGIN");
        dto.setLibelle("Grue");
        dto.setQuantite(BigDecimal.ONE);

        assertThatThrownBy(() -> service.creerRessource(DOSSIER, dto))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("etudes.planning.type_invalide");
    }
}
