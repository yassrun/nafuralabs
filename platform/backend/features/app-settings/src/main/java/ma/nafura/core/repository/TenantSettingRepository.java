package ma.nafura.platform.appsettings.repository;

import ma.nafura.platform.appsettings.domain.model.TenantSetting;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TenantSettingRepository extends JpaRepository<TenantSetting, UUID> {

    List<TenantSetting> findByTenantId(UUID tenantId);

    Optional<TenantSetting> findByTenantIdAndSettingKey(UUID tenantId, String settingKey);

    void deleteByTenantIdAndSettingKey(UUID tenantId, String settingKey);
}


