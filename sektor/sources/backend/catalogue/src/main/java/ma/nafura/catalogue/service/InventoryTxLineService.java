package ma.nafura.catalogue.service;

import ma.nafura.catalogue.mapper.InventoryTxLineMapper;
import ma.nafura.catalogue.repository.InventoryTxLineRepository;
import ma.nafura.catalogue.service.base.InventoryTxLineServiceBase;
import org.springframework.stereotype.Service;

/**
 * Custom service for InventoryTxLine entity.
 * Generated once — safe for manual custom business logic.
 */
@Service
public class InventoryTxLineService extends InventoryTxLineServiceBase {
    public InventoryTxLineService(InventoryTxLineRepository repository, InventoryTxLineMapper mapper) {
        super(repository, mapper);
    }

    // Add custom business logic here
}
