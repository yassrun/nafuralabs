package ma.nafura.chantiers.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.chantiers.api.dto.AttachementChantierDto;
import ma.nafura.chantiers.api.request.AttachementChantierCreateDto;
import ma.nafura.chantiers.domain.attachement.AttachementChantier;
import ma.nafura.chantiers.domain.attachement.AttachementLigne;
import ma.nafura.chantiers.domain.avancement.AvancementPhysique;
import ma.nafura.chantiers.domain.budget.PosteBudgetaire;
import ma.nafura.chantiers.domain.chantier.Chantier;
import ma.nafura.chantiers.domain.chantier.ChantierLot;
import ma.nafura.chantiers.domain.chantier.NatureLigne;
import ma.nafura.chantiers.domain.chantier.ZoneChantier;
import ma.nafura.chantiers.repository.AttachementChantierRepository;
import ma.nafura.chantiers.repository.AttachementLigneRepository;
import ma.nafura.chantiers.repository.AvancementPhysiqueRepository;
import ma.nafura.chantiers.repository.ChantierLotRepository;
import ma.nafura.chantiers.repository.PosteBudgetaireRepository;
import ma.nafura.chantiers.repository.ZoneChantierRepository;
import ma.nafura.chantiers.seeders.ChantierDocumentsSeedService;
import ma.nafura.platform.framework.context.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

