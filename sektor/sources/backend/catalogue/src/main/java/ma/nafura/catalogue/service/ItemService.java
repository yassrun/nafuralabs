package ma.nafura.catalogue.service;

import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import ma.nafura.catalogue.api.request.ItemCreateDto;
import ma.nafura.catalogue.api.request.ItemUpdateDto;
import ma.nafura.catalogue.domain.article.Item;
import ma.nafura.catalogue.domain.article.ItemUsageLot;
import ma.nafura.catalogue.domain.article.Nature;
import ma.nafura.catalogue.domain.article.UsageLot;
import ma.nafura.catalogue.mapper.ItemMapper;
import ma.nafura.catalogue.repository.ItemCategoryRepository;
import ma.nafura.catalogue.repository.ItemRepository;
import ma.nafura.catalogue.repository.ItemUsageLotRepository;
import ma.nafura.catalogue.repository.UnitOfMeasureRepository;
import ma.nafura.catalogue.service.base.ItemServiceBase;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

/**
 * Custom service for Item entity.
 * Generated once — safe for manual custom business logic.
 */
@Service
public class ItemService extends ItemServiceBase {

    private static final int PICKER_PAGE_MAX = 50;

    private final ItemRepository itemRepository;
    private final ItemUsageLotRepository usageLotRepository;
    private final UnitOfMeasureRepository unitOfMeasureRepository;
    private final ItemCategoryRepository itemCategoryRepository;

    public ItemService(
            ItemRepository repository,
            ItemMapper mapper,
            ItemUsageLotRepository usageLotRepository,
            UnitOfMeasureRepository unitOfMeasureRepository,
            ItemCategoryRepository itemCategoryRepository) {
        super(repository, mapper);
        this.itemRepository = repository;
        this.usageLotRepository = usageLotRepository;
        this.unitOfMeasureRepository = unitOfMeasureRepository;
        this.itemCategoryRepository = itemCategoryRepository;
    }

    @Override
    protected Item createEntity(ItemCreateDto request) {
        Item item = super.createEntity(request);
        Nature nature = Nature.fromLegacyOrDefault(item.getNature(), Nature.MATIERE);
        item.setNature(nature.name());
        if (!StringUtils.hasText(item.getPosteBudgetId())) {
            item.setPosteBudgetId(nature.getPosteBudgetDefaut());
        }
        if (request.getACompleter() != null) {
            item.setACompleter(request.getACompleter());
        }
        String cle = resolveCleStable(request.getCleStable(), item.getName());
        UUID tenantId = TenantContext.getTenantId();
        if (itemRepository.existsByTenantIdAndCleStable(tenantId, cle)) {
            throw new IllegalStateException("item.cle_stable.duplicate");
        }
        item.setCleStable(cle);
        if (!StringUtils.hasText(item.getCode())) {
            item.setCode(allocateTenantCode(tenantId, cle));
        }
        return item;
    }

    /**
     * Identité déjà sur le tenant → l'Item existant. N'invente jamais une 2ᵉ fiche.
     */
    @Transactional(readOnly = true)
    public Optional<Item> findByCleStable(String cleStable) {
        if (!StringUtils.hasText(cleStable)) {
            return Optional.empty();
        }
        return itemRepository
                .findByTenantIdAndCleStable(TenantContext.getTenantId(), cleStable.trim())
                .map(this::enrich);
    }

    /**
     * Ligne fournisseur = prix + SKU sur l'identité existante. Ne crée pas d'Item.
     */
    @Transactional(readOnly = true)
    public Item bindFournisseurRef(String cleStable, String refFournisseur) {
        if (!StringUtils.hasText(cleStable)) {
            throw new IllegalArgumentException("item.cle_stable.required");
        }
        if (!StringUtils.hasText(refFournisseur)) {
            throw new IllegalArgumentException("item.ref_fournisseur.required");
        }
        return findByCleStable(cleStable.trim())
                .orElseThrow(() -> new IllegalArgumentException("item.identite.introuvable"));
    }

