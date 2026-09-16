package ma.nafura.sandbox.showroom.mapper;

import java.time.Instant;
import java.util.UUID;

import org.springframework.stereotype.Component;

import ma.nafura.platform.framework.mapper.EntityMapper;
import ma.nafura.sandbox.showroom.api.request.CreateProductRequest;
import ma.nafura.sandbox.showroom.api.request.UpdateProductRequest;
import ma.nafura.sandbox.showroom.domain.ShowroomProduct;

@Component
public class ShowroomProductMapper implements EntityMapper<ShowroomProduct, CreateProductRequest, UpdateProductRequest> {

    @Override
    public ShowroomProduct toEntity(CreateProductRequest request) {
        return new ShowroomProduct(
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
    public void updateEntity(UpdateProductRequest request, ShowroomProduct entity) {
        if (request.code() != null) entity.setCode(request.code());
        if (request.name() != null) entity.setName(request.name());
        if (request.status() != null) entity.setStatus(request.status());
        if (request.category() != null) entity.setCategory(request.category());
        if (request.description() != null) entity.setDescription(request.description());
    }

    @Override
    public void setTenantId(ShowroomProduct entity, UUID tenantId) {
    }

    @Override
    public Object getId(ShowroomProduct entity) {
        return entity.getId();
    }
}
