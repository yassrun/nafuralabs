package ma.nafura.stock.api.controller.base;

import java.util.UUID;
import ma.nafura.platform.framework.api.controller.CrudController;
import ma.nafura.platform.framework.service.crud.CrudService;
import ma.nafura.stock.domain.model.InventoryTx;
import ma.nafura.stock.api.request.InventoryTxCreateDto;
import ma.nafura.stock.api.request.InventoryTxUpdateDto;
import ma.nafura.stock.service.InventoryTxService;

/**
 * Base REST controller for InventoryTx entity.
 * Auto-generated from inventory-tx.entity.json — do not edit.
 */
public abstract class InventoryTxControllerBase extends CrudController<UUID, InventoryTx, InventoryTxCreateDto, InventoryTxUpdateDto> {

    protected final InventoryTxService service;

    protected InventoryTxControllerBase(InventoryTxService service) {
        this.service = service;
    }

    @Override
    protected CrudService<UUID, InventoryTx, InventoryTxCreateDto, InventoryTxUpdateDto> getService() {
        return service;
    }
}
