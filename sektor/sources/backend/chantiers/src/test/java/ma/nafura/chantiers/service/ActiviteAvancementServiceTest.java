package ma.nafura.chantiers.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import ma.nafura.chantiers.api.dto.ActiviteChantierDto;
import ma.nafura.chantiers.api.dto.AvancementPhysiqueDto;
import ma.nafura.chantiers.api.request.ActiviteAvancementCreateDto;
import ma.nafura.chantiers.domain.activite.ActiviteChantier;
import ma.nafura.chantiers.domain.activite.ActiviteRattachement;
import ma.nafura.chantiers.domain.avancement.AvancementPhysique;
import ma.nafura.chantiers.repository.ActiviteChantierRepository;
import ma.nafura.chantiers.repository.ActiviteRattachementRepository;
import ma.nafura.chantiers.repository.AvancementPhysiqueRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

/** AC-8..AC-11 — saisie sur activité, % sans nœud, remontée. */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class ActiviteAvancementServiceTest {

    private static final UUID TENANT = UUID.fromString("00000000-0000-0000-0000-000000000001");
    private static final String CHANTIER = "ch-1";
    private static final String ACT = "ch-1-act-1";

    @Mock private ActiviteChantierService activiteService;
    @Mock private ActiviteChantierRepository activiteRepository;
    @Mock private ActiviteRattachementRepository rattachementRepository;
    @Mock private AvancementPhysiqueRepository avancementPhysiqueRepository;
    @Mock private AvancementPhysiqueService avancementPhysiqueService;

    private ActiviteAvancementService service;

    @BeforeEach
    void setUp() {
        TenantContext.setTenantId(TENANT);
        service = new ActiviteAvancementService(
                activiteService,
                activiteRepository,
                rattachementRepository,
                avancementPhysiqueRepository,
                avancementPhysiqueService);
        when(activiteService.requireActivite(CHANTIER, ACT))
                .thenReturn(ActiviteChantier.builder()
                        .id(ACT)
                        .chantierId(CHANTIER)
                        .libelle("Coffrage")
                        .status(ActiviteChantier.STATUS_PLANIFIE)
                        .build());
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void sansNoeud_saisiePercent_ok() {
        when(rattachementRepository.findByTenantIdAndActiviteId(TENANT, ACT)).thenReturn(List.of());
        when(activiteService.get(CHANTIER, ACT))
                .thenReturn(ActiviteChantierDto.builder()
                        .id(ACT)
                        .avancementPercent(new BigDecimal("40"))
                        .build());

        ActiviteAvancementCreateDto req = base();
        req.setAvancementPercent(new BigDecimal("40"));

        Object result = service.declarer(CHANTIER, ACT, req);
        assertThat(result).isInstanceOf(ActiviteChantierDto.class);
        verify(activiteRepository).save(any(ActiviteChantier.class));
    }

    @Test
    void rattachee_quantiteRemonteSurNoeud() {
        ActiviteRattachement ratt = ActiviteRattachement.builder()
                .id(ACT + "-ratt")
                .activiteId(ACT)
                .lotId("lot-1")
                .posteId("poste-1")
                .quantitePrevue(new BigDecimal("50"))
                .build();
        when(rattachementRepository.findByTenantIdAndActiviteId(TENANT, ACT)).thenReturn(List.of(ratt));
        when(avancementPhysiqueService.enregistrerDepuisActivite(
                        eq(CHANTIER),
                        eq("lot-1"),
                        eq("poste-1"),
                        eq(ACT),
                        any(),
                        eq(new BigDecimal("10")),
                        isNull(),
                        any(),
                        any(),
                        any()))
                .thenReturn(AvancementPhysiqueDto.builder()
                        .id("av-1")
                        .cumulQuantite(new BigDecimal("10"))
                        .build());
        when(avancementPhysiqueRepository.findByTenantIdAndActiviteId(TENANT, ACT))
                .thenReturn(List.of(AvancementPhysique.builder()
                        .quantiteRealisee(new BigDecimal("10"))
                        .build()));

        ActiviteAvancementCreateDto req = base();
        req.setQuantiteRealisee(new BigDecimal("10"));

        Object result = service.declarer(CHANTIER, ACT, req);
        assertThat(result).isInstanceOf(AvancementPhysiqueDto.class);
        verify(avancementPhysiqueService)
                .enregistrerDepuisActivite(
                        eq(CHANTIER),
                        eq("lot-1"),
                        eq("poste-1"),
                        eq(ACT),
                        any(),
                        eq(new BigDecimal("10")),
                        isNull(),
                        any(),
                        any(),
                        any());
    }

    @Test
    void rattachee_sansQuantite_refuse() {
        when(rattachementRepository.findByTenantIdAndActiviteId(TENANT, ACT))
                .thenReturn(List.of(ActiviteRattachement.builder()
                        .id("r")
                        .activiteId(ACT)
                        .posteId("p")
                        .lotId("l")
                        .quantitePrevue(new BigDecimal("50"))
                        .build()));

        assertThatThrownBy(() -> service.declarer(CHANTIER, ACT, base()))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("quantite_positive_requise");
    }

    private static ActiviteAvancementCreateDto base() {
        ActiviteAvancementCreateDto dto = new ActiviteAvancementCreateDto();
        dto.setDate(LocalDate.of(2026, 9, 6));
        dto.setSaisieParId("qa");
        dto.setStatus("BROUILLON");
        return dto;
    }
}
