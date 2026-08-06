package ma.nafura.item.service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import ma.nafura.item.api.request.ItemCreateDto;
import ma.nafura.item.api.request.ItemUpdateDto;
import ma.nafura.item.domain.Nature;
import ma.nafura.item.domain.UsageLot;
import ma.nafura.item.domain.model.Item;
import ma.nafura.item.domain.model.ItemUsageLot;
import ma.nafura.item.mapper.ItemMapper;
import ma.nafura.item.repository.ItemRepository;
import ma.nafura.item.repository.ItemUsageLotRepository;
import ma.nafura.item.service.base.ItemServiceBase;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

/**
 * Custom service for Item entity.
 * Generated once — safe for manual custom business logic.
 */
@Service
public class ItemService extends ItemServiceBase {

    private final ItemUsageLotRepository usageLotRepository;

    public ItemService(
            ItemRepository repository, ItemMapper mapper, ItemUsageLotRepository usageLotRepository) {
        super(repository, mapper);
        this.usageLotRepository = usageLotRepository;
    }

    @Override
    protected Item createEntity(ItemCreateDto request) {
        Item item = super.createEntity(request);
        Nature nature = Nature.fromLegacyOrDefault(item.getNature(), Nature.MATIERE);
        item.setNature(nature.name());
        if (!StringUtils.hasText(item.getPosteBudgetId())) {
            item.setPosteBudgetId(nature.getPosteBudgetDefaut());
        }
        return item;
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
        return super.findById(id).map(this::enrich);
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
            item.setUsageLotCodes(
                    new ArrayList<>(byItem.getOrDefault(item.getId(), Collections.emptyList())));
        }
        return items;
    }
}
