package ma.nafura.stock.service.base;

import java.util.UUID;
import ma.nafura.platform.framework.service.crud.JpaCrudService;
import ma.nafura.stock.domain.model.StockBalance;
import ma.nafura.stock.api.request.StockBalanceCreateDto;
import ma.nafura.stock.api.request.StockBalanceUpdateDto;
import ma.nafura.stock.mapper.StockBalanceMapper;
import ma.nafura.stock.repository.StockBalanceRepository;

/**
 * Base service for StockBalance entity.
 * Auto-generated from stock-balance.entity.json — do not edit.
 */
public class StockBalanceServiceBase extends JpaCrudService<UUID, StockBalance, StockBalanceCreateDto, StockBalanceUpdateDto> {

    protected final StockBalanceRepository stockBalanceRepository;

    protected StockBalanceServiceBase(StockBalanceRepository repository, StockBalanceMapper mapper) {
        super(repository, mapper);
        this.stockBalanceRepository = repository;
    }
}
