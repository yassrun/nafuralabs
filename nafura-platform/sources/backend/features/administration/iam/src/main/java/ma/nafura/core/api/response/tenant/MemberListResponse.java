package ma.nafura.platform.administration.iam.api.response.tenant;

import java.util.List;

/**
 * Paginated member list response DTO.
 */
public record MemberListResponse(
    /** List of members */
    List<TenantMemberResponse> items,
    
    /** Total count */
    int total,
    
    /** Current page (1-indexed) */
    int page,
    
    /** Page size */
    int pageSize,
    
    /** Total pages */
    int totalPages
) {}

