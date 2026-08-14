package ma.nafura.chantiers.service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import ma.nafura.chantiers.api.dto.ChantierLotTreeNodeDto;
import ma.nafura.chantiers.api.dto.ChantierLotTreePosteDto;
import ma.nafura.chantiers.api.dto.ChantierLotTreeResponseDto;
import ma.nafura.chantiers.api.request.ChantierLotCreateDto;
import ma.nafura.chantiers.api.request.ChantierLotTreeNodeCreateDto;
import ma.nafura.chantiers.api.request.ChantierLotTreePosteCreateDto;
import ma.nafura.chantiers.api.request.ChantierLotTreeRequestDto;
import ma.nafura.chantiers.api.request.ChantierLotUpdateDto;
import ma.nafura.chantiers.api.request.PosteBudgetaireCreateDto;
import ma.nafura.chantiers.domain.model.ChantierLot;
import ma.nafura.chantiers.domain.model.PosteBudgetaire;
import ma.nafura.chantiers.repository.ChantierLotRepository;
import ma.nafura.chantiers.repository.PosteBudgetaireRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class ChantierLotService {

    /** Max depth for grouping lots (0 = root, 1 = sous-lot, 2 = sous-sous-lot). */
    public static final int MAX_LOT_DEPTH = 2;

    private final ChantierLotRepository repository;
    private final ChantierService chantierService;
    private final ChantierLotSeedService seedService;
    private final ChantierProgressSyncService progressSyncService;
    private final PosteBudgetaireRepository posteRepository;
    private final PosteBudgetaireService posteBudgetaireService;

    public ChantierLotService(
            ChantierLotRepository repository,
            ChantierService chantierService,
            ChantierLotSeedService seedService,
            ChantierProgressSyncService progressSyncService,
            PosteBudgetaireRepository posteRepository,
            PosteBudgetaireService posteBudgetaireService) {
        this.repository = repository;
        this.chantierService = chantierService;
        this.seedService = seedService;
        this.progressSyncService = progressSyncService;
        this.posteRepository = posteRepository;
        this.posteBudgetaireService = posteBudgetaireService;
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
        String parentLotId = trimOrNull(request.getParentLotId());
        int depth = resolveDepthForNewLot(tenantId, chantierId, parentLotId);
        if (depth > MAX_LOT_DEPTH) {
            throw new IllegalArgumentException(
                    "Lot hierarchy depth exceeds maximum of " + (MAX_LOT_DEPTH + 1) + " levels");
        }

        String code = StringUtils.hasText(request.getCode())
                ? request.getCode().trim()
                : nextCode(tenantId, chantierId, parentLotId);
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
                .parentLotId(parentLotId)
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
    public ChantierLotTreeResponseDto createTree(String chantierId, ChantierLotTreeRequestDto request) {
        chantierService.getById(chantierId);
        UUID tenantId = tenantId();
        List<ChantierLotTreeNodeCreateDto> roots =
                request.getLots() != null ? request.getLots() : List.of();

        int nextOrdre = nextOrdre(tenantId, chantierId);
        List<ChantierLotTreeNodeDto> createdRoots = new ArrayList<>();
        for (ChantierLotTreeNodeCreateDto root : roots) {
            createdRoots.add(createTreeNode(chantierId, null, root, 0, nextOrdre++));
        }

        return ChantierLotTreeResponseDto.builder().lots(createdRoots).build();
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
        requireLot(tenantId, chantierId, lotId);
        deleteSubtree(tenantId, lotId);
    }

    private ChantierLotTreeNodeDto createTreeNode(
            String chantierId,
            String parentLotId,
            ChantierLotTreeNodeCreateDto node,
            int depth,
            int ordre) {
        if (node == null || !StringUtils.hasText(node.getDesignation())) {
            throw new IllegalArgumentException("Lot designation is required");
        }
        if (depth > MAX_LOT_DEPTH) {
            throw new IllegalArgumentException(
                    "Lot hierarchy depth exceeds maximum of " + (MAX_LOT_DEPTH + 1) + " levels");
        }

        ChantierLotCreateDto createDto = new ChantierLotCreateDto();
        createDto.setDesignation(node.getDesignation());
        createDto.setParentLotId(parentLotId);
        createDto.setOrdre(ordre);
        createDto.setAvancementPercent(BigDecimal.ZERO);

        ChantierLot created = create(chantierId, createDto);

        List<ChantierLotTreePosteDto> postes = new ArrayList<>();
        int posteOrdre = 1;
        List<ChantierLotTreePosteCreateDto> posteNodes =
                node.getPostes() != null ? node.getPostes() : List.of();
        for (ChantierLotTreePosteCreateDto posteNode : posteNodes) {
            if (posteNode == null || !StringUtils.hasText(posteNode.getDesignation())) {
                throw new IllegalArgumentException("Poste designation is required");
            }
            PosteBudgetaireCreateDto posteDto = new PosteBudgetaireCreateDto();
            posteDto.setDesignation(posteNode.getDesignation());
            posteDto.setUnite(posteNode.getUnite());
            posteDto.setQuantite(posteNode.getQuantite());
            posteDto.setPrixUnitaireHt(posteNode.getPrixUnitaireHt());
            posteDto.setMontantHt(posteNode.getMontantHt());
            posteDto.setOrdre(posteOrdre++);
            PosteBudgetaire poste = posteBudgetaireService.create(created.getId(), posteDto);
            postes.add(toPosteDto(poste));
        }

        List<ChantierLotTreeNodeDto> children = new ArrayList<>();
        int childOrdre = 1;
        List<ChantierLotTreeNodeCreateDto> childNodes =
                node.getChildren() != null ? node.getChildren() : List.of();
        for (ChantierLotTreeNodeCreateDto child : childNodes) {
            children.add(createTreeNode(chantierId, created.getId(), child, depth + 1, childOrdre++));
        }

        return ChantierLotTreeNodeDto.builder()
                .id(created.getId())
                .chantierId(created.getChantierId())
                .code(created.getCode())
                .designation(created.getDesignation())
                .parentLotId(created.getParentLotId())
                .avancementPercent(created.getAvancementPercent())
                .ordre(created.getOrdre())
                .depth(depth)
                .children(children)
                .postes(postes)
                .build();
    }

    private void deleteSubtree(UUID tenantId, String lotId) {
        for (ChantierLot child : repository.findByTenantIdAndParentLotId(tenantId, lotId)) {
            deleteSubtree(tenantId, child.getId());
        }
        posteRepository.deleteByTenantIdAndLotId(tenantId, lotId);
        repository.findByIdAndTenantId(lotId, tenantId).ifPresent(repository::delete);
    }

    private int resolveDepthForNewLot(UUID tenantId, String chantierId, String parentLotId) {
        if (parentLotId == null) {
            return 0;
        }
        return depthOfLot(tenantId, chantierId, parentLotId) + 1;
    }

    private int depthOfLot(UUID tenantId, String chantierId, String lotId) {
        int depth = 0;
        String currentId = lotId;
        while (currentId != null) {
            ChantierLot current = requireLot(tenantId, chantierId, currentId);
            currentId = current.getParentLotId();
            if (currentId != null) {
                depth++;
                if (depth > MAX_LOT_DEPTH) {
                    throw new IllegalArgumentException("Invalid parent lot hierarchy");
                }
            }
        }
        return depth;
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

    private String nextCode(UUID tenantId, String chantierId, String parentLotId) {
        List<ChantierLot> lots =
                repository.findByTenantIdAndChantierIdOrderByOrdreAscCodeAsc(tenantId, chantierId);
        if (parentLotId == null) {
            int next = lots.stream()
                    .filter(lot -> lot.getParentLotId() == null)
                    .map(ChantierLot::getCode)
                    .mapToInt(ChantierLotService::numericSuffix)
                    .max()
                    .orElse(0)
                    + 1;
            return formatSequence(next);
        }

        ChantierLot parent = lots.stream()
                .filter(lot -> parentLotId.equals(lot.getId()))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException(
                        "Parent lot does not belong to chantier: " + parentLotId));
        String prefix = parent.getCode() + "-";
        int next = lots.stream()
                .map(ChantierLot::getCode)
                .filter(code -> code != null && code.startsWith(prefix))
                .map(code -> code.substring(prefix.length()))
                .mapToInt(ChantierLotService::numericSuffix)
                .max()
                .orElse(0)
                + 1;
        return prefix + formatSequence(next);
    }

    private static ChantierLotTreePosteDto toPosteDto(PosteBudgetaire poste) {
        return ChantierLotTreePosteDto.builder()
                .id(poste.getId())
                .lotId(poste.getLotId())
                .code(poste.getCode())
                .designation(poste.getDesignation())
                .unite(poste.getUnite())
                .quantite(poste.getQuantite())
                .prixUnitaireHt(poste.getPrixUnitaireHt())
                .montantHt(poste.getMontantHt())
                .ordre(poste.getOrdre())
                .build();
    }

    private static int numericSuffix(String value) {
        if (value == null || !value.matches("\\d+")) {
            return 0;
        }
        try {
            return Integer.parseInt(value);
        } catch (NumberFormatException ignored) {
            return 0;
        }
    }

    private static String formatSequence(int value) {
        return String.format(Locale.ROOT, "%02d", value);
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
