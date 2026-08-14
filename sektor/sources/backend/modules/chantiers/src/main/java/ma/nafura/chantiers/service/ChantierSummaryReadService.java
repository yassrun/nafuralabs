package ma.nafura.chantiers.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import ma.nafura.chantiers.api.dto.BudgetChantierDto;
import ma.nafura.chantiers.api.dto.ChantierSummaryDto;
import ma.nafura.chantiers.domain.model.Chantier;
import ma.nafura.chantiers.repository.ChantierLotRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ChantierSummaryReadService {

    private final ChantierService chantierService;
    private final BudgetChantierService budgetChantierService;
    private final ChantierLotRepository lotRepository;
    private final SituationTravauxService situationTravauxService;

    public ChantierSummaryReadService(
            ChantierService chantierService,
            BudgetChantierService budgetChantierService,
            ChantierLotRepository lotRepository,
            SituationTravauxService situationTravauxService) {
        this.chantierService = chantierService;
        this.budgetChantierService = budgetChantierService;
        this.lotRepository = lotRepository;
        this.situationTravauxService = situationTravauxService;
    }

    @Transactional(readOnly = true)
    public ChantierSummaryDto getSummary(String chantierId) {
        Chantier chantier = chantierService.getById(chantierId);
        BudgetChantierDto budget = budgetChantierService.getByChantierId(chantier.getId());
        long lotsCount = lotRepository.countByTenantIdAndChantierId(tenantId(), chantier.getId());

        BigDecimal prevu = scale(budget.getPrevisionnelHt());
        BigDecimal revise = scale(budget.getReviseHt());
        BigDecimal realise = scale(budget.getRealiseHt());
        BigDecimal marge = revise.subtract(realise);

        BigDecimal avancement = chantier.getAvancementPercent() != null
                ? chantier.getAvancementPercent().setScale(1, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        return ChantierSummaryDto.builder()
                .chantier(chantier)
                .budget(ChantierSummaryDto.BudgetTotals.builder()
                        .prevuHt(prevu)
                        .reviseHt(revise)
                        .realiseHt(realise)
                        .margeHt(marge)
                        .build())
                .avancementPercent(avancement)
                .lotsCount(lotsCount)
                .openSituationsCount(situationTravauxService.countOpenByChantier(chantier.getId()))
                .build();
    }

    private static BigDecimal scale(BigDecimal value) {
        if (value == null) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }
        return value.setScale(2, RoundingMode.HALF_UP);
    }

    private static java.util.UUID tenantId() {
        return TenantContext.getTenantId();
    }
}
