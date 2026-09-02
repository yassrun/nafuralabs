package ma.nafura.socle.chrome.service;

import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.NumberFormat;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import ma.nafura.platform.collaboration.notification.inapp.ErpAlertDismissalService;
import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.sektor.socle.port.bc.ErpChromeHsePort;
import ma.nafura.sektor.socle.port.bc.ErpChromeMarchesPort;
import ma.nafura.socle.chrome.api.dto.ErpChromeDtos.ChromeAlertDto;
import ma.nafura.socle.chrome.api.dto.ErpChromeDtos.ChromeSnapshotResponse;
import ma.nafura.socle.domain.ApprovalRequest;
import ma.nafura.socle.onboarding.api.dto.OnboardingDtos.CompletenessResponse;
import ma.nafura.socle.onboarding.config.OnboardingProperties;
import ma.nafura.socle.onboarding.service.OnboardingCompletenessService;
import ma.nafura.socle.repository.ErpApprovalRequestRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ErpChromeSnapshotService {

    static final int CAUTION_WINDOW_DAYS = 30;
    static final int FORMATION_WINDOW_DAYS = 30;
    static final int FORMATION_ALERT_CAP = 3;

    private final ErpApprovalRequestRepository approvalRepository;
    private final ErpChromeMarchesPort marchesPort;
    private final ErpChromeHsePort hsePort;
    private final ErpAlertDismissalService dismissalService;
    private final OnboardingCompletenessService completenessService;
    private final OnboardingProperties onboardingProperties;

    @Transactional
    public ChromeSnapshotResponse snapshot() {
        UUID tenantId = TenantContext.getTenantId();
        LocalDate today = LocalDate.now();
        NumberFormat amounts = NumberFormat.getNumberInstance(Locale.FRANCE);

        List<ChromeAlertDto> raw = new ArrayList<>();
        collectApprovals(tenantId, raw);
        collectOverdueInvoices(tenantId, today, amounts, raw);
        collectExpiringCautions(tenantId, today, amounts, raw);
        collectExpiringFormations(tenantId, today, raw);

        Set<String> activeIds = new LinkedHashSet<>();
        for (ChromeAlertDto alert : raw) {
            activeIds.add(alert.id());
        }
        try {
            dismissalService.cleanupResolved(List.copyOf(activeIds));
        } catch (RuntimeException ignored) {
            /* best effort */
        }

        Set<String> dismissedKeys;
        try {
            dismissedKeys = dismissalService.dismissedKeysForCurrentUser();
        } catch (RuntimeException ex) {
            dismissedKeys = Set.of();
        }
        final Set<String> dismissed = dismissedKeys;

        List<ChromeAlertDto> visible = raw.stream()
                .filter(a -> !dismissed.contains(a.id()))
                .sorted(alertOrder())
                .toList();

        CompletenessResponse completeness = null;
        if (onboardingProperties.isV2Enabled()) {
            try {
                completeness = completenessService.compute(tenantId);
            } catch (RuntimeException ignored) {
                completeness = null;
            }
        }

        return new ChromeSnapshotResponse(completeness, visible);
    }

    private void collectApprovals(UUID tenantId, List<ChromeAlertDto> raw) {
        try {
            List<ApprovalRequest> rows = approvalRepository
                    .findByTenantIdAndStatusInOrderByDateSoumissionDescCreatedAtDesc(
                            tenantId, List.of(ApprovalRequest.STATUS_EN_ATTENTE));
            for (ApprovalRequest a : rows) {
                String urgence = "HAUTE".equals(a.getUrgence()) || "CRITIQUE".equals(a.getUrgence())
                        ? "HAUTE"
                        : "NORMALE";
                String summary = a.getEntitySummary() == null ? "" : a.getEntitySummary();
                if (summary.length() > 100) {
                    summary = summary.substring(0, 100);
                }
                raw.add(new ChromeAlertDto(
                        a.getId(),
                        "APPROBATION",
                        a.getEntityRef() + " attend votre validation",
                        null,
                        null,
                        summary,
                        urgence,
                        "/approbations?highlight=" + URLEncoder.encode(a.getId(), StandardCharsets.UTF_8),
                        a.getDateSoumission() == null ? "" : a.getDateSoumission().toString()));
            }
        } catch (RuntimeException ignored) {
            /* empty fallback */
        }
    }

    private void collectOverdueInvoices(
            UUID tenantId, LocalDate today, NumberFormat amounts, List<ChromeAlertDto> raw) {
        try {
            for (ErpChromeMarchesPort.OverdueInvoice f : marchesPort.overdueInvoices(tenantId, today)) {
                if (f.dateEcheance() == null) {
                    continue;
                }
                long jours = Math.max(0, ChronoUnit.DAYS.between(f.dateEcheance(), today));
                BigDecimal net = f.netAPayer() == null ? BigDecimal.ZERO : f.netAPayer();
                raw.add(new ChromeAlertDto(
                        "facture-" + f.id(),
                        "FACTURE_RETARD",
                        null,
                        "shared.alerts.factureLate",
                        Map.of("numero", f.numero() == null ? "" : f.numero(), "count", jours),
                        "Client : " + nullToEmpty(f.clientNom()) + " — Net à payer : " + amounts.format(net)
                                + " MAD",
                        jours > 30 ? "HAUTE" : "NORMALE",
                        "/marches/factures/" + f.id(),
                        f.dateEcheance().toString()));
            }
        } catch (RuntimeException ignored) {
            /* empty fallback */
        }
    }

    private void collectExpiringCautions(
            UUID tenantId, LocalDate today, NumberFormat amounts, List<ChromeAlertDto> raw) {
        try {
            for (ErpChromeMarchesPort.ExpiringCaution c :
                    marchesPort.expiringCautions(tenantId, today, CAUTION_WINDOW_DAYS)) {
                if (c.dateExpiration() == null) {
                    continue;
                }
                long daysLeft = ChronoUnit.DAYS.between(today, c.dateExpiration());
                BigDecimal montant = c.montant() == null ? BigDecimal.ZERO : c.montant();
                raw.add(new ChromeAlertDto(
                        "caution-" + c.id(),
                        "CAUTION_EXPIRY",
                        null,
                        "shared.alerts.cautionExpiry",
                        Map.of("numero", c.numero() == null ? "" : c.numero(), "count", daysLeft),
                        nullToEmpty(c.banqueNom()) + " — " + amounts.format(montant) + " MAD",
                        daysLeft <= 7 ? "HAUTE" : "NORMALE",
                        "/marches/contrats/" + nullToEmpty(c.contratMarcheId()),
                        c.dateExpiration().toString()));
            }
        } catch (RuntimeException ignored) {
            /* empty fallback */
        }
    }

    private void collectExpiringFormations(UUID tenantId, LocalDate today, List<ChromeAlertDto> raw) {
        try {
            LocalDate to = today.plusDays(FORMATION_WINDOW_DAYS);
            List<ErpChromeHsePort.ExpiringFormation> rows =
                    hsePort.expiringFormations(tenantId, today, to);
            int n = Math.min(FORMATION_ALERT_CAP, rows.size());
            for (int i = 0; i < n; i++) {
                ErpChromeHsePort.ExpiringFormation f = rows.get(i);
                LocalDate expiry = f.expiryDate() == null ? today : f.expiryDate();
                long daysLeft = ChronoUnit.DAYS.between(today, expiry);
                String formateur = f.formateur();
                raw.add(new ChromeAlertDto(
                        "formation-" + f.id(),
                        "NC_CRITIQUE",
                        "Formation à renouveler : " + nullToEmpty(f.titre()),
                        null,
                        null,
                        formateur != null && !formateur.isBlank()
                                ? "Formateur : " + formateur
                                : "Validité proche",
                        daysLeft <= 7 ? "HAUTE" : "NORMALE",
                        "/hse/formations/" + f.id(),
                        expiry.toString()));
            }
        } catch (RuntimeException ignored) {
            /* empty fallback */
        }
    }

    private static Comparator<ChromeAlertDto> alertOrder() {
        return (a, b) -> {
            if (!a.urgence().equals(b.urgence())) {
                return "HAUTE".equals(a.urgence()) ? -1 : 1;
            }
            return b.date().compareTo(a.date());
        };
    }

    private static String nullToEmpty(String value) {
        return value == null ? "" : value;
    }
}
