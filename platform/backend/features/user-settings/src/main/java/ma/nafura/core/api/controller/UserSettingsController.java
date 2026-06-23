package ma.nafura.platform.usersettings.api.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import ma.nafura.platform.usersettings.api.request.ChangePasswordRequest;
import ma.nafura.platform.usersettings.api.request.UpdateNotificationSettingsRequest;
import ma.nafura.platform.usersettings.api.request.UpdatePreferencesRequest;
import ma.nafura.platform.usersettings.api.request.UpdateProfileRequest;
import ma.nafura.platform.usersettings.api.response.ActiveSessionResponse;
import ma.nafura.platform.usersettings.api.response.UserNotificationSettingsResponse;
import ma.nafura.platform.usersettings.api.response.UserPreferencesResponse;
import ma.nafura.platform.usersettings.api.response.UserProfileResponse;
import ma.nafura.platform.usersettings.service.UserSettingsService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * User-scoped settings API (profile, preferences, notifications, sessions, password).
 * Base path: /api/v1/user-settings
 */
@RestController
@RequestMapping("/api/v1/user-settings")
@RequiredArgsConstructor
public class UserSettingsController {

    private final UserSettingsService userSettingsService;

    @GetMapping("/profile")
    public ResponseEntity<UserProfileResponse> getProfile() {
        return ResponseEntity.ok(userSettingsService.getProfile());
    }

    @PutMapping("/profile")
    public ResponseEntity<UserProfileResponse> updateProfile(
            @Valid @RequestBody UpdateProfileRequest request) {
        return ResponseEntity.ok(userSettingsService.updateProfile(request));
    }

    @GetMapping("/preferences")
    public ResponseEntity<UserPreferencesResponse> getPreferences() {
        return ResponseEntity.ok(userSettingsService.getPreferences());
    }

    @PutMapping("/preferences")
    public ResponseEntity<UserPreferencesResponse> updatePreferences(
            @Valid @RequestBody UpdatePreferencesRequest request) {
        return ResponseEntity.ok(userSettingsService.updatePreferences(request));
    }

    @GetMapping("/notifications")
    public ResponseEntity<UserNotificationSettingsResponse> getNotificationSettings() {
        return ResponseEntity.ok(userSettingsService.getNotificationSettings());
    }

    @PutMapping("/notifications")
    public ResponseEntity<UserNotificationSettingsResponse> updateNotificationSettings(
            @Valid @RequestBody UpdateNotificationSettingsRequest request) {
        return ResponseEntity.ok(userSettingsService.updateNotificationSettings(request));
    }

    @GetMapping("/sessions")
    public ResponseEntity<List<ActiveSessionResponse>> getSessions() {
        return ResponseEntity.ok(userSettingsService.getSessions());
    }

    @DeleteMapping("/sessions/{sessionId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void revokeSession(@PathVariable String sessionId) {
        userSettingsService.revokeSession(sessionId);
    }

    @PostMapping("/change-password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        userSettingsService.changePassword(request);
    }
}


