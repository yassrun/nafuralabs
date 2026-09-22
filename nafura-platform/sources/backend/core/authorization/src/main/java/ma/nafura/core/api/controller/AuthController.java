package ma.nafura.platform.authorization.api.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.nafura.platform.authorization.api.response.auth.CurrentUserResponse;
import ma.nafura.platform.authorization.api.response.tenant.PermissionGroupResponse;
import ma.nafura.platform.authorization.repository.UserRoleRepository;
import ma.nafura.platform.authorization.security.jwt.JwtClaimMapper;
import ma.nafura.platform.authorization.service.PermissionMetadataService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Shared authentication controller for all applications.
 */
@Slf4j
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserRoleRepository userRoleRepository;
    private final PermissionMetadataService permissionMetadataService;
    private final JwtClaimMapper jwtClaimMapper;

    /**
     * Get current user info from JWT token.
     */
    @GetMapping("/me")
    public ResponseEntity<CurrentUserResponse> getCurrentUser(@AuthenticationPrincipal Jwt jwt) {
        log.info("GET /api/auth/me called");
        
        if (jwt == null) {
            log.error("JWT is null - authentication may have failed");
            return ResponseEntity.status(401).build();
        }
        
        try {
            String userId = jwt.getSubject();
            String email = jwtClaimMapper.email(jwt);
            String firstName = jwtClaimMapper.givenName(jwt);
            String lastName = jwtClaimMapper.familyName(jwt);
            
            log.info("User info from JWT: userId={}, email={}", userId, email);
            
            boolean isSuperAdmin = false;
            try {
                isSuperAdmin = jwtClaimMapper.isSuperAdmin(jwt);
                
                if (!isSuperAdmin && email != null) {
                    isSuperAdmin = userRoleRepository.existsByEmailIgnoreCaseAndRoleCode(email, "SUPER_ADMIN");
                    if (isSuperAdmin) {
                        log.info("User {} identified as super admin from database role", email);
                    }
                }
            } catch (Exception e) {
                log.warn("Error checking super admin status: {}", e.getMessage());
            }

            String displayName = jwtClaimMapper.displayName(jwt);

            CurrentUserResponse response = new CurrentUserResponse(
                userId,
                email,
                firstName != null ? firstName : "",
                lastName != null ? lastName : "",
                displayName,
                null,
                isSuperAdmin,
                jwt.getIssuedAt() != null ? jwt.getIssuedAt().toString() : null,
                jwt.getIssuedAt() != null ? jwt.getIssuedAt().toString() : null,
                null
            );

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error processing JWT: {}", e.getMessage(), e);
            return ResponseEntity.status(500).build();
        }
    }

    /**
     * Get all available permissions grouped by domain scope.
     */
    @GetMapping("/permissions")
    public ResponseEntity<List<PermissionGroupResponse>> getAllPermissions(@AuthenticationPrincipal Jwt jwt) {
        log.debug("GET /api/auth/permissions");
        return ResponseEntity.ok(permissionMetadataService.getAllPermissions());
    }
}
