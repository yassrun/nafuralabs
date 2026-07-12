package ma.nafura.chantiers.service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import ma.nafura.chantiers.api.request.ChantierLotCreateDto;
import ma.nafura.chantiers.api.request.ChantierLotUpdateDto;
import ma.nafura.chantiers.domain.model.ChantierLot;
import ma.nafura.chantiers.repository.ChantierLotRepository;
import ma.nafura.chantiers.repository.PosteBudgetaireRepository;
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
    private final PosteBudgetaireRepository posteRepository;

    public ChantierLotService(
            ChantierLotRepository repository,
            ChantierService chantierService,
            ChantierLotSeedService seedService,
            ChantierProgressSyncService progressSyncService,
            PosteBudgetaireRepository posteRepository) {
        this.repository = repository;
        this.chantierService = chantierService;
        this.seedService = seedService;
        this.progressSyncService = progressSyncService;
        this.posteRepository = posteRepository;
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

    @Transactional
    public ChantierLot update(String chantierId, String lotId, ChantierLotUpdateDto request) {
        chantierService.getById(chantierId);
        UUID tenantId = tenantId();
        ChantierLot entity = requireLot(tenantId, chantierId, lotId);

        if (StringUtils.hasText(request.getCode())) {
            String code = request.getCode().trim();
            repository.findByTenantIdAndChantierIdAndCode(tenantId, chantierId, code)
                    .filter(existing -> !existing.getId().equals(lotId))
                    .ifPresent(existing -> {
                        throw new IllegalArgumentException("Lot code already exists for chantier: " + code);
                    });
            entity.setCode(code);
        }
        if (StringUtils.hasText(request.getDesignation())) {
            entity.setDesignation(request.getDesignation().trim());
        }
        if (request.getUnite() != null) {
            entity.setUnite(trimOrNull(request.getUnite()));
        }
        if (request.getQuantite() != null) {
            entity.setQuantite(request.getQuantite());
        }
        if (request.getPrixUnitaireHt() != null) {
            entity.setPrixUnitaireHt(request.getPrixUnitaireHt());
        }
        if (request.getMontantHt() != null) {
            entity.setMontantHt(request.getMontantHt());
        } else if (request.getQuantite() != null && request.getPrixUnitaireHt() != null) {
            entity.setMontantHt(request.getQuantite().multiply(request.getPrixUnitaireHt()));
        }
        if (request.getAvancementPercent() != null) {
            entity.setAvancementPercent(request.getAvancementPercent());
        }
        if (request.getOrdre() != null) {
            entity.setOrdre(request.getOrdre());
        }
        return repository.save(entity);
    }

    @Transactional
    public void delete(String chantierId, String lotId) {
        chantierService.getById(chantierId);
        UUID tenantId = tenantId();
        ChantierLot entity = requireLot(tenantId, chantierId, lotId);

        // Cascade: sous-lots (and their postes) first, then this lot's postes, then the lot.
        for (ChantierLot sousLot : repository.findByTenantIdAndParentLotId(tenantId, lotId)) {
            posteRepository.deleteByTenantIdAndLotId(tenantId, sousLot.getId());
            repository.delete(sousLot);
        }
        posteRepository.deleteByTenantIdAndLotId(tenantId, lotId);
        repository.delete(entity);
    }

    private ChantierLot requireLot(UUID tenantId, String chantierId, String lotId) {
        ChantierLot entity = repository.findByIdAndTenantId(lotId, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Lot not found: " + lotId));
        if (!entity.getChantierId().equals(chantierId)) {
            throw new IllegalArgumentException("Lot does not belong to chantier: " + lotId);
        }
        return entity;
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
