package ma.nafura.finance.onboarding;

import java.util.UUID;
import ma.nafura.finance.repository.ChartOfAccountRepository;
import ma.nafura.finance.service.ChartOfAccountService;
import ma.nafura.sektor.socle.port.FinanceOnboardingPort;
import org.springframework.stereotype.Service;

@Service
public class FinanceOnboardingAdapter implements FinanceOnboardingPort {

    private final ChartOfAccountRepository chartOfAccountRepository;
    private final ChartOfAccountService chartOfAccountService;

    public FinanceOnboardingAdapter(
            ChartOfAccountRepository chartOfAccountRepository,
            ChartOfAccountService chartOfAccountService) {
        this.chartOfAccountRepository = chartOfAccountRepository;
        this.chartOfAccountService = chartOfAccountService;
    }

    @Override
    public void resetChartToSeed() {
        chartOfAccountService.resetToSeed();
    }

    @Override
    public boolean hasChart(UUID tenantId) {
        return chartOfAccountRepository.countByTenantId(tenantId) > 0;
    }
}
