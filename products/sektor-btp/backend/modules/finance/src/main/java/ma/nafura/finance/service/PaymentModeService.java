package ma.nafura.finance.service;

import java.util.UUID;
import ma.nafura.finance.api.request.PaymentModeCreateDto;
import ma.nafura.finance.api.request.PaymentModeUpdateDto;
import ma.nafura.finance.domain.model.PaymentMode;
import ma.nafura.finance.mapper.PaymentModeMapper;
import ma.nafura.finance.repository.PaymentModeRepository;
import ma.nafura.platform.framework.service.crud.JpaCrudService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PaymentModeService extends JpaCrudService<UUID, PaymentMode, PaymentModeCreateDto, PaymentModeUpdateDto> {

    private final PaymentModeRepository paymentModeRepository;

    public PaymentModeService(PaymentModeRepository repository, PaymentModeMapper mapper) {
        super(repository, mapper);
        this.paymentModeRepository = repository;
    }

    @Transactional
    public PaymentMode create(PaymentModeCreateDto request) {
        if (paymentModeRepository.existsByTenantIdAndCode(tenantId(), request.getCode().trim())) {
            throw new IllegalArgumentException("Payment mode code already exists");
        }
        return super.create(request);
    }
}
