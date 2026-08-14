package ma.nafura.approbations.service;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import ma.nafura.approbations.api.request.DelegationApprobationCreateDto;
import ma.nafura.approbations.api.request.DelegationApprobationUpdateDto;
import ma.nafura.approbations.domain.model.DelegationApprobation;
import ma.nafura.approbations.repository.DelegationApprobationRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class DelegationApprobationService {

    private final DelegationApprobationRepository repository;

    public DelegationApprobationService(DelegationApprobationRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<DelegationApprobation> list(String userId) {
        UUID tenantId = tenantId();
        if (StringUtils.hasText(userId)) {
            return repository.findByTenantIdAndUserIdOrderByDateDebutDesc(tenantId, userId.trim());
        }
        return repository.findByTenantIdOrderByDateDebutDesc(tenantId);
    }

    @Transactional(readOnly = true)
    public DelegationApprobation getById(UUID id) {
        return repository.findByIdAndTenantId(id, tenantId())
                .orElseThrow(() -> new IllegalArgumentException("Delegation not found"));
    }

    @Transactional
    public DelegationApprobation create(DelegationApprobationCreateDto request) {
        validateDates(request.getDateDebut(), request.getDateFin());
        DelegationApprobation entity = DelegationApprobation.builder()
                .tenantId(tenantId())
                .userId(request.getUserId().trim())
                .delegueUserId(request.getDelegueUserId().trim())
                .dateDebut(request.getDateDebut())
                .dateFin(request.getDateFin())
                .isActive(request.getIsActive() != null ? request.getIsActive() : Boolean.TRUE)
                .build();
        return repository.save(entity);
    }

    @Transactional
    public DelegationApprobation update(UUID id, DelegationApprobationUpdateDto request) {
        DelegationApprobation entity = getById(id);
        if (StringUtils.hasText(request.getDelegueUserId())) {
            entity.setDelegueUserId(request.getDelegueUserId().trim());
        }
        if (request.getDateDebut() != null) {
            entity.setDateDebut(request.getDateDebut());
        }
        if (request.getDateFin() != null) {
            entity.setDateFin(request.getDateFin());
        }
        if (request.getIsActive() != null) {
            entity.setIsActive(request.getIsActive());
        }
        validateDates(entity.getDateDebut(), entity.getDateFin());
        return repository.save(entity);
    }

    @Transactional
    public void delete(UUID id) {
        DelegationApprobation entity = getById(id);
        repository.delete(entity);
    }

    /**
     * Returns the delegate user id when an active delegation covers {@code date}, otherwise {@code userId}.
     */
    @Transactional(readOnly = true)
    public String resolveApprobateur(String userId, LocalDate date) {
        if (!StringUtils.hasText(userId)) {
            return userId;
        }
        LocalDate effectiveDate = date != null ? date : LocalDate.now();
        String trimmedUserId = userId.trim();
        return repository.findByTenantIdAndUserIdOrderByDateDebutDesc(tenantId(), trimmedUserId).stream()
                .filter(row -> row.isEffectiveOn(effectiveDate))
                .map(DelegationApprobation::getDelegueUserId)
                .findFirst()
                .orElse(trimmedUserId);
    }

    private static void validateDates(LocalDate dateDebut, LocalDate dateFin) {
        if (dateDebut == null || dateFin == null) {
            throw new IllegalArgumentException("Delegation dates are required");
        }
        if (dateFin.isBefore(dateDebut)) {
            throw new IllegalArgumentException("date_fin must be on or after date_debut");
        }
    }

    private static UUID tenantId() {
        return TenantContext.getTenantId();
    }
}
