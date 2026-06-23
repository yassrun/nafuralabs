package ma.nafura.platform.administration.iam.api.response.tenant;

import java.util.List;

/**
 * Domain toggle response DTO.
 */
public record DomainToggleResponse(
    /** Domain code/ID */
    String code,
    
    /** Display name */
    String name,
    
    /** Description */
    String description,
    
    /** Is domain currently enabled */
    boolean enabled,
    
    /** Is this a core domain that cannot be disabled */
    boolean locked,
    
    /** Icon for the domain */
    String icon,

    /** Features within this domain */
    List<FeatureToggle> features
) {
    /**
     * Feature toggle within a domain.
     */
    public record FeatureToggle(
        String code,
        String name,
        String description,
        Object value,
        Object defaultValue,
        String type,
        boolean locked
    ) {}
}

