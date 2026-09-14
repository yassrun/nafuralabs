package ma.nafura.sektor.ai;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@JsonIgnoreProperties(ignoreUnknown = true)
public class ScreenCatalogDocument {

    private String source;
    private String sourceHash;
    private List<ScreenCatalogEntry> screens = new ArrayList<>();
}
