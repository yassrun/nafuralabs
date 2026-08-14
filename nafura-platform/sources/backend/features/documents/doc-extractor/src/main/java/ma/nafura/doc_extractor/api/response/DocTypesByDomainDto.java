package ma.nafura.platform.documents.docextractor.api.response;

import java.util.Map;

public record DocTypesByDomainDto(
        Map<String, DomainDocTypesDto> domains
) {}

