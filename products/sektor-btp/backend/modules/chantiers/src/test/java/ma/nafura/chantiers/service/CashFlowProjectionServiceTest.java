package ma.nafura.chantiers.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.UUID;
import ma.nafura.achats.repository.FactureFournisseurRepository;
import ma.nafura.chantiers.api.dto.CashFlowProjectionMoisDto;
import ma.nafura.chantiers.repository.ChantierRepository;
import ma.nafura.chantiers.repository.SituationTravauxRepository;
import ma.nafura.marches.domain.model.FactureMarche;
import ma.nafura.marches.repository.FactureMarcheRepository;
import ma.nafura.marches.service.FactureMarcheSeedService;
import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.rh.repository.FichePaieRepository;
import ma.nafura.rh.service.FichePaieSeedService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class CashFlowProjectionServiceTest {

    @Mock
    private FactureMarcheRepository factureMarcheRepository;

    @Mock
    private FactureMarcheSeedService factureMarcheSeedService;

    @Mock
    private FactureFournisseurRepository factureFournisseurRepository;

    @Mock
    private SituationTravauxRepository situationRepository;

    @Mock
    private ChantierRepository chantierRepository;

    @Mock
    private ChantierSeedService chantierSeedService;

    @Mock
    private FichePaieRepository fichePaieRepository;

    @Mock
    private FichePaieSeedService fichePaieSeedService;

    private CashFlowProjectionService service;
    private final UUID tenantId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        TenantContext.setTenantId(tenantId);
        service = new CashFlowProjectionService(
                factureMarcheRepository,
                factureMarcheSeedService,
                factureFournisseurRepository,
                situationRepository,
                chantierRepository,
                chantierSeedService,
                fichePaieRepository,
                fichePaieSeedService);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void project_monthlyAmountsAreNotFlat() {
        FactureMarche may = facture("fm-may", LocalDate.of(2026, 5, 31), new BigDecimal("5707080"), FactureMarche.STATUS_ACCEPTEE);
        FactureMarche june = facture("fm-jun", LocalDate.of(2026, 6, 30), new BigDecimal("7241916"), FactureMarche.STATUS_EMISE);
        FactureMarche july = facture("fm-jul", LocalDate.of(2026, 7, 15), new BigDecimal("4117575"), FactureMarche.STATUS_EMISE);

        when(factureMarcheRepository.findByTenantIdOrderByDateEmissionDescCreatedAtDesc(tenantId))
                .thenReturn(List.of(may, june, july));
        when(factureFournisseurRepository.findByTenantIdOrderByCreatedAtDesc(tenantId)).thenReturn(List.of());
        when(situationRepository.findByTenantId(tenantId)).thenReturn(List.of());
        when(chantierRepository.findByTenantIdOrderByCodeAsc(tenantId)).thenReturn(List.of());
        when(fichePaieRepository.findByTenantIdOrderByMoisDescNumeroDesc(tenantId)).thenReturn(List.of());

        List<CashFlowProjectionMoisDto> rows =
                service.project(YearMonth.of(2026, 5), YearMonth.of(2026, 7), null);

        assertThat(rows).hasSize(3);
        assertThat(rows.get(0).getEncaissements()).isNotEqualByComparingTo(rows.get(1).getEncaissements());
        assertThat(rows.get(1).getDecaissements()).isNotEqualByComparingTo(rows.get(2).getDecaissements());
        assertThat(rows.get(0).getSoldeCloture()).isNotEqualByComparingTo(rows.get(2).getSoldeCloture());
    }

    private static FactureMarche facture(String id, LocalDate echeance, BigDecimal netAPayer, String status) {
        return FactureMarche.builder()
                .id(id)
                .tenantId(UUID.randomUUID())
                .numero("FM-TEST")
                .contratMarcheId("mar-001")
                .montantBrutHt(netAPayer)
                .avanceDeduiteHt(BigDecimal.ZERO)
                .retenueGarantieHt(BigDecimal.ZERO)
                .netHt(netAPayer)
                .tvaTaux(new BigDecimal("20"))
                .tvaMontant(BigDecimal.ZERO)
                .netTtc(netAPayer)
                .retenueSourceTaux(BigDecimal.ZERO)
                .retenueSourceMontant(BigDecimal.ZERO)
                .timbreFiscal(BigDecimal.ZERO)
                .netAPayer(netAPayer)
                .dateEcheance(echeance)
                .status(status)
                .build();
    }
}
