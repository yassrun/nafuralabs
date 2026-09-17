package ma.nafura.platform.framework.listing.savedview;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.platform.framework.context.UserContext;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ListingSavedViewService {

    private final ListingSavedViewRepository repository;

    public ListingSavedViewService(ListingSavedViewRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<ListingSavedViewDto> listForCurrentUser(String resourceKey) {
        UUID tenantId = requireTenant();
        UUID ownerId = requireUser();
        return repository
                .findByTenantIdAndOwnerUserIdAndResourceKeyOrderByNameAsc(tenantId, ownerId, resourceKey)
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public ListingSavedViewDto create(ListingSavedViewCreateRequest request) {
        UUID tenantId = requireTenant();
        UUID ownerId = requireUser();
        validateJson(request.queryJson());

        if (request.isDefault()) {
            clearDefault(tenantId, ownerId, request.resourceKey());
        }

        ListingSavedView entity = new ListingSavedView();
        entity.setTenantId(tenantId);
        entity.setOwnerUserId(ownerId);
        entity.setResourceKey(request.resourceKey());
        entity.setName(request.name().trim());
        entity.setDefault(request.isDefault());
        entity.setQueryJson(request.queryJson());

        return toDto(repository.save(entity));
    }

    @Transactional
    public ListingSavedViewDto update(UUID id, ListingSavedViewUpdateRequest request) {
        UUID tenantId = requireTenant();
        UUID ownerId = requireUser();
        validateJson(request.queryJson());

        ListingSavedView entity = repository
                .findByIdAndTenantIdAndOwnerUserId(id, tenantId, ownerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        if (request.isDefault()) {
            clearDefault(tenantId, ownerId, entity.getResourceKey());
        }

        entity.setName(request.name().trim());
        entity.setDefault(request.isDefault());
        entity.setQueryJson(request.queryJson());

        return toDto(repository.save(entity));
    }

    @Transactional
    public void delete(UUID id) {
        UUID tenantId = requireTenant();
        UUID ownerId = requireUser();
        ListingSavedView entity = repository
                .findByIdAndTenantIdAndOwnerUserId(id, tenantId, ownerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        repository.delete(entity);
    }

    private void clearDefault(UUID tenantId, UUID ownerId, String resourceKey) {
        repository
                .findByTenantIdAndOwnerUserIdAndResourceKeyAndIsDefaultTrue(tenantId, ownerId, resourceKey)
                .ifPresent(existing -> {
                    existing.setDefault(false);
                    repository.save(existing);
                });
    }

    private void validateJson(String queryJson) {
        if (queryJson == null || queryJson.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "queryJson is required");
        }
    }

    private ListingSavedViewDto toDto(ListingSavedView entity) {
        return new ListingSavedViewDto(
                entity.getId(),
                entity.getResourceKey(),
                entity.getName(),
                entity.isDefault(),
                entity.getQueryJson());
    }

    private UUID requireTenant() {
        if (!TenantContext.isTenantEnabled()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tenant context required");
        }
        return TenantContext.getTenantId();
    }

    private UUID requireUser() {
        UUID userId = UserContext.getUserIdOrNull();
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User context required");
        }
        return userId;
    }
}