    static String resolveCleStable(String raw, String name) {
        if (StringUtils.hasText(raw)) {
            return raw.trim();
        }
        return CatalogSlug.from(name);
    }

    /** Code inventaire tenant (liste Articles). Distinct de cle_stable. Max 20 = formulaire. */
    static String deriveTenantCode(String cleStable) {
        if (!StringUtils.hasText(cleStable)) {
            return "ART";
        }
        String compact = cleStable.trim().toUpperCase(Locale.ROOT).replace('_', '-');
        if (compact.length() > 20) {
            compact = compact.substring(0, 20);
        }
        return trimHyphens(compact);
    }

    static String trimHyphens(String raw) {
        if (raw == null || raw.isEmpty()) {
            return "ART";
        }
        int start = 0;
        int end = raw.length();
        while (start < end && raw.charAt(start) == '-') {
            start++;
        }
        while (end > start && raw.charAt(end - 1) == '-') {
            end--;
        }
        String out = raw.substring(start, end);
        return out.isEmpty() ? "ART" : out;
    }

    String allocateTenantCode(UUID tenantId, String cleStable) {
        String base = deriveTenantCode(cleStable);
        String candidate = base.length() <= 20 ? base : base.substring(0, 20);
        int n = 2;
        while (itemRepository.existsByTenantIdAndCode(tenantId, candidate)) {
            String suffix = "-" + n;
            int keep = Math.max(1, 20 - suffix.length());
            String stem = trimHyphens(base.substring(0, Math.min(base.length(), keep)));
            candidate = stem + suffix;
            if (candidate.length() > 20) {
                candidate = candidate.substring(0, 20);
            }
            n++;
            if (n > 999) {
                throw new IllegalStateException("item.code.allocate_exhausted");
            }
        }
        return candidate;
    }

    /**
     * L9 — création allégée (libellé, nature, unité). Article tenant marqué « à compléter ».
     * Pas de prix forcé.
     */
    @Transactional
    public Item createAllege(String name, String natureCode, String uomCode) {
        if (!StringUtils.hasText(name)) {
            throw new IllegalArgumentException("item.create_allege.name_required");
        }
        Nature nature = Nature.fromLegacyOrDefault(natureCode, Nature.MATIERE);
        ItemCreateDto dto = new ItemCreateDto();
        dto.setName(name.trim());
        dto.setNature(nature.name());
        dto.setPosteBudgetId(nature.getPosteBudgetDefaut());
        dto.setIsActive(true);
        dto.setACompleter(true);
        dto.setCleStable(CatalogSlug.from(name.trim()));
        Optional<Item> existing = findByCleStable(dto.getCleStable());
        if (existing.isPresent()) {
            return existing.get();
        }
        String codeUom = StringUtils.hasText(uomCode) ? uomCode.trim() : nature.getUomDefaut();
        if (StringUtils.hasText(codeUom)) {
            unitOfMeasureRepository
                    .findByTenantIdAndCodeIgnoreCase(TenantContext.getTenantId(), codeUom)
                    .ifPresent(uom -> dto.setUnitOfMeasureId(uom.getId()));
        }
        return create(dto);
    }

    @Override
    protected void applyUpdate(Item entity, ItemUpdateDto request) {
        super.applyUpdate(entity, request);
        if (StringUtils.hasText(entity.getNature())) {
            Nature nature = Nature.fromLegacy(entity.getNature());
            entity.setNature(nature.name());
        }
    }

    @Override
    @Transactional
    public Item create(ItemCreateDto request) {
        Item saved = super.create(request);
        replaceUsageLots(saved.getId(), saved.getTenantId(), request.getUsageLotCodes());
        return enrich(saved);
    }

