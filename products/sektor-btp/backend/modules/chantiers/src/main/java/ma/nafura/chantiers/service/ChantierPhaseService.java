package ma.nafura.chantiers.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import ma.nafura.chantiers.api.request.ChantierPhaseCreateDto;
import ma.nafura.chantiers.domain.model.ChantierPhase;
import ma.nafura.chantiers.repository.ChantierPhaseRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class ChantierPhaseService {

    private final ChantierPhaseRepository repository;
    private final ChantierService chantierService;
    private final ChantierPhaseSeedService seedService;

    public ChantierPhaseService(
            ChantierPhaseRepository repository,
            ChantierService chantierService,
            ChantierPhaseSeedService seedService) {
        this.repository = repository;
        this.chantierService = chantierService;
        this.seedService = seedService;
    }

    @Transactional(readOnly = true)
    public List<ChantierPhase> listByChantier(String chantierId) {
        seedService.seedIfEmpty();
        chantierService.getById(chantierId);
        return repository.findByTenantIdAndChantierIdOrderByOrdreAscCodeAsc(tenantId(), chantierId);
    }

    @Transactional
    public ChantierPhase create(String chantierId, ChantierPhaseCreateDto request) {
        chantierService.getById(chantierId);
        UUID tenantId = tenantId();
        String code = request.getCode().trim();
        if (repository.findByTenantIdAndChantierIdAndCode(tenantId, chantierId, code).isPresent()) {
            throw new IllegalArgumentException("Phase code already exists for chantier: " + code);
        }

        int ordre = request.getOrdre() != null ? request.getOrdre() : nextOrdre(tenantId, chantierId);
        String id = StringUtils.hasText(request.getId())
                ? request.getId().trim()
                : buildPhaseId(chantierId, code);

        if (repository.findByIdAndTenantId(id, tenantId).isPresent()) {
            throw new IllegalArgumentException("Phase id already exists: " + id);
        }

        BigDecimal progress = request.getAvancementPercent() != null
                ? request.getAvancementPercent()
                : BigDecimal.ZERO;
        String status = StringUtils.hasText(request.getStatus())
                ? request.getStatus().trim()
                : resolveStatus(request.getDateFin(), progress);

        ChantierPhase entity = ChantierPhase.builder()
                .id(id)
                .tenantId(tenantId)
                .chantierId(chantierId)
                .lotId(trimOrNull(request.getLotId()))
                .code(code)
                .designation(request.getDesignation().trim())
                .dateDebut(request.getDateDebut())
                .dateFin(request.getDateFin())
                .responsableId(trimOrNull(request.getResponsableId()))
                .responsableName(trimOrNull(request.getResponsableName()))
                .equipeName(trimOrNull(request.getEquipeName()))
                .quantite(request.getQuantite())
                .unite(trimOrNull(request.getUnite()))
                .avancementPercent(progress)
                .status(status)
                .ordre(ordre)
                .build();
        entity.setDependancesList(request.getDependances());
        return repository.save(entity);
    }

    static String resolveStatus(LocalDate dateFin, BigDecimal progress) {
        if (progress.compareTo(new BigDecimal("100")) >= 0) {
            return "TERMINE";
        }
        if (dateFin != null && dateFin.isBefore(LocalDate.now())) {
            return "EN_RETARD";
        }
        return progress.compareTo(BigDecimal.ZERO) > 0 ? "EN_COURS" : "PLANIFIE";
    }

    private int nextOrdre(UUID tenantId, String chantierId) {
        return repository.findByTenantIdAndChantierIdOrderByOrdreAscCodeAsc(tenantId, chantierId).stream()
                        .mapToInt(ChantierPhase::getOrdre)
                        .max()
                        .orElse(0)
                + 1;
    }

    private static String buildPhaseId(String chantierId, String code) {
        String slug = code.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+", "-");
        return chantierId + "-phase-" + slug;
    }

    private static String trimOrNull(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        return value.trim();
    }

    private static UUID tenantId() {
        return TenantContext.getTenantId();
    }
}
