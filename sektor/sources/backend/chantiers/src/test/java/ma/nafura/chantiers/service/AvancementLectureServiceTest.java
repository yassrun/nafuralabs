package ma.nafura.chantiers.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import ma.nafura.chantiers.domain.avancement.AvancementPhysique;
import ma.nafura.chantiers.domain.budget.PosteBudgetaire;
import ma.nafura.chantiers.domain.chantier.ChantierLot;
import ma.nafura.chantiers.domain.chantier.NatureLigne;
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
 * AC-4 — « un lot dont aucun enfant n'est vendu n'affiche pas un avancement de 0 %, il n'en
 * affiche aucun ». Comblement du trou signalé au rapport de livraison de SEKTOR-152 : ce cas
 * n'était couvert que « transitivement » par {@code BudgetArbreServiceTest} /
 * {@code ChantierLotServiceTest}, jamais isolé.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class AvancementLectureServiceTest {

    private static final UUID TENANT = UUID.fromString("00000000-0000-0000-0000-000000000001");
    private static final String CHANTIER = "ch-1";

    @Mock private AvancementPhysiqueRepository avancementRepository;
    @Mock private ChantierLotRepository lotRepository;
    @Mock private PosteBudgetaireRepository posteRepository;

    private AvancementLectureService service;

    @BeforeEach
    void setUp() {
        TenantContext.setTenantId(TENANT);
        service = new AvancementLectureService(avancementRepository, lotRepository, posteRepository);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    /** AC-4 — lot dont l'unique poste est INTERNE : aucun poids vendu, avancement = null. */
    @Test
    void lotDontAucunEnfantNestVendu_avancementEstNull() {
        String lotId = "ch-1-lot-01";
        String posteInterneId = "ch-1-lot-01-poste-99";

        ChantierLot lot = ChantierLot.builder()
                .id(lotId)
                .tenantId(TENANT)
                .chantierId(CHANTIER)
                .code("01")
                .designation("Installation de chantier")
                .nature(NatureLigne.INTERNE)
                .ordre(1)
                .build();

        PosteBudgetaire posteInterne = PosteBudgetaire.builder()
                .id(posteInterneId)
                .tenantId(TENANT)
                .lotId(lotId)
                .code("01.01")
                .designation("Base vie")
                .nature(NatureLigne.INTERNE)
                .unite("FF")
                .quantite(new BigDecimal("1"))
                .montantHt(null)
                .build();

        when(lotRepository.findByTenantIdAndChantierIdOrderByOrdreAscCodeAsc(TENANT, CHANTIER))
                .thenReturn(List.of(lot));
        when(posteRepository.findByTenantIdAndLotIdOrderByOrdreAscCodeAsc(TENANT, lotId))
                .thenReturn(List.of(posteInterne));
        // Le poste interne est bien déclaré (avancé à 100 %) : ça ne doit rien faire peser.
        when(avancementRepository.findByTenantIdAndPosteIdOrderByDateSaisieAscCreatedAtAsc(eq(TENANT), eq(posteInterneId)))
                .thenReturn(List.of(AvancementPhysique.builder()
                        .id("av-1")
                        .tenantId(TENANT)
                        .chantierId(CHANTIER)
                        .lotId(lotId)
                        .posteId(posteInterneId)
                        .quantiteRealisee(new BigDecimal("1"))
                        .build()));

        BigDecimal chantierAvancement = service.hydrateArbre(CHANTIER);

        assertThat(lot.getAvancementPercent()).isNull();
        assertThat(chantierAvancement).isNull();
    }

    /** AC-4 — pondération au montant vendu, pas à la quantité : deux postes d'unités différentes. */
    @Test
    void lotAvecPostesVendus_pondereParLeMontantHt() {
        String lotId = "ch-1-lot-02";
        String posteAId = "ch-1-lot-02-poste-01";
        String posteBId = "ch-1-lot-02-poste-02";

        ChantierLot lot = ChantierLot.builder()
                .id(lotId)
                .tenantId(TENANT)
                .chantierId(CHANTIER)
                .code("02")
                .designation("Gros oeuvre")
                .nature(NatureLigne.VENDU)
                .ordre(1)
                .build();

        PosteBudgetaire posteA = PosteBudgetaire.builder()
                .id(posteAId)
                .tenantId(TENANT)
                .lotId(lotId)
                .code("02.01")
                .designation("Béton")
                .nature(NatureLigne.VENDU)
                .unite("m3")
                .quantite(new BigDecimal("100"))
                .montantHt(new BigDecimal("10000"))
                .build();
        PosteBudgetaire posteB = PosteBudgetaire.builder()
                .id(posteBId)
                .tenantId(TENANT)
                .lotId(lotId)
                .code("02.02")
                .designation("Acier")
                .nature(NatureLigne.VENDU)
                .unite("kg")
                .quantite(new BigDecimal("1000"))
                .montantHt(new BigDecimal("30000"))
                .build();

        when(lotRepository.findByTenantIdAndChantierIdOrderByOrdreAscCodeAsc(TENANT, CHANTIER))
                .thenReturn(List.of(lot));
        when(posteRepository.findByTenantIdAndLotIdOrderByOrdreAscCodeAsc(TENANT, lotId))
                .thenReturn(List.of(posteA, posteB));
        // Poste A : 50/100 = 50%. Poste B : 1000/1000 = 100%.
        when(avancementRepository.findByTenantIdAndPosteIdOrderByDateSaisieAscCreatedAtAsc(eq(TENANT), eq(posteAId)))
                .thenReturn(List.of(declaration(lotId, posteAId, "50")));
        when(avancementRepository.findByTenantIdAndPosteIdOrderByDateSaisieAscCreatedAtAsc(eq(TENANT), eq(posteBId)))
                .thenReturn(List.of(declaration(lotId, posteBId, "1000")));

        BigDecimal chantierAvancement = service.hydrateArbre(CHANTIER);

        // Pondéré au montant : (10000*50 + 30000*100) / 40000 = 87.5, pas la moyenne simple (75).
        assertThat(lot.getAvancementPercent()).isEqualByComparingTo("87.5000");
        assertThat(chantierAvancement).isEqualByComparingTo("87.5000");
    }

    private static AvancementPhysique declaration(String lotId, String posteId, String quantite) {
        return AvancementPhysique.builder()
                .id("av-" + posteId)
                .tenantId(TENANT)
                .chantierId(CHANTIER)
                .lotId(lotId)
                .posteId(posteId)
                .quantiteRealisee(new BigDecimal(quantite))
                .build();
    }
}
