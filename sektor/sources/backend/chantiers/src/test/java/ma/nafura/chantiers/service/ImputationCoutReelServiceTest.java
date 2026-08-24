package ma.nafura.chantiers.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.chantiers.api.request.CoutReelCreateDto;
import ma.nafura.chantiers.domain.budget.CoutReelNoeud;
import ma.nafura.chantiers.domain.budget.OrigineDebourse;
import ma.nafura.chantiers.domain.budget.PosteBudgetaire;
import ma.nafura.chantiers.domain.budget.RubriqueDebourse;
import ma.nafura.chantiers.domain.chantier.Chantier;
import ma.nafura.chantiers.domain.chantier.ChantierLot;
import ma.nafura.chantiers.domain.chantier.NatureLigne;
import ma.nafura.chantiers.repository.ChantierLotRepository;
import ma.nafura.chantiers.repository.CoutReelNoeudRepository;
import ma.nafura.chantiers.repository.PosteBudgetaireRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

/** AC-10, AC-11 — le réel tombe sur un nœud, et un coût sans nœud ne se perd pas. */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class ImputationCoutReelServiceTest {

    private static final UUID TENANT = UUID.fromString("00000000-0000-0000-0000-000000000001");
    private static final String CHANTIER = "ch-1";
    private static final String LOT = "ch-1-lot-01";
    private static final String POSTE = "ch-1-lot-01-poste-01";

    @Mock private CoutReelNoeudRepository repository;
    @Mock private PosteBudgetaireRepository posteRepository;
    @Mock private ChantierLotRepository lotRepository;
    @Mock private ChantierService chantierService;

    private ImputationCoutReelService service;

    @BeforeEach
    void setUp() {
        TenantContext.setTenantId(TENANT);
        service = new ImputationCoutReelService(
                repository, posteRepository, lotRepository, chantierService);
        when(chantierService.getById(CHANTIER)).thenReturn(Chantier.builder().id(CHANTIER).build());
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(posteRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(lotRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(lotRepository.findByIdAndTenantId(LOT, TENANT)).thenReturn(Optional.of(lotVendu()));
        when(lotRepository.findByTenantIdAndChantierIdOrderByOrdreAscCodeAsc(TENANT, CHANTIER))
                .thenReturn(List.of(lotVendu()));
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    /** AC-10 — un nœud, une rubrique, un montant, une date. Rien de plus n'est demandé. */
    @Test
    void imputation_surUnNoeudEtUneRubrique() {
        when(posteRepository.findByIdAndTenantId(POSTE, TENANT)).thenReturn(Optional.of(posteVendu()));

        CoutReelNoeud cout = service.imputer(CHANTIER, saisie(POSTE, "MAIN_DOEUVRE", "1250.00"));

        assertThat(cout.getPosteId()).isEqualTo(POSTE);
        assertThat(cout.getRubrique()).isEqualTo(RubriqueDebourse.MAIN_DOEUVRE);
        assertThat(cout.getMontantHt()).isEqualByComparingTo("1250.00");
        assertThat(cout.getDateCout()).isEqualTo(LocalDate.of(2026, 8, 20));
        assertThat(cout.getImputeParDefaut()).isFalse();
        // Aucun nœud « Frais de chantier » n'a été fabriqué au passage.
        verify(lotRepository, never()).save(any());
    }

    /**
     * AC-11 — un coût sans nœud tombe sur « Frais de chantier », créé <b>à cette imputation</b>
     * et pas avant. Le nœud est interne : pas de vendu, pas de lien vers le devis.
     */
    @Test
    void coutSansNoeud_creeFraisDeChantierALaPremiereImputation() {
        when(lotRepository.findByTenantIdAndChantierIdAndCode(TENANT, CHANTIER, "FRAIS"))
                .thenReturn(Optional.empty());
        when(posteRepository.findByTenantIdAndLotIdAndCode(eq(TENANT), any(), eq("FRAIS")))
                .thenReturn(Optional.empty());

        CoutReelNoeud cout = service.imputer(CHANTIER, saisie(null, "MATIERE", "300.00"));

        ArgumentCaptor<ChantierLot> lotCap = ArgumentCaptor.forClass(ChantierLot.class);
        verify(lotRepository).save(lotCap.capture());
        assertThat(lotCap.getValue().getCode()).isEqualTo("FRAIS");
        assertThat(lotCap.getValue().getDesignation()).isEqualTo("Frais de chantier");
        assertThat(lotCap.getValue().getNature()).isEqualTo(NatureLigne.INTERNE);
        assertThat(lotCap.getValue().getDpgfNoeudId()).isNull();
        assertThat(lotCap.getValue().getMontantHt()).isNull();

        ArgumentCaptor<PosteBudgetaire> posteCap = ArgumentCaptor.forClass(PosteBudgetaire.class);
        verify(posteRepository).save(posteCap.capture());
        assertThat(posteCap.getValue().getNature()).isEqualTo(NatureLigne.INTERNE);
        assertThat(posteCap.getValue().getDebourseOrigine()).isEqualTo(OrigineDebourse.SAISI);

        assertThat(cout.getPosteId()).isEqualTo("ch-1-lot-frais-poste-frais");
        // Le drapeau dit que la dépense attend son vrai nœud : elle est visible, pas rangée.
        assertThat(cout.getImputeParDefaut()).isTrue();
    }

    /** AC-11 — « Frais de chantier » n'est créé qu'une fois : la deuxième dépense le réutilise. */
    @Test
    void coutSansNoeud_reutiliseLeNoeudExistant() {
        ChantierLot frais = ChantierLot.builder()
                .id("ch-1-lot-frais")
                .tenantId(TENANT)
                .chantierId(CHANTIER)
                .code("FRAIS")
                .designation("Frais de chantier")
                .nature(NatureLigne.INTERNE)
                .build();
        when(lotRepository.findByTenantIdAndChantierIdAndCode(TENANT, CHANTIER, "FRAIS"))
                .thenReturn(Optional.of(frais));
        when(posteRepository.findByTenantIdAndLotIdAndCode(TENANT, "ch-1-lot-frais", "FRAIS"))
                .thenReturn(Optional.of(PosteBudgetaire.builder()
                        .id("ch-1-lot-frais-poste-frais")
                        .lotId("ch-1-lot-frais")
                        .nature(NatureLigne.INTERNE)
                        .build()));

        service.imputer(CHANTIER, saisie(null, "MATERIEL", "80.00"));

        verify(lotRepository, never()).save(any());
        verify(posteRepository, never()).save(any());
    }

    /** AC-11 — la dépense n'est pas prisonnière : elle se ré-impute sur le bon nœud après coup. */
    @Test
    void reimputation_surLeBonNoeud() {
        CoutReelNoeud cout = CoutReelNoeud.builder()
                .id("cout-1")
                .tenantId(TENANT)
                .chantierId(CHANTIER)
                .posteId("ch-1-lot-frais-poste-frais")
                .rubrique(RubriqueDebourse.MATIERE)
                .montantHt(new BigDecimal("300.00"))
                .dateCout(LocalDate.of(2026, 8, 20))
                .imputeParDefaut(true)
                .build();
        when(repository.findByIdAndTenantId("cout-1", TENANT)).thenReturn(Optional.of(cout));
        when(posteRepository.findByIdAndTenantId(POSTE, TENANT)).thenReturn(Optional.of(posteVendu()));

        CoutReelNoeud reimpute = service.reimputer("cout-1", POSTE);

        assertThat(reimpute.getPosteId()).isEqualTo(POSTE);
        assertThat(reimpute.getImputeParDefaut()).isFalse();
    }

    /** Une dépense réelle sait toujours ce qu'elle a payé : le non ventilé n'est pas imputable. */
    @Test
    void nonVentile_nEstPasUneCibleDImputation() {
        assertThatThrownBy(() -> service.imputer(CHANTIER, saisie(POSTE, "NON_VENTILE", "10.00")))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("rubrique_invalide");
    }

    /** Un nœud d'un autre chantier n'est pas une cible : l'imputation est refusée, pas déplacée. */
    @Test
    void noeudDUnAutreChantier_refuse() {
        when(posteRepository.findByIdAndTenantId(POSTE, TENANT)).thenReturn(Optional.of(posteVendu()));
        when(lotRepository.findByIdAndTenantId(LOT, TENANT)).thenReturn(Optional.of(ChantierLot.builder()
                .id(LOT)
                .chantierId("ch-autre")
                .build()));

        assertThatThrownBy(() -> service.imputer(CHANTIER, saisie(POSTE, "MATIERE", "10.00")))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("noeud_hors_chantier");
    }

    // ── Fixtures ────────────────────────────────────────────────────────────

    private static CoutReelCreateDto saisie(String posteId, String rubrique, String montant) {
        CoutReelCreateDto dto = new CoutReelCreateDto();
        dto.setPosteId(posteId);
        dto.setRubrique(rubrique);
        dto.setMontantHt(new BigDecimal(montant));
        dto.setDateCout(LocalDate.of(2026, 8, 20));
        dto.setSource("SAISIE");
        return dto;
    }

    private static ChantierLot lotVendu() {
        return ChantierLot.builder()
                .id(LOT)
                .tenantId(TENANT)
                .chantierId(CHANTIER)
                .code("L01")
                .nature(NatureLigne.VENDU)
                .ordre(0)
                .build();
    }

    private static PosteBudgetaire posteVendu() {
        return PosteBudgetaire.builder()
                .id(POSTE)
                .tenantId(TENANT)
                .lotId(LOT)
                .code("01")
                .nature(NatureLigne.VENDU)
                .build();
    }
}