/** AC-10 à AC-17 — l'attachement lit, ne ressaisit pas, filtre au vendu, et se fige à la signature. */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class AttachementChantierServiceTest {

    private static final UUID TENANT = UUID.fromString("00000000-0000-0000-0000-000000000001");
    private static final String CHANTIER = "ch-1";
    private static final String LOT = "ch-1-lot-01";
    private static final String POSTE_VENDU = "ch-1-lot-01-poste-01";
    private static final String POSTE_INTERNE = "ch-1-lot-01-poste-99";
    private static final String ZONE = "ch-1-zone-01";

    @Mock private AttachementChantierRepository repository;
    @Mock private AttachementLigneRepository ligneRepository;
    @Mock private ChantierService chantierService;
    @Mock private ChantierDocumentsSeedService seedService;
    @Mock private AvancementPhysiqueRepository avancementRepository;
    @Mock private ChantierLotRepository lotRepository;
    @Mock private PosteBudgetaireRepository posteRepository;
    @Mock private ZoneChantierRepository zoneRepository;

    private AttachementChantierService service;
    private final List<AttachementChantier> attachements = new ArrayList<>();
    private final List<AttachementLigne> lignes = new ArrayList<>();

    @BeforeEach
    void setUp() {
        TenantContext.setTenantId(TENANT);
        service = new AttachementChantierService(
                repository, ligneRepository, chantierService, seedService,
                avancementRepository, lotRepository, posteRepository, zoneRepository);
        attachements.clear();
        lignes.clear();

        when(chantierService.getById(CHANTIER)).thenReturn(
                Chantier.builder().id(CHANTIER).code("CH-2026-001").label("Résidence").build());
        when(repository.save(any())).thenAnswer(inv -> {
            AttachementChantier row = inv.getArgument(0);
            attachements.removeIf(a -> a.getId().equals(row.getId()));
            attachements.add(row);
            return row;
        });
        when(repository.findByTenantIdAndId(eq(TENANT), any())).thenAnswer(inv -> {
            String id = inv.getArgument(1);
            return attachements.stream().filter(a -> a.getId().equals(id)).findFirst();
        });
        when(repository.findByTenantIdAndChantierIdAndDateDebutLessThanEqualAndDateFinGreaterThanEqual(
                        eq(TENANT), eq(CHANTIER), any(), any()))
                .thenAnswer(inv -> {
                    LocalDate dateFin = inv.getArgument(2);
                    LocalDate dateDebut = inv.getArgument(3);
                    return attachements.stream()
                            .filter(a -> !a.getDateDebut().isAfter(dateFin) && !a.getDateFin().isBefore(dateDebut))
                            .toList();
                });
        when(ligneRepository.save(any())).thenAnswer(inv -> {
            AttachementLigne row = inv.getArgument(0);
            lignes.removeIf(l -> l.getId().equals(row.getId()));
            lignes.add(row);
            return row;
        });
        when(ligneRepository.findByTenantIdAndAttachementIdOrderByOrdreAsc(eq(TENANT), any())).thenAnswer(inv -> {
            String attId = inv.getArgument(1);
            return lignes.stream().filter(l -> l.getAttachementId().equals(attId)).toList();
        });
        when(ligneRepository.findByIdAndTenantId(any(), eq(TENANT))).thenAnswer(inv -> {
            String id = inv.getArgument(0);
            return lignes.stream().filter(l -> l.getId().equals(id)).findFirst();
        });

        when(posteRepository.findByIdAndTenantId(eq(POSTE_VENDU), eq(TENANT))).thenReturn(Optional.of(posteVendu()));
        when(posteRepository.findByIdAndTenantId(eq(POSTE_INTERNE), eq(TENANT)))
                .thenReturn(Optional.of(posteInterne()));
        when(lotRepository.findByIdAndTenantId(eq(LOT), eq(TENANT))).thenReturn(Optional.empty());
        when(zoneRepository.findByIdAndTenantId(eq(ZONE), eq(TENANT)))
                .thenReturn(Optional.of(ZoneChantier.builder()
                        .id(ZONE).tenantId(TENANT).chantierId(CHANTIER).designation("Niveau 1").ordre(0).build()));
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    /** AC-11, AC-12, AC-13 — les lignes se montent depuis les déclarations, filtrées au vendu. */
    @Test
    void create_monteLesLignesDepuisLesDeclarationsEtFiltreLInterne() {
        when(avancementRepository.findByTenantIdAndChantierIdAndDateSaisieBetween(
                        eq(TENANT), eq(CHANTIER), eq(LocalDate.of(2026, 8, 1)), eq(LocalDate.of(2026, 8, 15))))
                .thenReturn(List.of(
                        declaration(POSTE_VENDU, "10"),
                        declaration(POSTE_VENDU, "5"),
                        declaration(POSTE_INTERNE, "20")));

        AttachementChantierDto dto = service.create(CHANTIER, createDto("2026-08-01", "2026-08-15"));

        assertThat(dto.getLignes()).hasSize(1);
        assertThat(dto.getLignes().getFirst().getNoeudId()).isEqualTo(POSTE_VENDU);
        assertThat(dto.getLignes().getFirst().getQuantitePeriode()).isEqualByComparingTo("15");
        assertThat(dto.getLignes().getFirst().getCode()).isEqualTo("01");
        assertThat(dto.getLignes().getFirst().getMontantHt()).isEqualByComparingTo("15000");
    }

    /** AC-11 — une période sans aucune quantité déclarée ne produit pas d'attachement. */
    @Test
    void create_periodeSansDeclaration_estRefusee() {
        when(avancementRepository.findByTenantIdAndChantierIdAndDateSaisieBetween(eq(TENANT), eq(CHANTIER), any(), any()))
                .thenReturn(List.of());

        assertThatThrownBy(() -> service.create(CHANTIER, createDto("2026-08-01", "2026-08-15")))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining(AttachementChantierService.ERR_PERIODE_SANS_QUANTITE);
    }

    /** AC-10 — deux attachements d'un même chantier ne chevauchent pas. */
    @Test
    void create_periodeChevauchante_estRefusee() {
        when(avancementRepository.findByTenantIdAndChantierIdAndDateSaisieBetween(eq(TENANT), eq(CHANTIER), any(), any()))
                .thenReturn(List.of(declaration(POSTE_VENDU, "10")));
        service.create(CHANTIER, createDto("2026-08-01", "2026-08-15"));

        assertThatThrownBy(() -> service.create(CHANTIER, createDto("2026-08-10", "2026-08-20")))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining(AttachementChantierService.ERR_PERIODE_CHEVAUCHANTE);
    }

    /** AC-14 — la zone se choisit dans le référentiel, seulement avant signature. */
    @Test
    void assignerZone_avantSignature_estAcceptee() {
        when(avancementRepository.findByTenantIdAndChantierIdAndDateSaisieBetween(eq(TENANT), eq(CHANTIER), any(), any()))
                .thenReturn(List.of(declaration(POSTE_VENDU, "10")));
        AttachementChantierDto dto = service.create(CHANTIER, createDto("2026-08-01", "2026-08-15"));
        String ligneId = dto.getLignes().getFirst().getId();

        AttachementChantierDto updated = service.assignerZone(dto.getId(), ligneId, ZONE);

        assertThat(updated.getLignes().getFirst().getZoneId()).isEqualTo(ZONE);
        assertThat(updated.getLignes().getFirst().getZoneLibelle()).isEqualTo("Niveau 1");
    }

    /** AC-15 — une fois signé, plus rien ne se corrige : ni la zone, ni la contestation. */
    @Test
    void apresSignature_zoneEtContestationSontRefusees() {
        when(avancementRepository.findByTenantIdAndChantierIdAndDateSaisieBetween(eq(TENANT), eq(CHANTIER), any(), any()))
                .thenReturn(List.of(declaration(POSTE_VENDU, "10")));
        AttachementChantierDto dto = service.create(CHANTIER, createDto("2026-08-01", "2026-08-15"));
        service.applySignature(dto.getId(), "c2lnbmF0dXJl");

        assertThatThrownBy(() -> service.assignerZone(dto.getId(), dto.getLignes().getFirst().getId(), ZONE))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining(AttachementChantierService.ERR_ATTACHEMENT_FIGE);
        assertThatThrownBy(() -> service.contester(dto.getId()))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining(AttachementChantierService.ERR_ATTACHEMENT_FIGE);
    }

    /** AC-17 — avant signature, la contestation retourne en brouillon et remonte. */
    @Test
    void contester_avantSignature_remonteLesLignes() {
        when(avancementRepository.findByTenantIdAndChantierIdAndDateSaisieBetween(eq(TENANT), eq(CHANTIER), any(), any()))
                .thenReturn(List.of(declaration(POSTE_VENDU, "10")));
        AttachementChantierDto dto = service.create(CHANTIER, createDto("2026-08-01", "2026-08-15"));
        service.soumettreSignature(dto.getId());

        // La déclaration a été corrigée entre-temps (AC-7) : le montage doit refléter la nouvelle valeur.
        when(avancementRepository.findByTenantIdAndChantierIdAndDateSaisieBetween(eq(TENANT), eq(CHANTIER), any(), any()))
                .thenReturn(List.of(declaration(POSTE_VENDU, "7")));

        AttachementChantierDto remonte = service.contester(dto.getId());

        assertThat(remonte.getStatus()).isEqualTo(AttachementChantier.STATUS_BROUILLON);
        assertThat(remonte.getLignes()).hasSize(1);
        assertThat(remonte.getLignes().getFirst().getQuantitePeriode()).isEqualByComparingTo("7");
    }

    // ── Fixtures ────────────────────────────────────────────────────────────

    private static AttachementChantierCreateDto createDto(String debut, String fin) {
        AttachementChantierCreateDto dto = new AttachementChantierCreateDto();
        dto.setDateDebut(LocalDate.parse(debut));
        dto.setDateFin(LocalDate.parse(fin));
        dto.setEffectifPresent(10);
        return dto;
    }

    private static AvancementPhysique declaration(String posteId, String quantite) {
        return AvancementPhysique.builder()
                .id(UUID.randomUUID().toString())
                .tenantId(TENANT)
                .chantierId(CHANTIER)
                .lotId(LOT)
                .posteId(posteId)
                .dateSaisie(LocalDate.of(2026, 8, 5))
                .quantiteRealisee(new BigDecimal(quantite))
                .status(AvancementPhysique.STATUS_VALIDE)
                .build();
    }

    private static PosteBudgetaire posteVendu() {
        return PosteBudgetaire.builder()
                .id(POSTE_VENDU).tenantId(TENANT).lotId(LOT).code("01").designation("Béton")
                .nature(NatureLigne.VENDU).unite("m3").quantite(new BigDecimal("100"))
                .prixUnitaireHt(new BigDecimal("1000")).montantHt(new BigDecimal("100000"))
                .build();
    }

    private static PosteBudgetaire posteInterne() {
        return PosteBudgetaire.builder()
                .id(POSTE_INTERNE).tenantId(TENANT).lotId(LOT).code("99").designation("Installation")
                .nature(NatureLigne.INTERNE)
                .build();
    }
}
