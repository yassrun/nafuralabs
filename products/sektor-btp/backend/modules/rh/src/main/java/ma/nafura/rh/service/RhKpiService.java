package ma.nafura.rh.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.rh.api.dto.RhKpiDto;
import ma.nafura.rh.domain.model.Employe;
import ma.nafura.rh.domain.model.Pointage;
import ma.nafura.rh.repository.EmployeRepository;
import ma.nafura.rh.repository.PointageRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RhKpiService {

    private final EmployeRepository employeRepository;
    private final EmployeSeedService employeSeedService;
    private final PointageRepository pointageRepository;
    private final PointageSeedService pointageSeedService;

    public RhKpiService(
            EmployeRepository employeRepository,
            EmployeSeedService employeSeedService,
            PointageRepository pointageRepository,
            PointageSeedService pointageSeedService) {
        this.employeRepository = employeRepository;
        this.employeSeedService = employeSeedService;
        this.pointageRepository = pointageRepository;
        this.pointageSeedService = pointageSeedService;
    }

    @Transactional(readOnly = true)
    public RhKpiDto compute() {
        employeSeedService.seedIfEmpty();
        pointageSeedService.seedIfEmpty();
        UUID tenantId = TenantContext.getTenantId();
        List<Employe> employes = employeRepository.findByTenantIdOrderByNomAscPrenomAsc(tenantId);

        int effectifs = (int) employes.stream()
                .filter(e -> Employe.STATUT_ACTIF.equals(e.getStatut()))
                .count();
        int soldes = (int) employes.stream()
                .filter(e -> Employe.STATUT_SOLDE.equals(e.getStatut()))
                .count();

        BigDecimal masseSalarialeYTD = employes.stream()
                .filter(e -> Employe.STATUT_ACTIF.equals(e.getStatut()))
                .map(e -> e.getSalaireBase() != null ? e.getSalaireBase() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .multiply(BigDecimal.valueOf(LocalDate.now().getMonthValue()));

        LocalDate ytdStart = LocalDate.of(LocalDate.now().getYear(), 1, 1);
        List<Pointage> pointages =
                pointageRepository.findByTenantIdAndDateBetweenOrderByDateAscEmployeIdAsc(
                        tenantId, ytdStart, LocalDate.now());
        long absents = pointages.stream()
                .filter(p -> Pointage.MODE_ABSENT.equals(p.getMode())
                        || Pointage.MODE_MALADIE.equals(p.getMode())
                        || Pointage.MODE_CONGE.equals(p.getMode()))
                .count();
        double absenteisme = pointages.isEmpty()
                ? 0.0
                : BigDecimal.valueOf(absents * 100.0 / pointages.size())
                        .setScale(2, RoundingMode.HALF_UP)
                        .doubleValue();

        double rotationAnnuelle = effectifs > 0
                ? BigDecimal.valueOf(soldes * 100.0 / effectifs)
                        .setScale(2, RoundingMode.HALF_UP)
                        .doubleValue()
                : 0.0;

        return RhKpiDto.builder()
                .effectifs(effectifs)
                .masseSalarialeYTD(scale2(masseSalarialeYTD))
                .absenteisme(absenteisme)
                .rotationAnnuelle(rotationAnnuelle)
                .build();
    }

    private static BigDecimal scale2(BigDecimal value) {
        return value.setScale(2, RoundingMode.HALF_UP);
    }
}
