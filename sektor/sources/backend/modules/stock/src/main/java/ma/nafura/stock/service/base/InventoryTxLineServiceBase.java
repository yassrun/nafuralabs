package ma.nafura.stock.service.base;

import java.util.UUID;
import ma.nafura.platform.framework.service.crud.JpaCrudService;
import ma.nafura.stock.domain.model.InventoryTxLine;
import ma.nafura.stock.api.request.InventoryTxLineCreateDto;
import ma.nafura.stock.api.request.InventoryTxLineUpdateDto;
import ma.nafura.stock.mapper.InventoryTxLineMapper;
import ma.nafura.stock.repository.InventoryTxLineRepository;

/**
 * Base service for InventoryTxLine entity.
 * Auto-generated from inventory-tx-line.entity.json — do not edit.
 */
public class InventoryTxLineServiceBase extends JpaCrudService<UUID, InventoryTxLine, InventoryTxLineCreateDto, InventoryTxLineUpdateDto> {
    protected InventoryTxLineServiceBase(InventoryTxLineRepository repository, InventoryTxLineMapper mapper) {
        super(repository, mapper);
    }
}
