package ma.nafura.platform.usersettings.service;

import lombok.RequiredArgsConstructor;
import ma.nafura.platform.usersettings.api.request.ChangePasswordRequest;
import ma.nafura.platform.usersettings.api.request.UpdateNotificationSettingsRequest;
import ma.nafura.platform.usersettings.api.request.UpdatePreferencesRequest;
import ma.nafura.platform.usersettings.api.request.UpdateProfileRequest;
import ma.nafura.platform.usersettings.api.response.ActiveSessionResponse;
import ma.nafura.platform.usersettings.api.response.UserNotificationSettingsResponse;
import ma.nafura.platform.usersettings.api.response.UserPreferencesResponse;
import ma.nafura.platform.usersettings.api.response.UserProfileResponse;
import ma.nafura.platform.identity.domain.model.AppUser;
import ma.nafura.platform.usersettings.domain.model.UserSetting;
import ma.nafura.platform.identity.repository.AppUserRepository;
import ma.nafura.platform.usersettings.repository.UserSettingRepository;
import ma.nafura.platform.framework.context.UserContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserSettingsService {

    private static final String PREFIX_PROFILE = "profile.";
    private static final String PREFIX_PREFERENCES = "preferences.";
    private static final String PREFIX_NOTIFICATIONS = "notifications.";

    private final AppUserRepository appUserRepository;
    private final UserSettingRepository userSettingRepository;

    public UserProfileResponse getProfile() {
        UUID userId = UserContext.getUserId();
        AppUser user = appUserRepository.findById(userId)
            .orElseThrow(() -> new IllegalStateException("User not found"));
        Map<String, String> map = getSettingsMap(userId, PREFIX_PROFILE);
        String displayName = map.getOrDefault("displayName", user.getName());
        if (displayName == null) displayName = user.getEmail();
        return new UserProfileResponse(
            map.getOrDefault("firstName", ""),
            map.getOrDefault("lastName", ""),
            displayName,
            map.get("avatarUrl"),
            map.get("phone")
        );
    }

    @Transactional
    public UserProfileResponse updateProfile(UpdateProfileRequest request) {
        UUID userId = UserContext.getUserId();
        AppUser user = appUserRepository.findById(userId)
            .orElseThrow(() -> new IllegalStateException("User not found"));
        user.setName(request.displayName() != null ? request.displayName() : user.getName());
        appUserRepository.save(user);
        setSetting(userId, "profile.firstName", request.firstName());
        setSetting(userId, "profile.lastName", request.lastName());
        setSetting(userId, "profile.displayName", request.displayName());
        setSetting(userId, "profile.phone", request.phone());
        return getProfile();
    }

    public UserPreferencesResponse getPreferences() {
        UUID userId = UserContext.getUserId();
        Map<String, String> map = getSettingsMap(userId, PREFIX_PREFERENCES);
        return new UserPreferencesResponse(
            map.getOrDefault("locale", "en"),
            map.getOrDefault("timezone", "UTC"),
            map.getOrDefault("theme", "system"),
            map.get("dateFormat")
        );
    }

    @Transactional
    public UserPreferencesResponse updatePreferences(UpdatePreferencesRequest request) {
        UUID userId = UserContext.getUserId();
        setSetting(userId, "preferences.locale", request.locale());
        setSetting(userId, "preferences.timezone", request.timezone());
        setSetting(userId, "preferences.theme", request.theme());
        setSetting(userId, "preferences.dateFormat", request.dateFormat());
        return getPreferences();
    }

    public UserNotificationSettingsResponse getNotificationSettings() {
        UUID userId = UserContext.getUserId();
        Map<String, String> map = getSettingsMap(userId, PREFIX_NOTIFICATIONS);
        return new UserNotificationSettingsResponse(
            !"false".equalsIgnoreCase(map.getOrDefault("emailNotifications", "true")),
            !"false".equalsIgnoreCase(map.getOrDefault("inAppNotifications", "true")),
            map.getOrDefault("digestFrequency", "daily")
        );
    }

    @Transactional
    public UserNotificationSettingsResponse updateNotificationSettings(UpdateNotificationSettingsRequest request) {
        UUID userId = UserContext.getUserId();
        setSetting(userId, "notifications.emailNotifications", String.valueOf(request.emailNotifications()));
        setSetting(userId, "notifications.inAppNotifications", String.valueOf(request.inAppNotifications()));
        setSetting(userId, "notifications.digestFrequency", request.digestFrequency());
        return getNotificationSettings();
    }

    public List<ActiveSessionResponse> getSessions() {
        // Stub: Keycloak integration would go here. Return current session only.
        UUID userId = UserContext.getUserId();
        AppUser user = appUserRepository.findById(userId).orElse(null);
        if (user == null) return List.of();
        return List.of(new ActiveSessionResponse(
            "current",
            "Current browser",
            null,
            null,
            java.time.OffsetDateTime.now().toString(),
            true
        ));
    }

    public void revokeSession(String sessionId) {
        // Stub: Keycloak Admin API would revoke the session
    }

    public void changePassword(ChangePasswordRequest request) {
        // Stub: validate currentPassword via Keycloak, then reset via Keycloak Admin API
        throw new UnsupportedOperationException("Change password requires Keycloak integration");
    }

    private Map<String, String> getSettingsMap(UUID userId, String prefix) {
        return userSettingRepository.findByUserId(userId).stream()
            .filter(s -> s.getSettingKey() != null && s.getSettingKey().startsWith(prefix))
            .collect(Collectors.toMap(
                s -> s.getSettingKey().substring(prefix.length()),
                UserSetting::getValue,
                (a, b) -> b
            ));
    }

    private void setSetting(UUID userId, String key, String value) {
        if (value == null) {
            userSettingRepository.findByUserIdAndSettingKey(userId, key)
                .ifPresent(userSettingRepository::delete);
            return;
        }
        UserSetting setting = userSettingRepository.findByUserIdAndSettingKey(userId, key)
            .orElseGet(() -> {
                UserSetting s = new UserSetting();
                s.setUserId(userId);
                s.setSettingKey(key);
                return s;
            });
        setting.setValue(value);
        userSettingRepository.save(setting);
    }
}




