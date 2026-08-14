package ma.nafura.platform.documents.docextractor.api.response;

import java.util.List;

public record DomainDocTypesDto(
        String domainKey,
        List<DocTypeListItemDto> docTypes
) {}

