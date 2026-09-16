package ma.nafura.sandbox.mapper;

import java.time.Instant;
import java.util.UUID;

import org.springframework.stereotype.Component;

import ma.nafura.platform.framework.mapper.EntityMapper;
import ma.nafura.sandbox.api.request.CreateProductRequest;
import ma.nafura.sandbox.api.request.UpdateProductRequest;
import ma.nafura.sandbox.domain.SandboxProduct;

@Component
public class SandboxProductMapper implements EntityMapper<SandboxProduct, CreateProductRequest, UpdateProductRequest> {

    @Override
    public SandboxProduct toEntity(CreateProductRequest request) {
        return new SandboxProduct(
            "prd-" + Long.toHexString(System.currentTimeMillis()),
            request.code(),
            request.name(),
            request.status(),
            request.category(),
            request.description(),
            Instant.now()
        );
    }

    @Override
    public void updateEntity(UpdateProductRequest request, SandboxProduct entity) {
        if (request.code() != null) entity.setCode(request.code());
        if (request.name() != null) entity.setName(request.name());
        if (request.status() != null) entity.setStatus(request.status());
        if (request.category() != null) entity.setCategory(request.category());
        if (request.description() != null) entity.setDescription(request.description());
    }

    @Override
    public void setTenantId(SandboxProduct entity, UUID tenantId) {
    }

    @Override
    public Object getId(SandboxProduct entity) {
        return entity.getId();
    }
}
