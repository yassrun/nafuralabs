package ma.nafura.platform.framework.listing.savedview;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;
import ma.nafura.platform.framework.domain.TenantEntity;

@Entity
@Table(name = "listing_saved_views")
@Getter
@Setter
public class ListingSavedView extends TenantEntity {

    @Column(name = "owner_user_id", nullable = false)
    private UUID ownerUserId;

    @Column(name = "resource_key", nullable = false, length = 120)
    private String resourceKey;

    @Column(name = "name", nullable = false, length = 200)
    private String name;

    @Column(name = "is_default", nullable = false)
    private boolean isDefault;

    @Column(name = "query_json", nullable = false, columnDefinition = "TEXT")
    private String queryJson;
}
