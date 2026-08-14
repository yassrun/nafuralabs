package ma.nafura.platform.settings.repository;

import ma.nafura.platform.settings.domain.model.SettingScopeType;
import ma.nafura.platform.settings.domain.model.SettingValue;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SettingValueRepository extends JpaRepository<SettingValue, UUID> {

    Optional<SettingValue> findByApplicationIdAndSettingKeyAndScopeTypeAndScopeKey(
            String applicationId,
            String settingKey,
            SettingScopeType scopeType,
            String scopeKey);

    List<SettingValue> findByApplicationIdAndSettingKey(String applicationId, String settingKey);
}

