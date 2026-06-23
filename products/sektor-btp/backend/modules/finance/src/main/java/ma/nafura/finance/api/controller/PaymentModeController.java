package ma.nafura.finance.api.controller;

import java.util.UUID;
import ma.nafura.finance.api.request.PaymentModeCreateDto;
import ma.nafura.finance.api.request.PaymentModeUpdateDto;
import ma.nafura.finance.domain.model.PaymentMode;
import ma.nafura.finance.service.PaymentModeService;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import ma.nafura.platform.framework.api.controller.CrudController;
import ma.nafura.platform.framework.service.crud.CrudService;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/payment-modes")
@SecuredResource(domain = "finance", feature = "finance", resource = "payment-mode")
public class PaymentModeController extends CrudController<UUID, PaymentMode, PaymentModeCreateDto, PaymentModeUpdateDto> {

    private final PaymentModeService service;

    public PaymentModeController(PaymentModeService service) {
        this.service = service;
    }

    @Override
    protected CrudService<UUID, PaymentMode, PaymentModeCreateDto, PaymentModeUpdateDto> getService() {
        return service;
    }
}
