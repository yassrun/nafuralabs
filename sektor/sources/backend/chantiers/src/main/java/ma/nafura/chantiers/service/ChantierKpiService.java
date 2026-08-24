package ma.nafura.chantiers.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import ma.nafura.chantiers.api.dto.BudgetArbreDto;
import ma.nafura.chantiers.api.dto.ChantierKpiDto;
import ma.nafura.chantiers.domain.chantier.Chantier;
import ma.nafura.chantiers.repository.ChantierRepository;
import ma.nafura.chantiers.seeders.ChantierSeedService;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

/**
 * Les KPI du portefeuille, lus sur l'arbre de chaque chantier (AC-8, AC-9).
 *
 * <p>Le réel ne vient plus d'un agrégat stocké : il est la somme des coûts imputés sur les nœuds.
 * La marge et l'alerte budget se lisent au même endroit que dans l'écran d'un chantier — il n'y a
 * plus deux chemins qui pouvaient donner deux réponses.
 */
@Service
public class ChantierKpiService {

    private final ChantierRepository chantierRepository;
    private final ChantierSeedService chantierSeedService;
    private final BudgetArbreService budgetArbreService;

    public ChantierKpiService(
            ChantierRepository chantierRepository,
            ChantierSeedService chantierSeedService,
            BudgetArbreService budgetArbreService) {
        this.chantierRepository = chantierRepository;
        this.chantierSeedService = chantierSeedService;
        this.budgetArbreService = budgetArbreService;
    }

    @Transactional(readOnly = true)
    public ChantierKpiDto compute(String societeId) {
        chantierSeedService.seedIfEmpty();
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
            BigDecimal montant = chantier.getMontantHt() != null ? chantier.getMontantHt() : BigDecimal.ZERO;
            totalCA = totalCA.add(montant);

            BudgetArbreDto.TotauxDto totaux = budgetArbreService.lireArbre(chantier.getId()).getTotaux();
            totalMarges = totalMarges.add(montant.subtract(nz(totaux.getDebourseReelHt())));

            if (chantier.getDateFinPrevue() != null && chantier.getDateFinPrevue().isBefore(today)) {
                alertesRetard++;
            }
            // Alerte budget : on a dépensé plus que ce qu'on avait prévu de dépenser.
            if (nz(totaux.getDebourseReelHt()).compareTo(nz(totaux.getDebourseReviseHt())) > 0) {
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

    private static BigDecimal nz(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }

    private static BigDecimal scale2(BigDecimal value) {
        return value.setScale(2, RoundingMode.HALF_UP);
    }
}
