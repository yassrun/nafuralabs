package ma.nafura.platform.identity.service;

import ma.nafura.platform.identity.domain.model.AppUser;
import ma.nafura.platform.identity.repository.AppUserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Ensures authenticated IAM users are synchronized into local app_user records.
 */
@Service
public class AppUserProvisioningService {

    private static final String DEFAULT_STATUS = "ACTIVE";

    private final AppUserRepository appUserRepository;

    public AppUserProvisioningService(AppUserRepository appUserRepository) {
        this.appUserRepository = appUserRepository;
    }

    @Transactional
    public AppUser provisionAuthenticatedUser(String email) {
        return provisionAuthenticatedUser(email, null, null);
    }

    @Transactional
    public AppUser provisionAuthenticatedUser(String email, String givenName, String familyName) {
        String normalizedEmail = normalizeEmail(email);
        String resolvedName = resolveName(normalizedEmail, givenName, familyName);

        return appUserRepository.findByEmailIgnoreCase(normalizedEmail)
                .map(existing -> updateExisting(existing, normalizedEmail, resolvedName))
                .orElseGet(() -> appUserRepository.save(AppUser.builder()
                        .email(normalizedEmail)
                        .name(resolvedName)
                        .status(DEFAULT_STATUS)
                        .build()));
    }

    private AppUser updateExisting(AppUser existing, String normalizedEmail, String resolvedName) {
        boolean changed = false;

        if (existing.getEmail() == null || !existing.getEmail().equalsIgnoreCase(normalizedEmail)) {
            existing.setEmail(normalizedEmail);
            changed = true;
        }

        if (resolvedName != null && !resolvedName.isBlank() && !resolvedName.equals(existing.getName())) {
            existing.setName(resolvedName);
            changed = true;
        }

        if (existing.getStatus() == null || existing.getStatus().isBlank()) {
            existing.setStatus(DEFAULT_STATUS);
            changed = true;
        }

        return changed ? appUserRepository.save(existing) : existing;
    }

    private String normalizeEmail(String email) {
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Email is required to provision app user");
        }
        return email.trim().toLowerCase();
    }

    private String resolveName(String normalizedEmail, String givenName, String familyName) {
        String resolved = ((givenName == null ? "" : givenName.trim()) + " " +
                (familyName == null ? "" : familyName.trim())).trim();
        if (!resolved.isBlank()) {
            return resolved;
        }

        int atIndex = normalizedEmail.indexOf('@');
        if (atIndex > 0) {
            return normalizedEmail.substring(0, atIndex);
        }
        return normalizedEmail;
    }
}

