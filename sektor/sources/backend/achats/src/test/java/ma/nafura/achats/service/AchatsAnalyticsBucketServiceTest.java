package ma.nafura.achats.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import ma.nafura.achats.api.dto.AnalyticsBucketResponseDto;
import ma.nafura.achats.domain.model.BonCommandeAchat;
import ma.nafura.achats.repository.AppelOffreAchatRepository;
import ma.nafura.achats.repository.BonCommandeAchatRepository;
import ma.nafura.achats.repository.ContratFournisseurRepository;
import ma.nafura.achats.repository.DemandeAchatRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class AchatsAnalyticsBucketServiceTest {

    @Mock
    private BonCommandeAchatRepository bcRepository;

    @Mock
    private BonCommandeAchatSeedService bcSeedService;

    @Mock
    private DemandeAchatRepository daRepository;

    @Mock
    private DemandeAchatSeedService daSeedService;

    @Mock
    private ContratFournisseurRepository contratRepository;

    @Mock
    private ContratFournisseurSousTraitanceSeedService contratSeedService;

    @Mock
    private AppelOffreAchatRepository aoRepository;

    @Mock
    private AppelOffreAchatSeedService aoSeedService;

    private AchatsAnalyticsBucketService service;
    private final UUID tenantId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        TenantContext.setTenantId(tenantId);
        service = new AchatsAnalyticsBucketService(
                bcRepository,
                bcSeedService,
                daRepository,
                daSeedService,
                contratRepository,
                contratSeedService,
                aoRepository,
                aoSeedService);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void compute_returnsMultipleBucketsWithDistinctMetrics() {
        LocalDate from = LocalDate.of(2026, 1, 1);
        LocalDate to = LocalDate.of(2026, 12, 31);

        BonCommandeAchat bcSocA = bc("ch-001", new BigDecimal("100000"), BonCommandeAchat.STATUS_VALIDE);
        BonCommandeAchat bcSocB = bc("ch-002", new BigDecimal("250000"), BonCommandeAchat.STATUS_ENVOYE);

        when(bcRepository.findByTenantIdOrderByCreatedAtDesc(tenantId)).thenReturn(List.of(bcSocA, bcSocB));
        when(daRepository.findByTenantIdOrderByCreatedAtDesc(tenantId)).thenReturn(List.of());
        when(contratRepository.findByTenantIdOrderByCreatedAtDesc(tenantId)).thenReturn(List.of());
        when(aoRepository.findByTenantIdOrderByCreatedAtDesc(tenantId)).thenReturn(List.of());

        AnalyticsBucketResponseDto response =
                service.compute("societe,bu", from, to, "volumeHt,nbBc");

        assertThat(response.getDimensions()).containsExactly("societe", "bu");
        assertThat(response.getRows()).hasSizeGreaterThanOrEqualTo(2);

        long volSocABat = response.getRows().stream()
                .filter(r -> r.getKeys().equals(List.of("SocA", "BU-BAT")))
                .findFirst()
                .map(r -> r.getMetrics().get("volumeHt").longValue())
                .orElse(-1L);
        long volSocBInfra = response.getRows().stream()
                .filter(r -> r.getKeys().equals(List.of("SocB", "BU-INFRA")))
                .findFirst()
                .map(r -> r.getMetrics().get("volumeHt").longValue())
                .orElse(-1L);

        assertThat(volSocABat).isEqualTo(100_000L);
        assertThat(volSocBInfra).isEqualTo(250_000L);
        assertThat(volSocABat).isNotEqualTo(volSocBInfra);
    }

    @Test
    void parseDimensions_defaultsToSocieteAndBu() {
        assertThat(AchatsAnalyticsBucketService.parseDimensions(null))
                .containsExactly("societe", "bu");
    }

    private static BonCommandeAchat bc(String chantierId, BigDecimal totalTtc, String status) {
        return BonCommandeAchat.builder()
                .tenantId(UUID.randomUUID())
                .numero("BC-TEST")
                .fournisseurId("four-1")
                .chantierId(chantierId)
                .dateCreation(LocalDate.of(2026, 3, 15))
                .conditionsPaiement("30j")
                .tvaTaux(new BigDecimal("20"))
                .totalHt(totalTtc)
                .totalTtc(totalTtc)
                .status(status)
                .lignes(List.of())
                .build();
    }
}