    @Override
    @Transactional
    public Item update(UUID id, ItemUpdateDto request) {
        Item saved = super.update(id, request);
        if (request.getUsageLotCodes() != null) {
            replaceUsageLots(saved.getId(), saved.getTenantId(), request.getUsageLotCodes());
        }
        return enrich(saved);
    }

    @Override
    protected Optional<Item> findById(UUID id) {
        return super.findById(id).map(item -> {
            persistCodeIfMissing(item);
            return enrich(item);
        });
    }

    @Override
    public List<Item> listPage(int page, int size) {
        return enrichAll(super.listPage(page, size));
    }

    @Override
    public List<Item> listPage(int page, int size, Sort sort) {
        return enrichAll(super.listPage(page, size, sort));
    }

    @Override
    public List<Item> searchPage(String search, List<String> searchFields, int page, int size) {
        return enrichAll(super.searchPage(search, searchFields, page, size));
    }

    @Override
    public List<Item> searchPage(
            String search, List<String> searchFields, int page, int size, Sort sort) {
        return enrichAll(super.searchPage(search, searchFields, page, size, sort));
    }

    /**
     * Picker catalogue — surface dédiée. Sans q ≥ 2 et sans filtre
     * (nature | familleId | usageLot) → page vide, pas de scan.
     */
    @Transactional(readOnly = true)
    public Page<Item> searchPicker(
            String q,
            String nature,
            UUID familleId,
            String usageLot,
            Boolean isActive,
            int page,
            int size) {
        int safePage = Math.max(page, 0);
        int safeSize = clampPickerSize(size);
        PageRequest pageable = PageRequest.of(safePage, safeSize);

        String query = q == null ? "" : q.trim();
        boolean hasQ = query.length() >= 2;
        Nature natureFilter = StringUtils.hasText(nature) ? Nature.fromLegacy(nature) : null;
        UsageLot lotFilter = StringUtils.hasText(usageLot) ? UsageLot.parse(usageLot) : null;
        boolean hasFilter = natureFilter != null || familleId != null || lotFilter != null;
        if (!hasQ && !hasFilter) {
            return Page.empty(pageable);
        }

        UUID tenantId = TenantContext.getTenantId();
        List<UUID> categoryIds = null;
        if (familleId != null) {
            categoryIds = itemCategoryRepository.findSelfAndChildIds(tenantId, familleId);
            if (categoryIds.isEmpty()) {
                return Page.empty(pageable);
            }
        }

        final List<UUID> familleIds = categoryIds;
        final String like = hasQ ? "%" + query.toLowerCase(Locale.ROOT) + "%" : null;
        final String exactCode = hasQ ? query.toLowerCase(Locale.ROOT) : null;
        final boolean activeOnly = isActive == null || Boolean.TRUE.equals(isActive);
        final boolean inactiveOnly = Boolean.FALSE.equals(isActive);

        Specification<Item> spec = (root, cq, cb) -> {
            List<Predicate> preds = new ArrayList<>();
            preds.add(cb.equal(root.get("tenantId"), tenantId));
            if (activeOnly) {
                preds.add(cb.or(cb.isTrue(root.get("isActive")), cb.isNull(root.get("isActive"))));
            } else if (inactiveOnly) {
                preds.add(cb.isFalse(root.get("isActive")));
            }
            if (natureFilter != null) {
                preds.add(cb.equal(root.get("nature"), natureFilter.name()));
            }
            if (familleIds != null) {
                preds.add(root.get("itemCategoryId").in(familleIds));
            }
            if (lotFilter != null) {
                Subquery<UUID> sq = cq.subquery(UUID.class);
                Root<ItemUsageLot> ul = sq.from(ItemUsageLot.class);
                sq.select(ul.get("itemId"));
                sq.where(
                        cb.equal(ul.get("itemId"), root.get("id")),
                        cb.equal(ul.get("lotCode"), lotFilter.name()));
                preds.add(cb.exists(sq));
            }
            if (hasQ) {
                preds.add(cb.or(
                        cb.like(cb.lower(cb.coalesce(root.get("code"), "")), like),
                        cb.like(cb.lower(root.get("name")), like)));
            }
            Class<?> resultType = cq.getResultType();
            if (resultType != Long.class && resultType != long.class) {
                if (exactCode != null) {
                    Expression<Integer> exactFirst = cb.<Integer>selectCase()
                            .when(cb.equal(cb.lower(cb.coalesce(root.get("code"), "")), exactCode), 0)
                            .otherwise(1);
                    cq.orderBy(cb.asc(exactFirst), cb.asc(root.get("name")), cb.asc(root.get("id")));
                } else {
                    cq.orderBy(cb.asc(root.get("name")), cb.asc(root.get("id")));
                }
            }
            return cb.and(preds.toArray(Predicate[]::new));
        };

        Page<Item> result = itemRepository.findAll(spec, pageable);
        return new PageImpl<>(enrichAll(result.getContent()), pageable, result.getTotalElements());
    }

