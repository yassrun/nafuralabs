package ma.nafura.approbations.service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.approbations.api.request.MatricePouvoirCreateDto;
import ma.nafura.approbations.api.request.MatricePouvoirUpdateDto;
import ma.nafura.approbations.domain.model.MatricePouvoir;
import ma.nafura.approbations.repository.MatricePouvoirRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class MatricePouvoirService {

    public static final String ENTITY_TYPE_BC = "BC";
    public static final String ROLE_DIRECTEUR_TRAVAUX = "DIRECTEUR_TRAVAUX";
    public static final String ROLE_DG = "DG";
    public static final String ROLE_COMITE = "COMITE";

    private final MatricePouvoirRepository repository;
    private final MatricePouvoirSeedService seedService;

    public MatricePouvoirService(MatricePouvoirRepository repository, MatricePouvoirSeedService seedService) {
        this.repository = repository;
        this.seedService = seedService;
    }

    @Transactional(readOnly = true)
    public List<MatricePouvoir> list(String entityType) {
        seedService.seedIfEmpty();
        UUID tenantId = tenantId();
        if (StringUtils.hasText(entityType)) {
            return repository.findByTenantIdAndEntityTypeOrderByOrdreAsc(tenantId, entityType.trim().toUpperCase());
        }
        return repository.findByTenantIdOrderByEntityTypeAscOrdreAsc(tenantId);
    }

    @Transactional(readOnly = true)
    public MatricePouvoir getById(UUID id) {
        seedService.seedIfEmpty();
        return repository.findByIdAndTenantId(id, tenantId())
                .orElseThrow(() -> new IllegalArgumentException("Matrice pouvoir not found"));
    }

    @Transactional
    public MatricePouvoir create(MatricePouvoirCreateDto request) {
        MatricePouvoir entity = MatricePouvoir.builder()
                .tenantId(tenantId())
                .entityType(normalizeEntityType(request.getEntityType()))
                .seuilMin(request.getSeuilMin())
                .seuilMax(request.getSeuilMax())
                .approbateurRole(request.getApprobateurRole().trim())
                .label(request.getLabel().trim())
                .ordre(request.getOrdre())
                .build();
        return repository.save(entity);
    }

    @Transactional
    public MatricePouvoir update(UUID id, MatricePouvoirUpdateDto request) {
        MatricePouvoir entity = getById(id);
        if (request.getSeuilMin() != null) {
            entity.setSeuilMin(request.getSeuilMin());
        }
        if (request.getSeuilMax() != null) {
            entity.setSeuilMax(request.getSeuilMax());
        }
        if (StringUtils.hasText(request.getApprobateurRole())) {
            entity.setApprobateurRole(request.getApprobateurRole().trim());
        }
        if (StringUtils.hasText(request.getLabel())) {
            entity.setLabel(request.getLabel().trim());
        }
        if (request.getOrdre() != null) {
            entity.setOrdre(request.getOrdre());
        }
        return repository.save(entity);
    }

    @Transactional
    public void delete(UUID id) {
        MatricePouvoir entity = getById(id);
        repository.delete(entity);
    }

    @Transactional(readOnly = true)
    public Optional<MatricePouvoir> resolve(String entityType, BigDecimal montant) {
        seedService.seedIfEmpty();
        if (!StringUtils.hasText(entityType) || montant == null) {
            return Optional.empty();
        }
        return repository.findByTenantIdAndEntityTypeOrderByOrdreAsc(
                        tenantId(), normalizeEntityType(entityType))
                .stream()
                .filter(row -> row.matchesMontant(montant))
                .findFirst();
    }

    @Transactional(readOnly = true)
    public String resolveApprobateurRole(String entityType, BigDecimal montant) {
        return resolve(entityType, montant)
                .map(MatricePouvoir::getApprobateurRole)
                .orElseThrow(() -> new IllegalArgumentException(
                        "No matrice pouvoir row matches entityType=" + entityType + " montant=" + montant));
    }

    private static String normalizeEntityType(String entityType) {
        return entityType.trim().toUpperCase();
    }

    private static UUID tenantId() {
        return TenantContext.getTenantId();
    }
}
