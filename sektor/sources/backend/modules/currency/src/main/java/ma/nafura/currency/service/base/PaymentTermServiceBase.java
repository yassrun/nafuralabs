package ma.nafura.currency.service.base;

import java.util.UUID;
import ma.nafura.platform.framework.service.crud.JpaCrudService;
import ma.nafura.currency.domain.model.PaymentTerm;
import ma.nafura.currency.api.request.PaymentTermCreateDto;
import ma.nafura.currency.api.request.PaymentTermUpdateDto;
import ma.nafura.currency.mapper.PaymentTermMapper;
import ma.nafura.currency.repository.PaymentTermRepository;

/**
 * Base service for PaymentTerm entity.
 * Auto-generated from payment-term.entity.json — do not edit.
 */
public class PaymentTermServiceBase extends JpaCrudService<UUID, PaymentTerm, PaymentTermCreateDto, PaymentTermUpdateDto> {
    protected PaymentTermServiceBase(PaymentTermRepository repository, PaymentTermMapper mapper) {
        super(repository, mapper);
    }
}
