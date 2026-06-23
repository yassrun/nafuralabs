package ma.nafura.stock.service.base;

import java.util.UUID;
import ma.nafura.platform.framework.service.crud.JpaCrudService;
import ma.nafura.stock.domain.model.InventoryTx;
import ma.nafura.stock.api.request.InventoryTxCreateDto;
import ma.nafura.stock.api.request.InventoryTxUpdateDto;
import ma.nafura.stock.mapper.InventoryTxMapper;
import ma.nafura.stock.repository.InventoryTxRepository;

/**
 * Base service for InventoryTx entity.
 * Auto-generated from inventory-tx.entity.json — do not edit.
 */
public class InventoryTxServiceBase extends JpaCrudService<UUID, InventoryTx, InventoryTxCreateDto, InventoryTxUpdateDto> {
    protected InventoryTxServiceBase(InventoryTxRepository repository, InventoryTxMapper mapper) {
        super(repository, mapper);
    }
}
