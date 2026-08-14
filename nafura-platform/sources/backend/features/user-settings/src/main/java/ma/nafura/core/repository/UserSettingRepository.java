package ma.nafura.platform.usersettings.repository;

import ma.nafura.platform.usersettings.domain.model.UserSetting;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserSettingRepository extends JpaRepository<UserSetting, UUID> {

    List<UserSetting> findByUserId(UUID userId);

    Optional<UserSetting> findByUserIdAndSettingKey(UUID userId, String settingKey);

    void deleteByUserIdAndSettingKey(UUID userId, String settingKey);
}

