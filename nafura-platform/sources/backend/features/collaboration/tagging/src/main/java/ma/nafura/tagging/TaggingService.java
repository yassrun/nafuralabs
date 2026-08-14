package ma.nafura.platform.collaboration.tagging;

import ma.nafura.platform.collaboration.tagging.domain.model.EntityTag;
import ma.nafura.platform.collaboration.tagging.domain.model.Tag;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

public interface TaggingService {

    Page<Tag> listTags(Pageable pageable);

    Tag createTag(String name, String color, String category);

    void deleteTag(UUID tagId);

    void tagEntity(String entityType, UUID entityId, UUID tagId);

    void untagEntity(String entityType, UUID entityId, UUID tagId);

    List<Tag> listTagsForEntity(String entityType, UUID entityId);
}

