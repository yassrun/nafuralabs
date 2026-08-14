package ma.nafura.chantiers.service;

import java.time.LocalDate;
import java.util.Collections;
import java.util.HashSet;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.platform.framework.context.UserContext;
import ma.nafura.rh.domain.employe.Employe;
import ma.nafura.rh.repository.EmployeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Resolves which chantiers the current user may access.
 * Users with {@code chantiers.viewAll} (or SUPER_ADMIN) see all tenant chantiers;
 * others are limited to active affectations of their linked employe.
 */
@Service
public class ChantierScopeService {

    public static final String PERMISSION_VIEW_ALL = "chantiers.viewAll";

    private final EmployeRepository employeRepository;
    private final ChantierAffectationService affectationService;

    public ChantierScopeService(
            EmployeRepository employeRepository, ChantierAffectationService affectationService) {
        this.employeRepository = employeRepository;
        this.affectationService = affectationService;
    }

    public boolean canViewAll() {
        return UserContext.isSuperAdmin() || UserContext.hasPermission(PERMISSION_VIEW_ALL);
    }

    /**
     * @return empty Optional when the user can view all; otherwise the allowed chantier ids
     *     (may be empty if the user has no affectation / no employe link).
     */
    @Transactional(readOnly = true)
    public Optional<Set<String>> allowedChantierIdsOrUnrestricted() {
        if (canViewAll()) {
            return Optional.empty();
        }
        return Optional.of(resolveAssignedChantierIds());
    }

    @Transactional(readOnly = true)
    public boolean canAccessChantier(String chantierId) {
        if (!org.springframework.util.StringUtils.hasText(chantierId)) {
            return false;
        }
        if (canViewAll()) {
            return true;
        }
        return resolveAssignedChantierIds().contains(chantierId.trim());
    }

    @Transactional(readOnly = true)
    public void assertCanAccess(String chantierId) {
        if (!canAccessChantier(chantierId)) {
            throw new IllegalArgumentException("Chantier not found or access denied");
        }
    }

    private Set<String> resolveAssignedChantierIds() {
        UUID userId = UserContext.getUserIdOrNull();
        if (userId == null) {
            return Collections.emptySet();
        }
        UUID tenantId = TenantContext.getTenantId();
        Optional<Employe> employe = employeRepository.findByTenantIdAndUserId(tenantId, userId);
        if (employe.isEmpty()) {
            return Collections.emptySet();
        }
        return new HashSet<>(affectationService.findChantierIdsForEmploye(employe.get().getId(), LocalDate.now()));
    }
}
