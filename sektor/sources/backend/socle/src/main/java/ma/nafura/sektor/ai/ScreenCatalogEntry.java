package ma.nafura.sektor.ai;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@JsonIgnoreProperties(ignoreUnknown = true)
public class ScreenCatalogEntry {

    private String id;
    private String labelKey;
    private String label;
    private String route;
    private String createRoute;
    private String detailRoute;
    private List<String> keywords = new ArrayList<>();
    private String permissionKey;
    private String help;
}
