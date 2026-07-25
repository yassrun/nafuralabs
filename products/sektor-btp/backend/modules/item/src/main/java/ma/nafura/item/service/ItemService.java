package ma.nafura.item.service;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import ma.nafura.item.domain.model.Item;
import ma.nafura.item.mapper.ItemMapper;
import ma.nafura.item.repository.ItemRepository;
import ma.nafura.item.service.base.ItemServiceBase;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Custom service for Item entity.
 * Generated once — safe for manual custom business logic.
 */
@Service
public class ItemService extends ItemServiceBase {

    private final ItemSeedService seedService;

    public ItemService(ItemRepository repository, ItemMapper mapper, ItemSeedService seedService) {
        super(repository, mapper);
        this.seedService = seedService;
    }

    @Override
    @Transactional(readOnly = true)
    public List<Item> listPage(int page, int size) {
        seedService.seedIfEmpty();
        return super.listPage(page, size);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Item> listPage(int page, int size, Sort sort) {
        seedService.seedIfEmpty();
        return super.listPage(page, size, sort);
    }

    /**
     * Recalculates weighted average price (PMP). V1: uses {@code prixUnitaire} when PMP is unset.
     */
    @Transactional
    public Item recalcPmp(UUID id) {
        Item item = getById(id).orElseThrow(() -> new IllegalArgumentException("Item not found"));
        BigDecimal next = item.getPmp();
        if (next == null && item.getPrixUnitaire() != null) {
            next = item.getPrixUnitaire();
        }
        if (next == null) {
            next = BigDecimal.ZERO;
        }
        item.setPmp(next);
        return save(item);
    }
}
