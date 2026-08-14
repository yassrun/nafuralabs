package ma.nafura.platform.settings.repository;

import ma.nafura.platform.settings.domain.model.SettingDefinition;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface SettingDefinitionRepository extends JpaRepository<SettingDefinition, UUID> {

    Optional<SettingDefinition> findBySettingKey(String settingKey);

    Optional<SettingDefinition> findBySettingKeyAndActiveTrue(String settingKey);

    boolean existsBySettingKey(String settingKey);
}

