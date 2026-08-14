package ma.nafura.chantiers.api.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PhotoChantierUrlDto {

    private String id;
    private String url;
    private String storagePath;
}
