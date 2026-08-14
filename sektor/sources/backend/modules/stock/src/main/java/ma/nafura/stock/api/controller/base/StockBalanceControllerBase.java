package ma.nafura.stock.api.controller.base;

import java.util.UUID;
import ma.nafura.platform.framework.api.controller.CrudController;
import ma.nafura.platform.framework.service.crud.CrudService;
import ma.nafura.stock.domain.model.StockBalance;
import ma.nafura.stock.api.request.StockBalanceCreateDto;
import ma.nafura.stock.api.request.StockBalanceUpdateDto;
import ma.nafura.stock.service.StockBalanceService;

/**
 * Base REST controller for StockBalance entity.
 * Auto-generated from stock-balance.entity.json — do not edit.
 */
public abstract class StockBalanceControllerBase extends CrudController<UUID, StockBalance, StockBalanceCreateDto, StockBalanceUpdateDto> {

    protected final StockBalanceService service;

    protected StockBalanceControllerBase(StockBalanceService service) {
        this.service = service;
    }

    @Override
    protected CrudService<UUID, StockBalance, StockBalanceCreateDto, StockBalanceUpdateDto> getService() {
        return service;
    }
}
