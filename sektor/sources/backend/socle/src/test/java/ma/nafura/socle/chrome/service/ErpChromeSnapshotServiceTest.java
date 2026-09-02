package ma.nafura.socle.chrome.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import ma.nafura.platform.collaboration.notification.inapp.ErpAlertDismissalService;
import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.sektor.socle.port.bc.ErpChromeHsePort;
import ma.nafura.sektor.socle.port.bc.ErpChromeMarchesPort;
import ma.nafura.socle.chrome.api.dto.ErpChromeDtos.ChromeAlertDto;
import ma.nafura.socle.chrome.api.dto.ErpChromeDtos.ChromeSnapshotResponse;
import ma.nafura.socle.domain.ApprovalRequest;
import ma.nafura.socle.onboarding.api.dto.OnboardingDtos.CompletenessResponse;
import ma.nafura.socle.onboarding.api.dto.OnboardingDtos.CompletenessSectionDto;
import ma.nafura.socle.onboarding.config.OnboardingProperties;
import ma.nafura.socle.onboarding.service.OnboardingCompletenessService;
import ma.nafura.socle.repository.ErpApprovalRequestRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ErpChromeSnapshotServiceTest {

    @Mock
    private ErpApprovalRequestRepository approvalRepository;

    @Mock
    private ErpChromeMarchesPort marchesPort;

    @Mock
    private ErpChromeHsePort hsePort;

    @Mock
    private ErpAlertDismissalService dismissalService;

    @Mock
    private OnboardingCompletenessService completenessService;

    private OnboardingProperties onboardingProperties;
    private ErpChromeSnapshotService service;
    private final UUID tenantId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        TenantContext.setTenantId(tenantId);
        onboardingProperties = new OnboardingProperties();
        onboardingProperties.setV2Enabled(true);
        service = new ErpChromeSnapshotService(
                approvalRepository,
                marchesPort,
                hsePort,
                dismissalService,
                completenessService,
                onboardingProperties);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void snapshotAssemblesAlertsFiltersDismissedAndCompleteness() {
        ApprovalRequest pending = ApprovalRequest.builder()
                .id("appr-1")
                .entityRef("DA-9")
                .entitySummary("Achat béton")
                .urgence("HAUTE")
                .status(ApprovalRequest.STATUS_EN_ATTENTE)
                .dateSoumission(LocalDate.now().minusDays(1))
                .build();
        when(approvalRepository.findByTenantIdAndStatusInOrderByDateSoumissionDescCreatedAtDesc(
                        eq(tenantId), eq(List.of(ApprovalRequest.STATUS_EN_ATTENTE))))
                .thenReturn(List.of(pending));

        LocalDate overdueDay = LocalDate.now().minusDays(40);
        when(marchesPort.overdueInvoices(eq(tenantId), any(LocalDate.class)))
                .thenReturn(List.of(new ErpChromeMarchesPort.OverdueInvoice(
                        "fac-1", "FAC-1", "MOA", new BigDecimal("1500"), overdueDay)));
        when(marchesPort.expiringCautions(eq(tenantId), any(LocalDate.class), anyInt())).thenReturn(List.of());
        when(hsePort.expiringFormations(eq(tenantId), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(List.of());
        when(dismissalService.dismissedKeysForCurrentUser()).thenReturn(Set.of("facture-fac-1"));
        when(completenessService.compute(tenantId))
                .thenReturn(new CompletenessResponse(100, List.of(new CompletenessSectionDto("preset", "Preset", true, 25))));

        ChromeSnapshotResponse snap = service.snapshot();

        assertThat(snap.completeness()).isNotNull();
        assertThat(snap.completeness().score()).isEqualTo(100);
        assertThat(snap.alerts()).extracting(ChromeAlertDto::id).containsExactly("appr-1");
        assertThat(snap.alerts().get(0).type()).isEqualTo("APPROBATION");
        verify(dismissalService).cleanupResolved(List.of("appr-1", "facture-fac-1"));
    }

    @Test
    void snapshotOmitsCompletenessWhenOnboardingDisabled() {
        onboardingProperties.setV2Enabled(false);
        when(approvalRepository.findByTenantIdAndStatusInOrderByDateSoumissionDescCreatedAtDesc(
                        any(), any()))
                .thenReturn(List.of());
        when(marchesPort.overdueInvoices(any(), any())).thenReturn(List.of());
        when(marchesPort.expiringCautions(any(), any(), anyInt())).thenReturn(List.of());
        when(hsePort.expiringFormations(any(), any(), any())).thenReturn(List.of());
        when(dismissalService.dismissedKeysForCurrentUser()).thenReturn(Set.of());

        ChromeSnapshotResponse snap = service.snapshot();

        assertThat(snap.completeness()).isNull();
        assertThat(snap.alerts()).isEmpty();
    }
}
