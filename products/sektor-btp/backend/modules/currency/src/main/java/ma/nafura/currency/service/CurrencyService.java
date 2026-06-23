package ma.nafura.currency.service;

import java.util.List;
import java.util.UUID;
import ma.nafura.currency.api.request.CurrencyCreateDto;
import ma.nafura.currency.api.request.CurrencyUpdateDto;
import ma.nafura.currency.domain.model.Currency;
import ma.nafura.currency.mapper.CurrencyMapper;
import ma.nafura.currency.repository.CurrencyRepository;
import ma.nafura.currency.service.base.CurrencyServiceBase;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CurrencyService extends CurrencyServiceBase {

    private final CurrencyRepository currencyRepository;

    public CurrencyService(CurrencyRepository repository, CurrencyMapper mapper) {
        super(repository, mapper);
        this.currencyRepository = repository;
    }

    @Override
    @Transactional
    public Currency create(CurrencyCreateDto request) {
        Currency created = super.create(request);
        if (Boolean.TRUE.equals(created.getIsReference())) {
            clearOtherReferences(created.getId());
        }
        return created;
    }

    @Override
    @Transactional
    public Currency update(UUID id, CurrencyUpdateDto request) {
        Currency updated = super.update(id, request);
        if (Boolean.TRUE.equals(updated.getIsReference())) {
            clearOtherReferences(updated.getId());
        }
        return updated;
    }

    private void clearOtherReferences(UUID keepId) {
        UUID tenantId = TenantContext.getTenantId();
        List<Currency> all = currencyRepository.findByTenantId(tenantId);
        for (Currency row : all) {
            if (!keepId.equals(row.getId()) && Boolean.TRUE.equals(row.getIsReference())) {
                row.setIsReference(false);
                currencyRepository.save(row);
            }
        }
    }
}
