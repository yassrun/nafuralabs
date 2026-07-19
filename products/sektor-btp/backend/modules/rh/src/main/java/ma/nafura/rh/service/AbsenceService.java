package ma.nafura.rh.service;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.rh.domain.model.Conge;
import ma.nafura.rh.domain.model.Employe;
import ma.nafura.rh.repository.CongeRepository;
import ma.nafura.rh.repository.EmployeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Availability of an RH resource (or linked app user) for a given date.
 */
@Service
public class AbsenceService {

    private static final Set<String> ABSENCE_STATUSES = Set.of(
            Conge.STATUS_APPROUVE, Conge.STATUS_EN_COURS, Conge.STATUS_SOLDE);

    private final CongeRepository congeRepository;
    private final EmployeRepository employeRepository;

    public AbsenceService(CongeRepository congeRepository, EmployeRepository employeRepository) {
        this.congeRepository = congeRepository;
        this.employeRepository = employeRepository;
    }

    @Transactional(readOnly = true)
    public boolean isEmployeAvailable(String employeId, LocalDate date) {
        if (employeId == null || date == null) {
            return false;
        }
        UUID tenantId = TenantContext.getTenantId();
        Employe employe = employeRepository.findByIdAndTenantId(employeId, tenantId).orElse(null);
        if (employe == null) {
            return false;
        }
        if (!Employe.STATUT_ACTIF.equalsIgnoreCase(employe.getStatut())) {
            return false;
        }
        List<Conge> covering = congeRepository
                .findByTenantIdAndStatusInAndDateDebutLessThanEqualAndDateFinGreaterThanEqualOrderByDateDebutAsc(
                        tenantId, ABSENCE_STATUSES, date, date);
        return covering.stream().noneMatch(c -> employeId.equals(c.getEmployeId()));
    }

    @Transactional(readOnly = true)
    public boolean isUserAvailable(UUID userId, LocalDate date) {
        if (userId == null) {
            return false;
        }
        return employeRepository
                .findByTenantIdAndUserId(TenantContext.getTenantId(), userId)
                .map(e -> isEmployeAvailable(e.getId(), date))
                .orElse(true); // no employe link → treat as available (entreprise roles)
    }
}
