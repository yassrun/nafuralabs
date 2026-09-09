package ma.nafura.chantiers.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.chantiers.api.dto.ActiviteChantierDto;
import ma.nafura.chantiers.api.dto.ActiviteRattachementDto;
import ma.nafura.chantiers.api.dto.PlanningCapacitesDto;
import ma.nafura.chantiers.api.request.ActiviteChantierCreateDto;
import ma.nafura.chantiers.api.request.ActivitePrecedenceCreateDto;
import ma.nafura.chantiers.api.request.ActiviteRattachementCreateDto;
import ma.nafura.chantiers.domain.activite.ActiviteChantier;
import ma.nafura.chantiers.domain.activite.ActivitePrecedence;
import ma.nafura.chantiers.domain.activite.ActiviteRattachement;
import ma.nafura.chantiers.domain.budget.PosteBudgetaire;
import ma.nafura.chantiers.domain.chantier.Chantier;
import ma.nafura.chantiers.domain.chantier.ChantierLot;
import ma.nafura.chantiers.domain.chantier.NatureLigne;
import ma.nafura.chantiers.domain.chantier.ZoneChantier;
import ma.nafura.chantiers.repository.ActiviteChantierRepository;
import ma.nafura.chantiers.repository.ActiviteNatureRepository;
import ma.nafura.chantiers.repository.ActivitePrecedenceRepository;
import ma.nafura.chantiers.repository.ActiviteRattachementRepository;
import ma.nafura.chantiers.repository.ChantierLotRepository;
import ma.nafura.chantiers.repository.PosteBudgetaireRepository;
import ma.nafura.chantiers.repository.ZoneChantierRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.web.server.ResponseStatusException;

