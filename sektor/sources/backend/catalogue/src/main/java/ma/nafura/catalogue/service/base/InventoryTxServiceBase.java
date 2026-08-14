package ma.nafura.catalogue.service.base;

import java.util.UUID;
import ma.nafura.platform.framework.service.crud.JpaCrudService;
import ma.nafura.catalogue.domain.stock.InventoryTx;
import ma.nafura.catalogue.api.request.InventoryTxCreateDto;
import ma.nafura.catalogue.api.request.InventoryTxUpdateDto;
import ma.nafura.catalogue.mapper.InventoryTxMapper;
import ma.nafura.catalogue.repository.InventoryTxRepository;

/**
 * Base service for InventoryTx entity.
 * Auto-generated from inventory-tx.entity.json — do not edit.
 */
public class InventoryTxServiceBase extends JpaCrudService<UUID, InventoryTx, InventoryTxCreateDto, InventoryTxUpdateDto> {
    protected InventoryTxServiceBase(InventoryTxRepository repository, InventoryTxMapper mapper) {
        super(repository, mapper);
    }
}
