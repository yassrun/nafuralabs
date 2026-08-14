package ma.nafura.platform.settings.api.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import ma.nafura.platform.settings.api.request.CreateSettingDefinitionRequest;
import ma.nafura.platform.settings.api.request.UpsertSettingValueRequest;
import ma.nafura.platform.settings.api.response.ResolvedSettingResponse;
import ma.nafura.platform.settings.api.response.SettingDefinitionResponse;
import ma.nafura.platform.settings.api.response.SettingValueResponse;
import ma.nafura.platform.settings.service.SettingsService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/settings")
@RequiredArgsConstructor
public class SettingsController {

    private final SettingsService settingsService;

    @PostMapping("/definitions")
    public ResponseEntity<SettingDefinitionResponse> createDefinition(
            @Valid @RequestBody CreateSettingDefinitionRequest request) {
        return ResponseEntity.ok(settingsService.createDefinition(request));
    }

    @GetMapping("/definitions")
    public ResponseEntity<List<SettingDefinitionResponse>> listDefinitions() {
        return ResponseEntity.ok(settingsService.listDefinitions());
    }

    @GetMapping("/definitions/{settingKey}")
    public ResponseEntity<SettingDefinitionResponse> getDefinition(@PathVariable String settingKey) {
        return ResponseEntity.ok(settingsService.getDefinition(settingKey));
    }

    @PutMapping("/values/{settingKey}")
    public ResponseEntity<SettingValueResponse> upsertValue(
            @PathVariable String settingKey,
            @Valid @RequestBody UpsertSettingValueRequest request) {
        return ResponseEntity.ok(settingsService.upsertValue(settingKey, request));
    }

    @GetMapping("/resolve/{settingKey}")
    public ResponseEntity<ResolvedSettingResponse> resolve(
            @PathVariable String settingKey,
            @RequestParam(required = false) String applicationId,
            @RequestParam(required = false) UUID tenantId,
            @RequestParam(required = false) String userKey) {
        return ResponseEntity.ok(settingsService.resolve(settingKey, applicationId, tenantId, userKey));
    }
}

