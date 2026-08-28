package ma.nafura.chantiers.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.chantiers.api.dto.AvancementPhysiqueDto;
import ma.nafura.chantiers.api.request.AvancementPhysiqueCreateDto;
import ma.nafura.chantiers.api.request.AvancementPhysiqueEntryDto;
import ma.nafura.chantiers.api.request.AvancementPhysiqueUpdateDto;
import ma.nafura.chantiers.domain.attachement.AttachementChantier;
import ma.nafura.chantiers.domain.avancement.AvancementPhysique;
import ma.nafura.chantiers.domain.budget.PosteBudgetaire;
import ma.nafura.chantiers.domain.chantier.Chantier;
import ma.nafura.chantiers.domain.chantier.ChantierLot;
import ma.nafura.chantiers.domain.chantier.NatureLigne;
import ma.nafura.chantiers.repository.AttachementChantierRepository;
import ma.nafura.chantiers.repository.AvancementPhysiqueRepository;
import ma.nafura.chantiers.repository.ChantierLotRepository;
import ma.nafura.chantiers.repository.PosteBudgetaireRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

/**
 * AC-1, AC-5, AC-6, AC-7, AC-9 — la quantité fait foi, le pourcentage se dérive, le dépassement
 * et la modification figée sont refusés.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class AvancementPhysiqueServiceTest {

    private static final UUID TENANT = UUID.fromString("00000000-0000-0000-0000-000000000001");
    private static final String CHANTIER = "ch-1";
    private static final String LOT = "ch-1-lot-01";
    private static final String LOT_FEUILLE = "ch-1-lot-02";
    private static final String POSTE = "ch-1-lot-01-poste-01";

    @Mock private AvancementPhysiqueRepository repository;
    @Mock private ChantierService chantierService;
    @Mock private ChantierLotRepository lotRepository;
    @Mock private PosteBudgetaireRepository posteRepository;
    @Mock private AttachementChantierRepository attachementRepository;
    @Mock private AvancementLectureService avancementLectureService;
    @Mock private ActiviteCouvertureService activiteCouvertureService;

    private AvancementPhysiqueService service;
    private final List<AvancementPhysique> stockage = new ArrayList<>();

    @BeforeEach
    void setUp() {
        TenantContext.setTenantId(TENANT);
        service = new AvancementPhysiqueService(
                repository,
                chantierService,
                lotRepository,
                posteRepository,
                attachementRepository,
                avancementLectureService,
                activiteCouvertureService);
        stockage.clear();

        when(chantierService.getById(CHANTIER)).thenReturn(
                Chantier.builder().id(CHANTIER).code("CH-2026-001").label("Résidence").build());

        when(repository.save(any())).thenAnswer(inv -> {
            AvancementPhysique row = inv.getArgument(0);
            stockage.removeIf(existing -> existing.getId().equals(row.getId()));
            stockage.add(row);
            return row;
        });
        when(repository.findByIdAndTenantId(any(), eq(TENANT))).thenAnswer(inv -> {
            String id = inv.getArgument(0);
            return stockage.stream().filter(row -> row.getId().equals(id)).findFirst();
        });

        when(activiteCouvertureService.activitesCouvrant(any())).thenReturn(List.of());
        when(attachementRepository
                        .existsByTenantIdAndChantierIdAndDateDebutLessThanEqualAndDateFinGreaterThanEqualAndStatusIn(
                                eq(TENANT), any(), any(), any(), anyList()))
                .thenReturn(false);

        when(posteRepository.findByIdAndTenantId(eq(POSTE), eq(TENANT))).thenReturn(Optional.of(posteVendu()));
        when(posteRepository.findByTenantIdAndLotIdOrderByOrdreAscCodeAsc(eq(TENANT), eq(LOT)))
                .thenReturn(List.of(posteVendu()));
        when(posteRepository.findByTenantIdAndLotIdOrderByOrdreAscCodeAsc(eq(TENANT), eq(LOT_FEUILLE)))
                .thenReturn(List.of());
        when(lotRepository.findByIdAndTenantId(eq(LOT), eq(TENANT))).thenReturn(Optional.of(lot(LOT)));
        when(lotRepository.findByIdAndTenantId(eq(LOT_FEUILLE), eq(TENANT))).thenReturn(Optional.of(lot(LOT_FEUILLE)));
        when(lotRepository.findByTenantIdAndParentLotId(eq(TENANT), any())).thenReturn(List.of());
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    /** AC-1 — une déclaration sur un poste-feuille n'exige que le nœud, la quantité, la date. */
    @Test
    void declaration_surPosteFeuille_estAcceptee() {
        when(avancementLectureService.quantiteFaiteCumuleePoste(POSTE)).thenReturn(BigDecimal.ZERO);

        List<AvancementPhysiqueDto> result = service.create(CHANTIER, createDto(null, POSTE, "40"));

        assertThat(result).hasSize(1);
        assertThat(result.getFirst().getQuantiteRealisee()).isEqualByComparingTo("40");
    }

    /** AC-1 — un pourcentage fourni en entrée est refusé, jamais ignoré. */
    @Test
    void declaration_avecPourcentage_estRefusee() {
        AvancementPhysiqueCreateDto dto = createDto(null, POSTE, "10");
        dto.getEntries().getFirst().setPourcentage(new BigDecimal("50"));

        assertThatThrownBy(() -> service.create(CHANTIER, dto))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining(AvancementPhysiqueService.ERR_POURCENTAGE_INTERDIT);
    }

    /** AC-1 — un lot qui porte des postes ne se déclare pas en direct : son avancement se calcule. */
    @Test
    void declaration_surLotAvecEnfants_estRefusee() {
        assertThatThrownBy(() -> service.create(CHANTIER, createDto(LOT, null, "10")))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining(AvancementPhysiqueService.ERR_LOT_A_DES_ENFANTS);
    }

    /** AC-1 — un lot-feuille (sans poste ni sous-lot) se déclare comme un poste. */
    @Test
    void declaration_surLotFeuille_estAcceptee() {
        when(avancementLectureService.quantiteFaiteCumuleeLotFeuille(LOT_FEUILLE)).thenReturn(BigDecimal.ZERO);

        List<AvancementPhysiqueDto> result = service.create(CHANTIER, createDto(LOT_FEUILLE, null, "5"));

        assertThat(result).hasSize(1);
    }

    /** AC-6 — pas de quantité prévue, pas de déclaration. */
    @Test
    void declaration_sansQuantitePrevue_estRefusee() {
        when(posteRepository.findByIdAndTenantId(eq(POSTE), eq(TENANT)))
                .thenReturn(Optional.of(PosteBudgetaire.builder()
                        .id(POSTE)
                        .tenantId(TENANT)
                        .lotId(LOT)
                        .code("01")
                        .designation("Poste béton")
                        .nature(NatureLigne.VENDU)
                        .montantHt(new BigDecimal("50000"))
                        .build()));

        assertThatThrownBy(() -> service.create(CHANTIER, createDto(null, POSTE, "10")))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining(AvancementPhysiqueService.ERR_QUANTITE_PREVUE_MANQUANTE);
    }

    /** AC-5 — dépasser la quantité prévue est refusé, le reste à faire est nommé. */
    @Test
    void declaration_depassementQuantitePrevue_estRefusee() {
        when(avancementLectureService.quantiteFaiteCumuleePoste(POSTE)).thenReturn(new BigDecimal("90"));

        assertThatThrownBy(() -> service.create(CHANTIER, createDto(null, POSTE, "20")))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining(AvancementPhysiqueService.ERR_DEPASSEMENT)
                .hasMessageContaining("reste_a_faire=10");
    }

    /** AC-5 — atteindre exactement la quantité prévue reste normal. */
    @Test
    void declaration_exactementLaQuantitePrevue_estAcceptee() {
        when(avancementLectureService.quantiteFaiteCumuleePoste(POSTE)).thenReturn(new BigDecimal("90"));

        List<AvancementPhysiqueDto> result = service.create(CHANTIER, createDto(null, POSTE, "10"));

        assertThat(result).hasSize(1);
    }

    /** AC-9 — un nœud couvert par une activité refuse la déclaration directe (garde-fou unitaire). */
    @Test
    void declaration_surNoeudCouvertParActivite_estRefusee() {
        when(activiteCouvertureService.activitesCouvrant(POSTE)).thenReturn(List.of("act-terrassement"));

        assertThatThrownBy(() -> service.create(CHANTIER, createDto(null, POSTE, "5")))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining(AvancementPhysiqueService.ERR_NOEUD_COUVERT_PAR_ACTIVITE)
                .hasMessageContaining("act-terrassement");
    }

    /** AC-10 — la remontée depuis l'activité passe la garde couverture. */
    @Test
    void enregistrementDepuisActivite_passeLaGardeCouverture() {
        when(activiteCouvertureService.activitesCouvrant(POSTE)).thenReturn(List.of("act-coffrage"));
        when(avancementLectureService.quantiteFaiteCumuleePoste(POSTE)).thenReturn(BigDecimal.ZERO);

        AvancementPhysiqueDto dto = service.enregistrerDepuisActivite(
                CHANTIER,
                LOT,
                POSTE,
                "act-coffrage",
                LocalDate.of(2026, 9, 6),
                new BigDecimal("10"),
                null,
                AvancementPhysique.STATUS_BROUILLON,
                "user-1",
                "QA");

        assertThat(dto.getQuantiteRealisee()).isEqualByComparingTo("10");
        assertThat(stockage.getFirst().getActiviteId()).isEqualTo("act-coffrage");
    }

    /** AC-7 — une déclaration reprise par un attachement signé ne se corrige plus. */
    @Test
    void correction_apresAttachementSigne_estRefusee() {
        AvancementPhysique row = declarationExistante();
        when(attachementRepository
                        .existsByTenantIdAndChantierIdAndDateDebutLessThanEqualAndDateFinGreaterThanEqualAndStatusIn(
                                eq(TENANT),
                                eq(CHANTIER),
                                eq(row.getDateSaisie()),
                                eq(row.getDateSaisie()),
                                eq(AttachementChantier.STATUTS_FIGES)))
                .thenReturn(true);

        AvancementPhysiqueUpdateDto update = new AvancementPhysiqueUpdateDto();
        update.setQuantiteRealisee(new BigDecimal("15"));

        assertThatThrownBy(() -> service.update(row.getId(), update))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining(AvancementPhysiqueService.ERR_DECLARATION_FIGEE);
    }

    /** AC-7 — annuler une déclaration déjà attachée-signée est refusé, exactement comme la corriger. */
    @Test
    void annulation_apresAttachementSigne_estRefusee() {
        AvancementPhysique row = declarationExistante();
        when(attachementRepository
                        .existsByTenantIdAndChantierIdAndDateDebutLessThanEqualAndDateFinGreaterThanEqualAndStatusIn(
                                eq(TENANT),
                                eq(CHANTIER),
                                eq(row.getDateSaisie()),
                                eq(row.getDateSaisie()),
                                eq(AttachementChantier.STATUTS_FIGES)))
                .thenReturn(true);

        assertThatThrownBy(() -> service.annuler(row.getId())).isInstanceOf(IllegalStateException.class);
    }

    /** AC-7 — avant tout attachement signé, la correction reste ouverte. */
    @Test
    void correction_avantSignature_estAcceptee() {
        AvancementPhysique row = declarationExistante();
        when(avancementLectureService.quantiteFaiteCumuleePoste(POSTE)).thenReturn(row.getQuantiteRealisee());

        AvancementPhysiqueUpdateDto update = new AvancementPhysiqueUpdateDto();
        update.setQuantiteRealisee(new BigDecimal("15"));

        AvancementPhysiqueDto result = service.update(row.getId(), update);

        assertThat(result.getQuantiteRealisee()).isEqualByComparingTo("15");
    }

    // ── Fixtures ────────────────────────────────────────────────────────────

    private AvancementPhysique declarationExistante() {
        AvancementPhysique row = AvancementPhysique.builder()
                .id("ch-1-av-1")
                .tenantId(TENANT)
                .chantierId(CHANTIER)
                .lotId(LOT)
                .posteId(POSTE)
                .dateSaisie(LocalDate.of(2026, 8, 1))
                .quantiteRealisee(new BigDecimal("10"))
                .status(AvancementPhysique.STATUS_BROUILLON)
                .saisieParId("user-1")
                .build();
        stockage.add(row);
        return row;
    }

    private static AvancementPhysiqueCreateDto createDto(String lotId, String posteId, String quantite) {
        AvancementPhysiqueCreateDto dto = new AvancementPhysiqueCreateDto();
        dto.setDate(LocalDate.of(2026, 8, 1));
        dto.setStatus(AvancementPhysique.STATUS_BROUILLON);
        dto.setSaisieParId("user-1");
        AvancementPhysiqueEntryDto entry = new AvancementPhysiqueEntryDto();
        entry.setLotId(lotId);
        entry.setPosteId(posteId);
        entry.setQuantiteRealisee(new BigDecimal(quantite));
        dto.setEntries(List.of(entry));
        return dto;
    }

    private static PosteBudgetaire posteVendu() {
        return PosteBudgetaire.builder()
                .id(POSTE)
                .tenantId(TENANT)
                .lotId(LOT)
                .code("01")
                .designation("Poste béton")
                .nature(NatureLigne.VENDU)
                .quantite(new BigDecimal("100"))
                .montantHt(new BigDecimal("50000"))
                .build();
    }

    private static ChantierLot lot(String id) {
        return ChantierLot.builder()
                .id(id)
                .tenantId(TENANT)
                .chantierId(CHANTIER)
                .code(id)
                .designation("Lot " + id)
                .nature(NatureLigne.VENDU)
                .quantite(new BigDecimal("20"))
                .montantHt(new BigDecimal("10000"))
                .build();
    }
}
