package ma.nafura.catalogue.api.controller.base;

import java.util.UUID;
import ma.nafura.platform.framework.api.controller.CrudController;
import ma.nafura.platform.framework.service.crud.CrudService;
import ma.nafura.catalogue.domain.model.InventoryTxLine;
import ma.nafura.catalogue.api.request.InventoryTxLineCreateDto;
import ma.nafura.catalogue.api.request.InventoryTxLineUpdateDto;
import ma.nafura.catalogue.service.InventoryTxLineService;

/**
 * Base REST controller for InventoryTxLine entity.
 * Auto-generated from inventory-tx-line.entity.json — do not edit.
 */
public abstract class InventoryTxLineControllerBase extends CrudController<UUID, InventoryTxLine, InventoryTxLineCreateDto, InventoryTxLineUpdateDto> {

    protected final InventoryTxLineService service;

    protected InventoryTxLineControllerBase(InventoryTxLineService service) {
        this.service = service;
    }

    @Override
    protected CrudService<UUID, InventoryTxLine, InventoryTxLineCreateDto, InventoryTxLineUpdateDto> getService() {
        return service;
    }
}
