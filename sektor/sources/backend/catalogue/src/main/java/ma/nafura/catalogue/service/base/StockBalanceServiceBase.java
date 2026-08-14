package ma.nafura.catalogue.service.base;

import java.util.UUID;
import ma.nafura.platform.framework.service.crud.JpaCrudService;
import ma.nafura.catalogue.domain.model.StockBalance;
import ma.nafura.catalogue.api.request.StockBalanceCreateDto;
import ma.nafura.catalogue.api.request.StockBalanceUpdateDto;
import ma.nafura.catalogue.mapper.StockBalanceMapper;
import ma.nafura.catalogue.repository.StockBalanceRepository;

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
