package ma.nafura.chantiers.service;

import java.util.List;
import ma.nafura.chantiers.api.dto.PlanningCapacitesDto;
import ma.nafura.chantiers.domain.chantier.ChantierRoleCodes;
import ma.nafura.platform.framework.context.UserContext;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * Planning domain policy (SEKTOR-327). IAM ({@code chantiers.read} /
 * {@code create} / {@code update}) opens the door; command grade + active
 * affectation decide the métier capabilities. Technical ADMIN is not a métier
 * signature. A01–A03 (week, report, publication) are out of L1.
 */
@Service
public class PlanningPolicy {

    public static final String REFUS_CODE = "chantiers.planning.interdit";

    private final ChantierAffectationPolicy affectationPolicy;

    public PlanningPolicy(ChantierAffectationPolicy affectationPolicy) {
        this.affectationPolicy = affectationPolicy;
    }

    @Transactional(readOnly = true)
    public PlanningCapacitesDto capacites(String chantierId) {
        return resolve(chantierId);
    }

    @Transactional(readOnly = true)
    public void assertCanRead(String chantierId) {
        refuseUnless(resolve(chantierId).isLire());
    }

    @Transactional(readOnly = true)
    public void assertCanEditStructure(String chantierId) {
        refuseUnless(resolve(chantierId).isEditerStructure());
    }

    @Transactional(readOnly = true)
    public void assertCanAdministerCalendar(String chantierId) {
        refuseUnless(resolve(chantierId).isAdministrerCalendrier());
    }

    public boolean canPrepareWeek(String chantierId) {
        var roles=affectationPolicy.actorRolesOn(chantierId);
        return canValidateWeek(chantierId) || (roles!=null && roles.stream()
                .map(ChantierRoleCodes::normalize).anyMatch(ChantierRoleCodes.BTP_CHEF_CHANTIER::equals));
    }

    public boolean canValidateWeek(String chantierId) {
        return affectationPolicy.actorGradeOn(chantierId)>=ChantierRoleCodes.COMMAND_GRADE_CONDUCTEUR;
    }

    public void assertCanPrepareWeek(String chantierId) { refuseUnless(canPrepareWeek(chantierId)); }
    public void assertCanValidateWeek(String chantierId) { refuseUnless(canValidateWeek(chantierId)); }

    static PlanningCapacitesDto fromGradeAndRoles(int grade, List<String> roles, String iamRole) {
        if (grade >= ChantierRoleCodes.COMMAND_GRADE_DIRECTION) {
            return PlanningCapacitesDto.applyAll();
        }
        if (grade > ChantierRoleCodes.COMMAND_GRADE_NONE) {
            boolean editer = grade >= ChantierRoleCodes.PLANNING_STRUCTURE_APPLY_MIN;
            boolean administrer = grade >= ChantierRoleCodes.PLANNING_CALENDAR_ADMIN_MIN;
            boolean sitePlanning = hasSitePlanningRole(roles);
            boolean proposeStructure = !editer && sitePlanning;
            boolean proposeCalendrier = !administrer && (editer || sitePlanning);
            return PlanningCapacitesDto.builder()
                    .lire(true)
                    .editerStructure(editer)
                    .proposerStructure(proposeStructure)
                    .administrerCalendrier(administrer)
                    .proposerCalendrier(proposeCalendrier)
                    .gererVues(true)
                    .build();
        }
        if (ChantierRoleCodes.BTP_DAF.equals(ChantierRoleCodes.normalize(iamRole))) {
            return PlanningCapacitesDto.readOnly();
        }
        return PlanningCapacitesDto.none();
    }

    private PlanningCapacitesDto resolve(String chantierId) {
        int grade = affectationPolicy.actorGradeOn(chantierId);
        List<String> roles = affectationPolicy.actorRolesOn(chantierId);
        return fromGradeAndRoles(grade, roles, UserContext.getUserRole());
    }

    private static boolean hasSitePlanningRole(List<String> roles) {
        if (roles == null) {
            return false;
        }
        for (String role : roles) {
            String normalized = ChantierRoleCodes.normalize(role);
            if (ChantierRoleCodes.BTP_CHEF_CHANTIER.equals(normalized)
                    || ChantierRoleCodes.BTP_INGENIEUR.equals(normalized)) {
                return true;
            }
        }
        return false;
    }

    private static void refuseUnless(boolean allowed) {
        if (!allowed) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, REFUS_CODE);
        }
    }
}
