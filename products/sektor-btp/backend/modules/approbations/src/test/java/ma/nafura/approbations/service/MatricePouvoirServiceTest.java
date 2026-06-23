package ma.nafura.approbations.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.approbations.domain.model.MatricePouvoir;
import ma.nafura.approbations.repository.MatricePouvoirRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class MatricePouvoirServiceTest {

    private static final BigDecimal SEUIL_50K = new BigDecimal("50000");
    private static final BigDecimal SEUIL_500K = new BigDecimal("500000");

    @Mock
    private MatricePouvoirRepository repository;

    private MatricePouvoirSeedService seedService;
    private MatricePouvoirService service;

    private final UUID tenantId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        TenantContext.setTenantId(tenantId);
        seedService = new MatricePouvoirSeedService(repository);
        service = new MatricePouvoirService(repository, seedService);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void resolve_selectsDirecteurTravauxBelow50k() {
        stubBcMatrix();

        Optional<MatricePouvoir> row = service.resolve("BC", new BigDecimal("30000"));

        assertThat(row).isPresent();
        assertThat(row.get().getApprobateurRole()).isEqualTo(MatricePouvoirService.ROLE_DIRECTEUR_TRAVAUX);
    }

    @Test
    void resolve_selectsDgBetween50kAnd500k() {
        stubBcMatrix();

        Optional<MatricePouvoir> row = service.resolve("BC", new BigDecimal("100000"));

        assertThat(row).isPresent();
        assertThat(row.get().getApprobateurRole()).isEqualTo(MatricePouvoirService.ROLE_DG);
    }

    @Test
    void resolve_selectsComiteFrom500k() {
        stubBcMatrix();

        Optional<MatricePouvoir> row = service.resolve("BC", new BigDecimal("600000"));

        assertThat(row).isPresent();
        assertThat(row.get().getApprobateurRole()).isEqualTo(MatricePouvoirService.ROLE_COMITE);
    }

    @Test
    void resolve_boundaryAt50kUsesDgTier() {
        stubBcMatrix();

        assertThat(service.resolve("BC", SEUIL_50K))
                .map(MatricePouvoir::getApprobateurRole)
                .contains(MatricePouvoirService.ROLE_DG);
    }

    @Test
    void resolve_boundaryAt500kUsesComiteTier() {
        stubBcMatrix();

        assertThat(service.resolve("BC", SEUIL_500K))
                .map(MatricePouvoir::getApprobateurRole)
                .contains(MatricePouvoirService.ROLE_COMITE);
    }

    @Test
    void resolve_throwsWhenNoRowMatches() {
        when(repository.countByTenantId(tenantId)).thenReturn(1L);
        when(repository.findByTenantIdAndEntityTypeOrderByOrdreAsc(tenantId, "DA")).thenReturn(List.of());

        assertThatThrownBy(() -> service.resolveApprobateurRole("DA", new BigDecimal("1000")))
                .isInstanceOf(IllegalArgumentException.class);
    }

    private void stubBcMatrix() {
        List<MatricePouvoir> rows = List.of(
                MatricePouvoir.builder()
                        .tenantId(tenantId)
                        .entityType("BC")
                        .seuilMin(null)
                        .seuilMax(SEUIL_50K)
                        .approbateurRole(MatricePouvoirService.ROLE_DIRECTEUR_TRAVAUX)
                        .label("BC < 50K MAD")
                        .ordre(1)
                        .build(),
                MatricePouvoir.builder()
                        .tenantId(tenantId)
                        .entityType("BC")
                        .seuilMin(SEUIL_50K)
                        .seuilMax(SEUIL_500K)
                        .approbateurRole(MatricePouvoirService.ROLE_DG)
                        .label("50K – 500K MAD")
                        .ordre(2)
                        .build(),
                MatricePouvoir.builder()
                        .tenantId(tenantId)
                        .entityType("BC")
                        .seuilMin(SEUIL_500K)
                        .seuilMax(null)
                        .approbateurRole(MatricePouvoirService.ROLE_COMITE)
                        .label("BC >= 500K MAD")
                        .ordre(3)
                        .build());

        when(repository.countByTenantId(tenantId)).thenReturn(1L);
        when(repository.findByTenantIdAndEntityTypeOrderByOrdreAsc(tenantId, "BC")).thenReturn(rows);
    }
}
