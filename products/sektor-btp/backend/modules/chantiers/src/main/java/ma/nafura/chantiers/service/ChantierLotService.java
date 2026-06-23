package ma.nafura.chantiers.service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import ma.nafura.chantiers.api.request.ChantierLotCreateDto;
import ma.nafura.chantiers.domain.model.ChantierLot;
import ma.nafura.chantiers.repository.ChantierLotRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class ChantierLotService {

    private final ChantierLotRepository repository;
    private final ChantierService chantierService;
    private final ChantierLotSeedService seedService;
    private final ChantierProgressSyncService progressSyncService;

    public ChantierLotService(
            ChantierLotRepository repository,
            ChantierService chantierService,
            ChantierLotSeedService seedService,
            ChantierProgressSyncService progressSyncService) {
        this.repository = repository;
        this.chantierService = chantierService;
        this.seedService = seedService;
        this.progressSyncService = progressSyncService;
    }

    @Transactional
    public List<ChantierLot> listByChantier(String chantierId) {
        seedService.seedIfEmpty();
        chantierService.getById(chantierId);
        progressSyncService.syncFromAvancements(chantierId);
        return repository.findByTenantIdAndChantierIdOrderByOrdreAscCodeAsc(tenantId(), chantierId);
    }

    @Transactional
    public ChantierLot create(String chantierId, ChantierLotCreateDto request) {
        chantierService.getById(chantierId);
        UUID tenantId = tenantId();
        String code = request.getCode().trim();
        if (repository.findByTenantIdAndChantierIdAndCode(tenantId, chantierId, code).isPresent()) {
            throw new IllegalArgumentException("Lot code already exists for chantier: " + code);
        }

        int ordre = request.getOrdre() != null
                ? request.getOrdre()
                : nextOrdre(tenantId, chantierId);
        String id = StringUtils.hasText(request.getId())
                ? request.getId().trim()
                : buildLotId(chantierId, code);

        if (repository.findByIdAndTenantId(id, tenantId).isPresent()) {
            throw new IllegalArgumentException("Lot id already exists: " + id);
        }

        ChantierLot entity = ChantierLot.builder()
                .id(id)
                .tenantId(tenantId)
                .chantierId(chantierId)
                .code(code)
                .designation(request.getDesignation().trim())
                .parentLotId(trimOrNull(request.getParentLotId()))
                .unite(trimOrNull(request.getUnite()))
                .quantite(request.getQuantite())
                .prixUnitaireHt(request.getPrixUnitaireHt())
                .montantHt(resolveMontantHt(request))
                .avancementPercent(
                        request.getAvancementPercent() != null
                                ? request.getAvancementPercent()
                                : BigDecimal.ZERO)
                .ordre(ordre)
                .build();
        return repository.save(entity);
    }

    private int nextOrdre(UUID tenantId, String chantierId) {
        return repository.findByTenantIdAndChantierIdOrderByOrdreAscCodeAsc(tenantId, chantierId).stream()
                        .mapToInt(ChantierLot::getOrdre)
                        .max()
                        .orElse(0)
                + 1;
    }

    private static String buildLotId(String chantierId, String code) {
        String slug = code.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+", "-");
        return chantierId + "-lot-" + slug;
    }

    private static BigDecimal resolveMontantHt(ChantierLotCreateDto request) {
        if (request.getMontantHt() != null) {
            return request.getMontantHt();
        }
        if (request.getQuantite() != null && request.getPrixUnitaireHt() != null) {
            return request.getQuantite().multiply(request.getPrixUnitaireHt());
        }
        return null;
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
