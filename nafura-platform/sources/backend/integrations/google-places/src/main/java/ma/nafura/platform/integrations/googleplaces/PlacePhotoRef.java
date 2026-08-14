package ma.nafura.platform.integrations.googleplaces;

import java.util.List;

public record PlacePhotoRef(
        String name,
        int widthPx,
        int heightPx,
        List<String> authorAttributions
) {}
