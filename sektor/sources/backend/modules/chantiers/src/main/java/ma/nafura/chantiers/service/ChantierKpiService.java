package ma.nafura.chantiers.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import ma.nafura.chantiers.api.dto.ChantierKpiDto;
import ma.nafura.chantiers.domain.model.BudgetChantier;
import ma.nafura.chantiers.domain.model.BudgetLigne;
import ma.nafura.chantiers.domain.model.Chantier;
import ma.nafura.chantiers.repository.BudgetChantierRepository;
import ma.nafura.chantiers.repository.BudgetLigneRepository;
import ma.nafura.chantiers.repository.ChantierRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class ChantierKpiService {

    private final ChantierRepository chantierRepository;
    private final ChantierSeedService chantierSeedService;
    private final BudgetChantierRepository budgetChantierRepository;
    private final BudgetLigneRepository budgetLigneRepository;
    private final BudgetChantierSeedService budgetChantierSeedService;

    public ChantierKpiService(
            ChantierRepository chantierRepository,
            ChantierSeedService chantierSeedService,
            BudgetChantierRepository budgetChantierRepository,
            BudgetLigneRepository budgetLigneRepository,
            BudgetChantierSeedService budgetChantierSeedService) {
        this.chantierRepository = chantierRepository;
        this.chantierSeedService = chantierSeedService;
        this.budgetChantierRepository = budgetChantierRepository;
        this.budgetLigneRepository = budgetLigneRepository;
        this.budgetChantierSeedService = budgetChantierSeedService;
    }

    @Transactional(readOnly = true)
    public ChantierKpiDto compute(String societeId) {
        chantierSeedService.seedIfEmpty();
        budgetChantierSeedService.seedIfEmpty();
        UUID tenantId = TenantContext.getTenantId();
        List<Chantier> chantiers = chantierRepository.findByTenantIdOrderByCodeAsc(tenantId);
        if (StringUtils.hasText(societeId)) {
            String sid = societeId.trim();
            chantiers = chantiers.stream().filter(c -> sid.equals(c.getSocieteId())).toList();
        }

        LocalDate today = LocalDate.now();
        int nbActifs = 0;
        BigDecimal totalCA = BigDecimal.ZERO;
        BigDecimal totalMarges = BigDecimal.ZERO;
        int alertesBudget = 0;
        int alertesRetard = 0;

        for (Chantier chantier : chantiers) {
            if (!Chantier.STATUS_EN_COURS.equals(chantier.getStatus())) {
                continue;
            }
            nbActifs++;
            BigDecimal budget = chantier.getMontantHt() != null ? chantier.getMontantHt() : BigDecimal.ZERO;
            totalCA = totalCA.add(budget);
            BigDecimal marge = budget.subtract(resolveRealiseHt(tenantId, chantier.getId()));
            totalMarges = totalMarges.add(marge);

            if (chantier.getDateFinPrevue() != null && chantier.getDateFinPrevue().isBefore(today)) {
                alertesRetard++;
            }
            if (isBudgetAlert(tenantId, chantier.getId())) {
                alertesBudget++;
            }
        }

        return ChantierKpiDto.builder()
                .nbActifs(nbActifs)
                .totalCA(scale2(totalCA))
                .totalMarges(scale2(totalMarges))
                .alertesBudget(alertesBudget)
                .alertesRetard(alertesRetard)
                .build();
    }

    private boolean isBudgetAlert(UUID tenantId, String chantierId) {
        return budgetChantierRepository
                .findByTenantIdAndChantierId(tenantId, chantierId)
                .map(budget -> {
                    List<BudgetLigne> lignes =
                            budgetLigneRepository.findByTenantIdAndBudgetChantierIdOrderByOrdreAscRubriqueAsc(
                                    tenantId, budget.getId());
                    BigDecimal revise = lignes.stream()
                            .map(BudgetLigne::getReviseHt)
                            .filter(v -> v != null)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                    if (revise.signum() <= 0) {
                        revise = budget.getReviseHt() != null ? budget.getReviseHt() : BigDecimal.ZERO;
                    }
                    BigDecimal realise = lignes.stream()
                            .map(BudgetLigne::getRealiseHt)
                            .filter(v -> v != null)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                    return realise.compareTo(revise) > 0;
                })
                .orElse(false);
    }

    private BigDecimal resolveRealiseHt(UUID tenantId, String chantierId) {
        return budgetChantierRepository
                .findByTenantIdAndChantierId(tenantId, chantierId)
                .map(budget -> budgetLigneRepository
                        .findByTenantIdAndBudgetChantierIdOrderByOrdreAscRubriqueAsc(tenantId, budget.getId())
                        .stream()
                        .map(BudgetLigne::getRealiseHt)
                        .filter(v -> v != null)
                        .reduce(BigDecimal.ZERO, BigDecimal::add))
                .orElse(BigDecimal.ZERO);
    }

    private static BigDecimal scale2(BigDecimal value) {
        return value.setScale(2, RoundingMode.HALF_UP);
    }
}
