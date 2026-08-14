package ma.nafura.chantiers.service;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;
import lombok.Builder;
import lombok.Value;
import ma.nafura.chantiers.domain.chantier.ChantierRoleCodes;
import ma.nafura.chantiers.domain.chantier.ChantierAffectation;
import ma.nafura.rh.domain.employe.Employe;
import ma.nafura.rh.repository.EmployeRepository;
import ma.nafura.rh.service.AbsenceService;
import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.sektor.socle.port.ApproverResolutionPort;
import ma.nafura.sektor.socle.port.ApproverResolutionPort.Resolved;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

/**
 * Resolves a concrete approver (user) for a role, optionally scoped to a chantier,
 * with absence fallback up the hierarchy.
 */
@Service
public class ApproverResolutionService implements ApproverResolutionPort {

    private final ChantierAffectationService affectationService;
    private final EmployeRepository employeRepository;
    private final AbsenceService absenceService;

    public ApproverResolutionService(
            ChantierAffectationService affectationService,
            EmployeRepository employeRepository,
            AbsenceService absenceService) {
        this.affectationService = affectationService;
        this.employeRepository = employeRepository;
        this.absenceService = absenceService;
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<Resolved> resolve(String roleCode, String chantierId, LocalDate onDate) {
        Optional<ResolvedApprover> found = resolveInternal(roleCode, chantierId, onDate);
        return found.map(ra -> new Resolved(ra.getRoleCode(), ra.getDisplayName(), ra.getUserId()));
    }

    @Override
    public String normalizeRole(String roleRef) {
        return ChantierRoleCodes.normalize(roleRef);
    }

    @Override
    public String labelRole(String roleRef) {
        return ChantierRoleCodes.label(roleRef);
    }

    @Transactional(readOnly = true)
    public Optional<ResolvedApprover> resolveInternal(String roleCode, String chantierId, LocalDate onDate) {
        String normalized = ChantierRoleCodes.normalize(roleCode);
        if (normalized == null) {
            return Optional.empty();
        }
        LocalDate date = onDate != null ? onDate : LocalDate.now();

        if (ChantierRoleCodes.isChantierScoped(normalized) && StringUtils.hasText(chantierId)) {
            Optional<ResolvedApprover> fromAffectation =
                    resolveFromAffectationWithFallback(normalized, chantierId.trim(), date);
            if (fromAffectation.isPresent()) {
                return fromAffectation;
            }
        }

        // Entreprise / no chantier: return role label only (notifications still use role codes)
        return Optional.of(ResolvedApprover.builder()
                .roleCode(normalized)
                .displayName(ChantierRoleCodes.label(normalized))
                .userId(null)
                .employeId(null)
                .build());
    }

    private Optional<ResolvedApprover> resolveFromAffectationWithFallback(
            String roleCode, String chantierId, LocalDate date) {
        String current = roleCode;
        while (current != null) {
            Optional<ResolvedApprover> candidate = findAvailableTitulaire(current, chantierId, date);
            if (candidate.isPresent()) {
                return candidate;
            }
            current = ChantierRoleCodes.nextHigherRole(current);
            if (current != null && !ChantierRoleCodes.isChantierScoped(current) && !StringUtils.hasText(chantierId)) {
                break;
            }
        }
        return Optional.empty();
    }

    private Optional<ResolvedApprover> findAvailableTitulaire(String roleCode, String chantierId, LocalDate date) {
        Optional<ChantierAffectation> aff =
                affectationService.findActiveTitulaire(chantierId, roleCode, date);
        if (aff.isEmpty()) {
            return Optional.empty();
        }
        Employe employe = employeRepository
                .findByIdAndTenantId(aff.get().getEmployeId(), TenantContext.getTenantId())
                .orElse(null);
        if (employe == null) {
            return Optional.empty();
        }
        if (!absenceService.isEmployeAvailable(employe.getId(), date)) {
            return Optional.empty();
        }
        String displayName = (employe.getPrenom() + " " + employe.getNom()).trim();
        return Optional.of(ResolvedApprover.builder()
                .roleCode(roleCode)
                .displayName(displayName)
                .userId(employe.getUserId())
                .employeId(employe.getId())
                .build());
    }

    @Value
    @Builder
    public static class ResolvedApprover {
        String roleCode;
        String displayName;
        UUID userId;
        String employeId;
    }
}
