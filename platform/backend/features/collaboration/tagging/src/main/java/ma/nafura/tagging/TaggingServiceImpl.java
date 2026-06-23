package ma.nafura.platform.collaboration.tagging;

import ma.nafura.platform.collaboration.tagging.domain.model.EntityTag;
import ma.nafura.platform.collaboration.tagging.domain.model.Tag;
import ma.nafura.platform.collaboration.tagging.repository.EntityTagRepository;
import ma.nafura.platform.collaboration.tagging.repository.TagRepository;
import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.platform.framework.service.crud.CrudNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TaggingServiceImpl implements TaggingService {

    private final TagRepository tagRepository;
    private final EntityTagRepository entityTagRepository;

    @Override
    @Transactional(readOnly = true)
    public Page<Tag> listTags(Pageable pageable) {
        UUID tenantId = TenantContext.getTenantId();
        return tagRepository.findByTenantId(tenantId, pageable);
    }

    @Override
    @Transactional
    public Tag createTag(String name, String color, String category) {
        UUID tenantId = TenantContext.getTenantId();
        Tag tag = Tag.builder()
                .tenantId(tenantId)
                .name(name != null ? name : "")
                .color(color)
                .category(category)
                .isActive(true)
                .build();
        return tagRepository.save(tag);
    }

    @Override
    @Transactional
    public void deleteTag(UUID tagId) {
        Tag tag = tagRepository.findByIdAndTenantId(tagId, TenantContext.getTenantId())
                .orElseThrow(() -> new CrudNotFoundException("Tag not found: " + tagId));
        tagRepository.delete(tag);
    }

    @Override
    @Transactional
    public void tagEntity(String entityType, UUID entityId, UUID tagId) {
        UUID tenantId = TenantContext.getTenantId();
        tagRepository.findByIdAndTenantId(tagId, tenantId)
                .orElseThrow(() -> new CrudNotFoundException("Tag not found: " + tagId));
        if (entityTagRepository.findByTenantIdAndEntityTypeAndEntityIdAndTagId(tenantId, entityType, entityId, tagId).isPresent()) {
            return; // already tagged
        }
        EntityTag et = EntityTag.builder()
                .tenantId(tenantId)
                .entityType(entityType)
                .entityId(entityId)
                .tagId(tagId)
                .build();
        entityTagRepository.save(et);
    }

    @Override
    @Transactional
    public void untagEntity(String entityType, UUID entityId, UUID tagId) {
        UUID tenantId = TenantContext.getTenantId();
        EntityTag et = entityTagRepository.findByTenantIdAndEntityTypeAndEntityIdAndTagId(tenantId, entityType, entityId, tagId)
                .orElse(null);
        if (et != null) {
            entityTagRepository.delete(et);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<Tag> listTagsForEntity(String entityType, UUID entityId) {
        UUID tenantId = TenantContext.getTenantId();
        List<EntityTag> entityTags = entityTagRepository.findByTenantIdAndEntityTypeAndEntityId(tenantId, entityType, entityId);
        return entityTags.stream()
                .map(et -> tagRepository.findById(et.getTagId()).orElse(null))
                .filter(t -> t != null && t.getTenantId().equals(tenantId))
                .toList();
    }
}


