package ma.nafura.platform.framework.domain;

import jakarta.persistence.Column;
import jakarta.persistence.MappedSuperclass;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;

/** A record owned by a person, not by an organization. No {@code tenantId}. */
@MappedSuperclass
@Getter
@Setter
public abstract class OwnedEntity extends PlatformEntity {

    @Column(name = "owner_id", nullable = false)
    private UUID ownerId;
}
