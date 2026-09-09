package ma.nafura.chantiers.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.chantiers.api.dto.ActiviteChantierDto;
import ma.nafura.chantiers.api.request.ActiviteChantierCreateDto;
import ma.nafura.chantiers.api.request.ActiviteChantierUpdateDto;
import ma.nafura.chantiers.api.request.ActiviteRattachementCreateDto;
import ma.nafura.chantiers.domain.activite.ActiviteChantier;
import ma.nafura.chantiers.domain.activite.ActiviteForme;
import ma.nafura.chantiers.domain.activite.ActiviteNature;
import ma.nafura.chantiers.domain.activite.ActiviteRattachement;
import ma.nafura.chantiers.domain.budget.PosteBudgetaire;
import ma.nafura.chantiers.domain.chantier.Chantier;
import ma.nafura.chantiers.domain.chantier.ChantierLot;
import ma.nafura.chantiers.domain.chantier.NatureLigne;
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

/** SEKTOR-325 — formes, natures, durée ouvrée, migration conservatrice. */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class ActiviteChantierFormeServiceTest {

    private static final UUID TENANT = UUID.fromString("00000000-0000-0000-0000-000000000001");
    private static final String CHANTIER = "ch-1";
    private static final String LOT = "ch-1-lot-01";
    private static final String POSTE = "ch-1-poste-01";
    private static final LocalDate DEBUT = LocalDate.of(2026, 8, 3);
    private static final LocalDate FIN = LocalDate.of(2026, 8, 20);

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

        when(natureRepository.findById("TRAVAUX")).thenReturn(Optional.of(nature("TRAVAUX", ActiviteForme.ACTIVITE, true)));
        when(natureRepository.findById("JALON_TECHNIQUE"))
                .thenReturn(Optional.of(nature("JALON_TECHNIQUE", ActiviteForme.JALON, true)));
        when(natureRepository.findById("JALON_INACTIF"))
                .thenReturn(Optional.of(nature("JALON_INACTIF", ActiviteForme.JALON, false)));
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void updateDuree_recalculeFinAuLieuDeConserverAncienneFin() {
        ActiviteChantierCreateDto create = new ActiviteChantierCreateDto();
        create.setLibelle("Terrassement");
        create.setDateDebut(LocalDate.of(2026, 9, 11));
        create.setDureeMinutesOuvrees(480);
        ActiviteChantierDto created = service.create(CHANTIER, create);
        ActiviteChantierUpdateDto update = new ActiviteChantierUpdateDto();
        update.setDureeMinutesOuvrees(1440);
        update.setRecalculerFin(true);
        ActiviteChantierDto changed = service.update(CHANTIER, created.getId(), update);
        assertThat(changed.getDateFin()).isEqualTo(LocalDate.of(2026, 9, 15));
        assertThat(changed.getDureeMinutesOuvrees()).isEqualTo(1440);
    }

    @Test
    void get_lignePreexistante_preserveIdsDatesRattachements_formeActiviteAQualifier() {
        ActiviteChantier preexisting = ActiviteChantier.builder()
                .id("act-pre-l1")
                .tenantId(TENANT)
                .chantierId(CHANTIER)
                .libelle("Coffrage existant")
                .forme(ActiviteForme.ACTIVITE)
                .dateDebut(DEBUT)
                .dateFin(FIN)
                .ordre(1)
                .status(ActiviteChantier.STATUS_PLANIFIE)
                .build();
        activites.add(preexisting);

        service.rattacher(CHANTIER, "act-pre-l1", rattacher(new BigDecimal("40")));
        ActiviteChantierDto dto = service.get(CHANTIER, "act-pre-l1");

        assertThat(dto.getId()).isEqualTo("act-pre-l1");
        assertThat(dto.getDateDebut()).isEqualTo(DEBUT);
        assertThat(dto.getDateFin()).isEqualTo(FIN);
        assertThat(dto.getForme()).isEqualTo("ACTIVITE");
        assertThat(dto.getNatureCode()).isNull();
        assertThat(dto.getDureeMinutesOuvrees()).isNull();
        assertThat(dto.getRattachements()).hasSize(1);
        assertThat(dto.getRattachements().getFirst().getPosteId()).isEqualTo(POSTE);
        assertThat(dto.getRattachements().getFirst().getQuantitePrevue()).isEqualByComparingTo("40");
    }

    @Test
    void parentProductif_resteActivite_pasDeConversionAutoEnPhase() {
        ActiviteChantierDto parent = service.create(CHANTIER, activite("Structure", null));
        ActiviteChantierDto enfant = service.create(CHANTIER, activite("Coffrage", parent.getId()));

        assertThat(parent.getForme()).isEqualTo("ACTIVITE");
        assertThat(service.get(CHANTIER, parent.getId()).getForme()).isEqualTo("ACTIVITE");
        assertThat(enfant.getParentActiviteId()).isEqualTo(parent.getId());
    }

    @Test
    void create_jalon_dureeZeroDebutEgalFin() {
        ActiviteChantierCreateDto dto = new ActiviteChantierCreateDto();
        dto.setLibelle("OS");
        dto.setForme("JALON");
        dto.setNatureCode("JALON_TECHNIQUE");
        dto.setDateDebut(DEBUT);
        dto.setCode("OS-1");

        ActiviteChantierDto created = service.create(CHANTIER, dto);

        assertThat(created.getForme()).isEqualTo("JALON");
        assertThat(created.getDureeMinutesOuvrees()).isZero();
        assertThat(created.getDateDebut()).isEqualTo(DEBUT);
        assertThat(created.getDateFin()).isEqualTo(DEBUT);
        assertThat(created.getNatureCode()).isEqualTo("JALON_TECHNIQUE");
        assertThat(created.getCode()).isEqualTo("OS-1");
    }

    @Test
    void create_jalonDUnJourFictif_dureePositive_refuse() {
        ActiviteChantierCreateDto dto = new ActiviteChantierCreateDto();
        dto.setLibelle("Faux jalon");
        dto.setForme("JALON");
        dto.setDateDebut(DEBUT);
        dto.setDateFin(DEBUT);
        dto.setDureeMinutesOuvrees(480);

        assertThatThrownBy(() -> service.create(CHANTIER, dto))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining(ActiviteChantierService.ERR_JALON_JOUR_FICTIF);
    }

    @Test
    void create_jalonDatesDistinctes_refuse() {
        ActiviteChantierCreateDto dto = new ActiviteChantierCreateDto();
        dto.setLibelle("Jalon étalé");
        dto.setForme("JALON");
        dto.setDateDebut(DEBUT);
        dto.setDateFin(FIN);

        assertThatThrownBy(() -> service.create(CHANTIER, dto))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining(ActiviteChantierService.ERR_JALON_JOUR_FICTIF);
    }

    @Test
    void create_phase_sansQuantite_datesDeriveesMinMaxEnfantsALaLecture() {
        ActiviteChantierCreateDto phaseDto = new ActiviteChantierCreateDto();
        phaseDto.setLibelle("Gros œuvre");
        phaseDto.setForme("PHASE");
        phaseDto.setDateDebut(LocalDate.of(2026, 1, 1));
        phaseDto.setDateFin(LocalDate.of(2026, 1, 2));
        ActiviteChantierDto phase = service.create(CHANTIER, phaseDto);

        ActiviteChantierCreateDto a1 = activite("Coffrage", phase.getId());
        a1.setDateDebut(LocalDate.of(2026, 9, 1));
        a1.setDateFin(LocalDate.of(2026, 9, 10));
        service.create(CHANTIER, a1);
        ActiviteChantierCreateDto a2 = activite("Coulage", phase.getId());
        a2.setDateDebut(LocalDate.of(2026, 9, 8));
        a2.setDateFin(LocalDate.of(2026, 9, 20));
        service.create(CHANTIER, a2);

        ActiviteChantierDto lu = service.get(CHANTIER, phase.getId());
        assertThat(lu.getForme()).isEqualTo("PHASE");
        assertThat(lu.getDateDebut()).isEqualTo(LocalDate.of(2026, 9, 1));
        assertThat(lu.getDateFin()).isEqualTo(LocalDate.of(2026, 9, 20));
        assertThat(lu.getDureeMinutesOuvrees()).isNull();

        assertThatThrownBy(() -> service.rattacher(CHANTIER, phase.getId(), rattacher(new BigDecimal("10"))))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining(ActiviteChantierService.ERR_PHASE_QUANTITE);
    }

    @Test
    void create_activiteDebutPlusDuree_deriveFinInclusiveSansDecalerLaConvention() {
        ActiviteChantierCreateDto dto = new ActiviteChantierCreateDto();
        dto.setLibelle("Coulage");
        dto.setForme("ACTIVITE");
        dto.setNatureCode("TRAVAUX");
        dto.setDateDebut(LocalDate.of(2026, 9, 1));
        dto.setDureeMinutesOuvrees(960);

        ActiviteChantierDto created = service.create(CHANTIER, dto);

        assertThat(created.getDateDebut()).isEqualTo(LocalDate.of(2026, 9, 1));
        assertThat(created.getDateFin()).isEqualTo(LocalDate.of(2026, 9, 2));
        assertThat(created.getDureeMinutesOuvrees()).isEqualTo(960);
        assertThat(created.getNatureCode()).isEqualTo("TRAVAUX");
    }

    @Test
    void create_debutPlusDureeVendredi16h_weekEndFerme_finitLundiAc04() {
        ActiviteChantierCreateDto dto = new ActiviteChantierCreateDto();
        dto.setLibelle("Coulage vendredi");
        dto.setForme("ACTIVITE");
        dto.setDateDebut(LocalDate.of(2026, 9, 11));
        dto.setDureeMinutesOuvrees(960);

        ActiviteChantierDto created = service.create(CHANTIER, dto);

        assertThat(created.getDateDebut()).isEqualTo(LocalDate.of(2026, 9, 11));
        assertThat(created.getDateFin()).isEqualTo(LocalDate.of(2026, 9, 14));
    }

    @Test
    void create_datesExplicites_visiblesInchangeesMemeSiDureeFournie() {
        ActiviteChantierCreateDto dto = activite("Terrassement", null);
        dto.setDureeMinutesOuvrees(480);
        dto.setDateDebut(DEBUT);
        dto.setDateFin(FIN);

        ActiviteChantierDto created = service.create(CHANTIER, dto);

        assertThat(created.getDateDebut()).isEqualTo(DEBUT);
        assertThat(created.getDateFin()).isEqualTo(FIN);
        assertThat(created.getDureeMinutesOuvrees()).isEqualTo(480);
    }

    @Test
    void update_dureeSurLigneExistante_neDecalePasLesDatesVisibles() {
        ActiviteChantierDto created = service.create(CHANTIER, activite("Coffrage", null));
        ActiviteChantierUpdateDto update = new ActiviteChantierUpdateDto();
        update.setDureeMinutesOuvrees(2400);

        ActiviteChantierDto lu = service.update(CHANTIER, created.getId(), update);

        assertThat(lu.getDateDebut()).isEqualTo(created.getDateDebut());
        assertThat(lu.getDateFin()).isEqualTo(created.getDateFin());
        assertThat(lu.getDureeMinutesOuvrees()).isEqualTo(2400);
    }

    @Test
    void create_natureInactive_refuse() {
        ActiviteChantierCreateDto dto = new ActiviteChantierCreateDto();
        dto.setLibelle("OS");
        dto.setForme("JALON");
        dto.setNatureCode("JALON_INACTIF");
        dto.setDateDebut(DEBUT);

        assertThatThrownBy(() -> service.create(CHANTIER, dto))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining(ActiviteChantierService.ERR_NATURE_INACTIVE);
    }

    @Test
    void create_natureJalonSurActivite_refuse() {
        ActiviteChantierCreateDto dto = activite("Travaux", null);
        dto.setNatureCode("JALON_TECHNIQUE");

        assertThatThrownBy(() -> service.create(CHANTIER, dto))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining(ActiviteChantierService.ERR_NATURE_FORME);
    }

    private static ActiviteChantierCreateDto activite(String libelle, String parentId) {
        ActiviteChantierCreateDto dto = new ActiviteChantierCreateDto();
        dto.setLibelle(libelle);
        dto.setDateDebut(DEBUT);
        dto.setDateFin(FIN);
        dto.setParentActiviteId(parentId);
        return dto;
    }

    private static ActiviteRattachementCreateDto rattacher(BigDecimal qty) {
        ActiviteRattachementCreateDto dto = new ActiviteRattachementCreateDto();
        dto.setPosteId(POSTE);
        dto.setQuantitePrevue(qty);
        return dto;
    }

    private static ActiviteNature nature(String code, ActiviteForme forme, boolean actif) {
        return ActiviteNature.builder()
                .code(code)
                .libelle(code)
                .forme(forme)
                .actif(actif)
                .ordre(1)
                .build();
    }
}
