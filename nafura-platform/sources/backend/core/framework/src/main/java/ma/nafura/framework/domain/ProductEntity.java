package ma.nafura.platform.framework.domain;

import jakarta.persistence.MappedSuperclass;
import lombok.Getter;
import lombok.Setter;

/** A record of the product, shared by every organization and writable only by the product operator. No {@code tenantId}. */
@MappedSuperclass
@Getter
@Setter
public abstract class ProductEntity extends PlatformEntity {
}
