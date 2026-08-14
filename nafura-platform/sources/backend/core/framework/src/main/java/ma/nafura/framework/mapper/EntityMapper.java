package ma.nafura.platform.framework.mapper;

import org.mapstruct.MappingTarget;

import java.util.UUID;

/**
 * Base mapper interface for all entities.
 * MapStruct implementations are generated via @Mapper annotation on concrete interfaces.
 *
 * @param <TEntity> Entity type
 * @param <TCreate> Create DTO type
 * @param <TUpdate> Update DTO type
 */
public interface EntityMapper<TEntity, TCreate, TUpdate> {

    /**
     * Convert create DTO to entity.
     * Implementation should ignore id, tenantId, createdAt, updatedAt fields.
     */
    TEntity toEntity(TCreate createDto);

    /**
     * Apply update DTO to existing entity.
     * Implementation should ignore id, tenantId, createdAt fields.
     */
    void updateEntity(TUpdate updateDto, @MappingTarget TEntity entity);

    /**
     * Set tenant ID on entity.
     * Default implementation assumes entity has setTenantId method.
     */
    void setTenantId(@MappingTarget TEntity entity, UUID tenantId);

    /**
     * Extract entity ID.
     * Default implementation assumes entity has getId method.
     */
    Object getId(TEntity entity);
}

