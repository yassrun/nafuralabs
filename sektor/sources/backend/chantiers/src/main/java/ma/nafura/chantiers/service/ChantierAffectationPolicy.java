package ma.nafura.chantiers.service;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import ma.nafura.chantiers.domain.chantier.ChantierAffectation;
import ma.nafura.chantiers.domain.chantier.ChantierRoleCodes;
import ma.nafura.chantiers.repository.ChantierAffectationRepository;
import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.platform.framework.context.UserContext;
import ma.nafura.rh.domain.employe.Employe;
import ma.nafura.rh.repository.EmployeRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * Staffing authority on a chantier: IAM opens the door, command grade decides
 * who may be appointed. Actor grade is Direction (owner / DG) or the max grade
 * of active affectations on <em>this</em> chantier.
 */
@Service
public class ChantierAffectationPolicy {

    public static final String REFUS_CODE = "chantiers.affectation.interdit";

    private final ChantierAffectationRepository affectationRepository;
    private final EmployeRepository employeRepository;

    public ChantierAffectationPolicy(
            ChantierAffectationRepository affectationRepository, EmployeRepository employeRepository) {
        this.affectationRepository = affectationRepository;
        this.employeRepository = employeRepository;
    }

    @Transactional(readOnly = true)
    public int actorGradeOn(String chantierId) {
        if (UserContext.isOwnerOrSuperAdmin()) {
            return ChantierRoleCodes.COMMAND_GRADE_DIRECTION;
        }
        if (ChantierRoleCodes.commandGrade(UserContext.getUserRole())
                == ChantierRoleCodes.COMMAND_GRADE_DIRECTION) {
            return ChantierRoleCodes.COMMAND_GRADE_DIRECTION;
        }
        UUID userId = UserContext.getUserIdOrNull();
        if (userId == null || chantierId == null || chantierId.isBlank()) {
            return ChantierRoleCodes.COMMAND_GRADE_NONE;
        }
        return employeRepository
                .findByTenantIdAndUserId(TenantContext.getTenantId(), userId)
                .map(Employe::getId)
                .map(employeId -> maxGradeOnChantier(chantierId, employeId))
                .orElse(ChantierRoleCodes.COMMAND_GRADE_NONE);
    }

    /**
     * Active affectation role codes on this chantier. Direction (owner / DG) is
     * not an affectation — callers should use {@link #actorGradeOn} for that.
     */
    @Transactional(readOnly = true)
    public List<String> actorRolesOn(String chantierId) {
        UUID userId = UserContext.getUserIdOrNull();
        if (userId == null || chantierId == null || chantierId.isBlank()) {
            return List.of();
        }
        return employeRepository
                .findByTenantIdAndUserId(TenantContext.getTenantId(), userId)
                .map(Employe::getId)
                .map(employeId -> rolesOnChantier(chantierId, employeId))
                .orElse(List.of());
    }

    @Transactional(readOnly = true)
    public List<String> assignableRoles(String chantierId) {
        return ChantierRoleCodes.rolesCommandableBy(actorGradeOn(chantierId));
    }

    @Transactional(readOnly = true)
    public boolean canMutate(String chantierId, String targetRole) {
        return ChantierRoleCodes.canCommand(actorGradeOn(chantierId), targetRole);
    }

    @Transactional(readOnly = true)
    public void assertCanMutate(String chantierId, String targetRole) {
        if (!canMutate(chantierId, targetRole)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, REFUS_CODE);
        }
    }

    private int maxGradeOnChantier(String chantierId, String employeId) {
        int max = ChantierRoleCodes.COMMAND_GRADE_NONE;
        for (String role : rolesOnChantier(chantierId, employeId)) {
            max = Math.max(max, ChantierRoleCodes.commandGrade(role));
        }
        return max;
    }

    private List<String> rolesOnChantier(String chantierId, String employeId) {
        return affectationRepository
                .findActiveForEmployeOnDate(TenantContext.getTenantId(), employeId, LocalDate.now())
                .stream()
                .filter(aff -> chantierId.equals(aff.getChantierId()))
                .map(ChantierAffectation::getRoleCode)
                .toList();
    }
}
