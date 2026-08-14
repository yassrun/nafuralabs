package ma.nafura.platform.appsettings.domain.model;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "tenant_asset", indexes = {
    @Index(name = "idx_tenant_asset_tenant_type", columnList = "tenant_id, asset_type", unique = true)
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TenantAsset {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "asset_type", nullable = false, length = 50)
    private String assetType; // "logo", "favicon"

    @Column(name = "content_type", length = 100)
    private String contentType;

    @Column(name = "data")
    private byte[] data;
}

