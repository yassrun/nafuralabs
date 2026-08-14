package ma.nafura.platform.settings.repository;

import ma.nafura.platform.settings.domain.model.SettingDefinitionScope;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface SettingDefinitionScopeRepository extends JpaRepository<SettingDefinitionScope, UUID> {

    List<SettingDefinitionScope> findBySettingKey(String settingKey);

    List<SettingDefinitionScope> findBySettingKeyIn(Collection<String> settingKeys);

    boolean existsBySettingKeyAndScopeType(String settingKey, ma.nafura.platform.settings.domain.model.SettingScopeType scopeType);

    void deleteBySettingKey(String settingKey);
}

