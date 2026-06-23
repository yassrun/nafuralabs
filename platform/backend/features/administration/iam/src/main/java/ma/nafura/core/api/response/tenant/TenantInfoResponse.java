package ma.nafura.platform.administration.iam.api.response.tenant;

import java.util.List;
import java.util.Map;

/**
 * Tenant information response DTO.
 * Contains high-level tenant details for the Overview page.
 */
public record TenantInfoResponse(
    /** Unique tenant identifier */
    String tenantId,
    
    /** URL-safe tenant key/slug */
    String tenantKey,
    
    /** Display name */
    String tenantName,
    
    /** Current tenant status (active, suspended, inactive) */
    String status,
    
    /** List of enabled domain IDs */
    List<String> enabledDomains,
    
    /** Feature flags (key-value pairs) */
    Map<String, Object> features,
    
    /** Owner email */
    String ownerEmail,
    
    /** Tenant type */
    String type,
    
    /** Timestamps */
    String createdAt,
    String updatedAt
) {}


