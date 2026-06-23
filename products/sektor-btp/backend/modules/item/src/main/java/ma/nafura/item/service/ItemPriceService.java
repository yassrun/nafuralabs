package ma.nafura.item.service;

import ma.nafura.item.mapper.ItemPriceMapper;
import ma.nafura.item.repository.ItemPriceRepository;
import ma.nafura.item.service.base.ItemPriceServiceBase;
import org.springframework.stereotype.Service;

/**
 * Custom service for ItemPrice entity.
 * Generated once — safe for manual custom business logic.
 */
@Service
public class ItemPriceService extends ItemPriceServiceBase {
    public ItemPriceService(ItemPriceRepository repository, ItemPriceMapper mapper) {
        super(repository, mapper);
    }

    // Add custom business logic here
}