/** AC-1..AC-7 — création WBS, zone, quotité, précédence. */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class ActiviteChantierServiceTest {

    private static final UUID TENANT = UUID.fromString("00000000-0000-0000-0000-000000000001");
    private static final String CHANTIER = "ch-1";
    private static final String LOT = "ch-1-lot-01";
    private static final String POSTE = "ch-1-poste-01";
    private static final String ZONE = "ch-1-zone-01";

    @Mock private ActiviteChantierRepository activiteRepository;
    @Mock private ActivitePrecedenceRepository precedenceRepository;
    @Mock private ActiviteRattachementRepository rattachementRepository;
    @Mock private ActiviteNatureRepository natureRepository;
    @Mock private ChantierService chantierService;
    @Mock private ZoneChantierRepository zoneRepository;
    @Mock private ChantierLotRepository lotRepository;
    @Mock private PosteBudgetaireRepository posteRepository;
    @Mock private CalendrierChantierService calendrierService;
    @Mock private PlanningPolicy planningPolicy;

    private ActiviteChantierService service;
    private final List<ActiviteChantier> activites = new ArrayList<>();
    private final List<ActiviteRattachement> rattachements = new ArrayList<>();
    private final List<ActivitePrecedence> precedences = new ArrayList<>();

    @BeforeEach
    void setUp() {
        TenantContext.setTenantId(TENANT);
        service = new ActiviteChantierService(
                activiteRepository,
                precedenceRepository,
                rattachementRepository,
                natureRepository,
                chantierService,
                zoneRepository,
                lotRepository,
                posteRepository,
                calendrierService,
                planningPolicy);

        when(chantierService.getById(CHANTIER))
                .thenReturn(Chantier.builder().id(CHANTIER).code("CH-1").label("Résidence").build());
        when(calendrierService.deriveInclusiveFin(eq(CHANTIER), any(), anyInt()))
                .thenAnswer(inv -> ma.nafura.chantiers.domain.calendrier.CalendrierOuvreCalculator
                        .standard(ma.nafura.chantiers.domain.calendrier.CalendrierOuvreCalculator.FUSEAU_DEFAUT)
                        .deriveInclusiveFin(inv.getArgument(1), inv.getArgument(2)));
        when(activiteRepository.save(any())).thenAnswer(inv -> {
            ActiviteChantier a = inv.getArgument(0);
            activites.removeIf(x -> x.getId().equals(a.getId()));
            activites.add(a);
            return a;
        });
        when(activiteRepository.findByIdAndTenantId(any(), eq(TENANT))).thenAnswer(inv -> {
            String id = inv.getArgument(0);
            return activites.stream().filter(a -> a.getId().equals(id)).findFirst();
        });
        when(activiteRepository.findByTenantIdAndChantierIdOrderByOrdreAscLibelleAsc(eq(TENANT), eq(CHANTIER)))
                .thenAnswer(inv -> List.copyOf(activites));
        when(activiteRepository.countByTenantIdAndChantierId(eq(TENANT), eq(CHANTIER)))
                .thenAnswer(inv -> (long) activites.size());
        when(rattachementRepository.save(any())).thenAnswer(inv -> {
            ActiviteRattachement r = inv.getArgument(0);
            rattachements.add(r);
            return r;
        });
        when(rattachementRepository.findByTenantIdAndActiviteId(eq(TENANT), any()))
                .thenAnswer(inv -> rattachements.stream()
                        .filter(r -> r.getActiviteId().equals(inv.getArgument(1)))
                        .toList());
        when(rattachementRepository.sommeQuantitePrevuePoste(eq(TENANT), eq(POSTE)))
                .thenAnswer(inv -> rattachements.stream()
                        .filter(r -> POSTE.equals(r.getPosteId()))
                        .map(ActiviteRattachement::getQuantitePrevue)
                        .reduce(BigDecimal.ZERO, BigDecimal::add));
        when(precedenceRepository.save(any())).thenAnswer(inv -> {
            ActivitePrecedence p = inv.getArgument(0);
            precedences.add(p);
            return p;
        });
        when(precedenceRepository.findByTenantIdAndChantierId(eq(TENANT), eq(CHANTIER)))
                .thenAnswer(inv -> List.copyOf(precedences));
        when(planningPolicy.capacites(CHANTIER)).thenReturn(PlanningCapacitesDto.applyAll());

        when(zoneRepository.findByIdAndTenantId(eq(ZONE), eq(TENANT)))
                .thenReturn(Optional.of(ZoneChantier.builder()
                        .id(ZONE)
                        .tenantId(TENANT)
                        .chantierId(CHANTIER)
                        .designation("R+1")
                        .ordre(1)
                        .build()));
        when(posteRepository.findByIdAndTenantId(eq(POSTE), eq(TENANT)))
                .thenReturn(Optional.of(PosteBudgetaire.builder()
                        .id(POSTE)
                        .tenantId(TENANT)
                        .lotId(LOT)
                        .code("1.1")
                        .designation("Béton B25")
                        .nature(NatureLigne.VENDU)
                        .quantite(new BigDecimal("100"))
                        .build()));
        when(lotRepository.findByIdAndTenantId(eq(LOT), eq(TENANT)))
                .thenReturn(Optional.of(ChantierLot.builder()
                        .id(LOT)
                        .tenantId(TENANT)
                        .chantierId(CHANTIER)
                        .code("1")
                        .designation("GO")
                        .nature(NatureLigne.VENDU)
                        .quantite(new BigDecimal("100"))
                        .build()));
        when(lotRepository.findByTenantIdAndParentLotId(eq(TENANT), any())).thenReturn(List.of());
        when(posteRepository.findByTenantIdAndLotIdOrderByOrdreAscCodeAsc(eq(TENANT), eq(LOT)))
                .thenReturn(List.of());
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void create_parentEtEnfantAvecZone_ok() {
        ActiviteChantierDto parent = service.create(CHANTIER, createDto("Phase structure", null, null));
        ActiviteChantierDto enfant = service.create(CHANTIER, createDto("Coffrage R+1", parent.getId(), ZONE));

        assertThat(enfant.getParentActiviteId()).isEqualTo(parent.getId());
        assertThat(enfant.getZoneId()).isEqualTo(ZONE);
        assertThat(enfant.getLibelle()).isEqualTo("Coffrage R+1");
        assertThat(parent.getForme()).isEqualTo("ACTIVITE");
        assertThat(enfant.getForme()).isEqualTo("ACTIVITE");
        assertThat(parent.getNatureCode()).isNull();
        assertThat(parent.getDureeMinutesOuvrees()).isNull();
    }

    @Test
    void rattacher_50puis60_refuseDepassement() {
        ActiviteChantierDto a1 = service.create(CHANTIER, createDto("Coffrage", null, null));
        ActiviteChantierDto a2 = service.create(CHANTIER, createDto("Coulage", null, null));

        ActiviteRattachementDto ok = service.rattacher(CHANTIER, a1.getId(), rattacher(new BigDecimal("50")));
        assertThat(ok.getQuantitePrevue()).isEqualByComparingTo("50");

        assertThatThrownBy(() -> service.rattacher(CHANTIER, a2.getId(), rattacher(new BigDecimal("60"))))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining(ActiviteChantierService.ERR_QUOTITE);
    }

    @Test
    void precedence_cycle_refuse() {
        ActiviteChantierDto a1 = service.create(CHANTIER, createDto("A", null, null));
        ActiviteChantierDto a2 = service.create(CHANTIER, createDto("B", null, null));

        ActivitePrecedenceCreateDto fd = new ActivitePrecedenceCreateDto();
        fd.setPredActiviteId(a1.getId());
        fd.setSuccActiviteId(a2.getId());
        fd.setTypeLien("FD");
        assertThat(service.lier(CHANTIER, fd).getTypeLien()).isEqualTo("FD");

        ActivitePrecedenceCreateDto cycle = new ActivitePrecedenceCreateDto();
        cycle.setPredActiviteId(a2.getId());
        cycle.setSuccActiviteId(a1.getId());
        cycle.setTypeLien("FD");
        assertThatThrownBy(() -> service.lier(CHANTIER, cycle))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining(ActiviteChantierService.ERR_CYCLE_PREC);
    }

    @Test
    void create_nEstPasDeriveDeLArbre() {
        ActiviteChantierDto created = service.create(CHANTIER, createDto("Libre", null, null));
        assertThat(created.getLibelle()).isEqualTo("Libre");
        assertThat(created.getRattachements()).isEmpty();
        assertThat(activites).hasSize(1);
    }

    @Test
    void planning_exposeCapacitesPourLEcran() {
        assertThat(service.planning(CHANTIER).getCapacites().isEditerStructure()).isTrue();
        assertThat(service.planning(CHANTIER).getCapacites().isAdministrerCalendrier()).isTrue();
    }

    @Test
    void planning_autreChantier_403() {
        doThrow(new ResponseStatusException(
                        org.springframework.http.HttpStatus.FORBIDDEN, PlanningPolicy.REFUS_CODE))
                .when(planningPolicy)
                .assertCanRead("ch-other");
        assertThatThrownBy(() -> service.planning("ch-other"))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining(PlanningPolicy.REFUS_CODE);
    }

    private static ActiviteChantierCreateDto createDto(String libelle, String parentId, String zoneId) {
        ActiviteChantierCreateDto dto = new ActiviteChantierCreateDto();
        dto.setLibelle(libelle);
        dto.setDateDebut(LocalDate.of(2026, 9, 1));
        dto.setDateFin(LocalDate.of(2026, 9, 15));
        dto.setParentActiviteId(parentId);
        dto.setZoneId(zoneId);
        return dto;
    }

    private static ActiviteRattachementCreateDto rattacher(BigDecimal qty) {
        ActiviteRattachementCreateDto dto = new ActiviteRattachementCreateDto();
        dto.setPosteId(POSTE);
        dto.setQuantitePrevue(qty);
        return dto;
    }
}
