package ma.nafura.catalogue.service.base;

import java.util.UUID;
import ma.nafura.platform.framework.service.crud.JpaCrudService;
import ma.nafura.catalogue.domain.model.InventoryTxLine;
import ma.nafura.catalogue.api.request.InventoryTxLineCreateDto;
import ma.nafura.catalogue.api.request.InventoryTxLineUpdateDto;
import ma.nafura.catalogue.mapper.InventoryTxLineMapper;
import ma.nafura.catalogue.repository.InventoryTxLineRepository;

/**
 * Base service for InventoryTxLine entity.
 * Auto-generated from inventory-tx-line.entity.json — do not edit.
 */
public class InventoryTxLineServiceBase extends JpaCrudService<UUID, InventoryTxLine, InventoryTxLineCreateDto, InventoryTxLineUpdateDto> {
    protected InventoryTxLineServiceBase(InventoryTxLineRepository repository, InventoryTxLineMapper mapper) {
        super(repository, mapper);
    }
}
