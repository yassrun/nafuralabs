package ma.nafura.catalogue.service;

import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.catalogue.domain.model.CostingMethod;
import ma.nafura.catalogue.repository.CostingMethodRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CostingMethodResolver {

    private static final String STATUS_ACTIVE = "Active";

    private final CostingMethodRepository costingMethodRepository;

    public CostingMethodResolver(CostingMethodRepository costingMethodRepository) {
        this.costingMethodRepository = costingMethodRepository;
    }

    @Transactional(readOnly = true)
    public CostingMethod resolveActive() {
        UUID tenantId = TenantContext.getTenantId();
        List<CostingMethod> methods = costingMethodRepository.findByTenantId(tenantId);
        return methods.stream()
                .filter(m -> STATUS_ACTIVE.equalsIgnoreCase(m.getStatus())
                        || "ACTIVE".equalsIgnoreCase(m.getStatus()))
                .sorted(Comparator.comparing(CostingMethod::getCode, Comparator.nullsLast(String::compareTo)))
                .findFirst()
                .or(() -> methods.stream().findFirst())
                .orElseGet(this::defaultAvco);
    }

    @Transactional(readOnly = true)
    public boolean allowNegativeStock() {
        return Boolean.TRUE.equals(resolveActive().getAllowNegativeStock());
    }

    private CostingMethod defaultAvco() {
        return CostingMethod.builder()
                .code("AVCO")
                .method("AVCO")
                .allowNegativeStock(false)
                .status(STATUS_ACTIVE)
                .build();
    }
}
