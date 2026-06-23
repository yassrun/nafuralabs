package ma.nafura.finance.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.UUID;
import ma.nafura.finance.api.dto.FinanceKpiDto;
import ma.nafura.finance.domain.model.BankAccount;
import ma.nafura.finance.repository.BankAccountRepository;
import ma.nafura.finance.service.bank.BankAccountSeedService;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class FinanceKpiService {

    private static final BigDecimal STUB_BFR = new BigDecimal("1250000");
    private static final BigDecimal STUB_DETTES = new BigDecimal("890000");

    private final BankAccountRepository bankAccountRepository;
    private final BankAccountSeedService bankAccountSeedService;

    public FinanceKpiService(
            BankAccountRepository bankAccountRepository, BankAccountSeedService bankAccountSeedService) {
        this.bankAccountRepository = bankAccountRepository;
        this.bankAccountSeedService = bankAccountSeedService;
    }

    @Transactional(readOnly = true)
    public FinanceKpiDto compute() {
        bankAccountSeedService.ensureTenantDefaults();
        UUID tenantId = TenantContext.getTenantId();
        List<BankAccount> accounts = bankAccountRepository.findByTenantIdOrderByCodeAsc(tenantId);

        BigDecimal tresorerie = accounts.stream()
                .filter(a -> Boolean.TRUE.equals(a.getIsActive()))
                .map(a -> a.getOpeningBalance() != null ? a.getOpeningBalance() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        double ratioLiquidite = tresorerie.signum() > 0 ? 1.35 : 0.0;

        return FinanceKpiDto.builder()
                .tresorerieCourante(scale2(tresorerie))
                .ratioLiquidite(ratioLiquidite)
                .bfr(scale2(STUB_BFR))
                .dettesFournisseurs(scale2(STUB_DETTES))
                .build();
    }

    private static BigDecimal scale2(BigDecimal value) {
        return value.setScale(2, RoundingMode.HALF_UP);
    }
}
