package ma.nafura.platform.appsettings.repository;

import ma.nafura.platform.appsettings.domain.model.TenantAsset;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TenantAssetRepository extends JpaRepository<TenantAsset, UUID> {

    Optional<TenantAsset> findByTenantIdAndAssetType(UUID tenantId, String assetType);
}