    static int clampPickerSize(int size) {
        if (size < 1) {
            return 20;
        }
        return Math.min(size, PICKER_PAGE_MAX);
    }

    private void replaceUsageLots(UUID itemId, UUID tenantId, List<String> rawCodes) {
        List<String> codes = normalizeUsageLotCodes(rawCodes);
        usageLotRepository.deleteByItemId(itemId);
        if (codes.isEmpty()) {
            return;
        }
        List<ItemUsageLot> rows = new ArrayList<>(codes.size());
        for (String code : codes) {
            rows.add(ItemUsageLot.builder().itemId(itemId).tenantId(tenantId).lotCode(code).build());
        }
        usageLotRepository.saveAll(rows);
    }

    private List<String> normalizeUsageLotCodes(List<String> rawCodes) {
        if (rawCodes == null || rawCodes.isEmpty()) {
            return List.of();
        }
        Set<String> unique = new LinkedHashSet<>();
        for (String raw : rawCodes) {
            if (raw == null || raw.isBlank()) {
                continue;
            }
            unique.add(UsageLot.parse(raw).name());
        }
        return List.copyOf(unique);
    }

    private void persistCodeIfMissing(Item item) {
        if (item == null || StringUtils.hasText(item.getCode())) {
            return;
        }
        UUID tenantId = item.getTenantId() != null ? item.getTenantId() : TenantContext.getTenantId();
        String cle = StringUtils.hasText(item.getCleStable())
                ? item.getCleStable()
                : resolveCleStable(null, item.getName());
        item.setCode(allocateTenantCode(tenantId, cle));
        itemRepository.save(item);
    }

    private Item enrich(Item item) {
        if (item == null || item.getId() == null) {
            return item;
        }
        List<String> codes =
                usageLotRepository.findByItemId(item.getId()).stream()
                        .map(ItemUsageLot::getLotCode)
                        .sorted()
                        .toList();
        item.setUsageLotCodes(new ArrayList<>(codes));
        return item;
    }

    private List<Item> enrichAll(List<Item> items) {
        if (items == null || items.isEmpty()) {
            return items == null ? List.of() : items;
        }
        List<UUID> ids = items.stream().map(Item::getId).toList();
        Map<UUID, List<String>> byItem =
                usageLotRepository.findByItemIdIn(ids).stream()
                        .collect(
                                Collectors.groupingBy(
                                        ItemUsageLot::getItemId,
                                        Collectors.mapping(
                                                ItemUsageLot::getLotCode,
                                                Collectors.collectingAndThen(
                                                        Collectors.toCollection(LinkedHashSet::new),
                                                        set -> set.stream().sorted().toList()))));
        for (Item item : items) {
            persistCodeIfMissing(item);
            item.setUsageLotCodes(
                    new ArrayList<>(byItem.getOrDefault(item.getId(), Collections.emptyList())));
        }
        return items;
    }
}
