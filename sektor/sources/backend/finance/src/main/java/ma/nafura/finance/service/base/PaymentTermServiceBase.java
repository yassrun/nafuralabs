package ma.nafura.finance.service.base;

import java.util.UUID;
import ma.nafura.platform.framework.service.crud.JpaCrudService;
import ma.nafura.finance.domain.model.PaymentTerm;
import ma.nafura.finance.api.request.PaymentTermCreateDto;
import ma.nafura.finance.api.request.PaymentTermUpdateDto;
import ma.nafura.finance.mapper.PaymentTermMapper;
import ma.nafura.finance.repository.PaymentTermRepository;

/**
 * Base service for PaymentTerm entity.
 * Auto-generated from payment-term.entity.json — do not edit.
 */
public class PaymentTermServiceBase extends JpaCrudService<UUID, PaymentTerm, PaymentTermCreateDto, PaymentTermUpdateDto> {
    protected PaymentTermServiceBase(PaymentTermRepository repository, PaymentTermMapper mapper) {
        super(repository, mapper);
    }
}
