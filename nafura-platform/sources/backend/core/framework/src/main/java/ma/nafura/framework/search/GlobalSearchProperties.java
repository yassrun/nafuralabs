package ma.nafura.platform.framework.search;

import java.util.LinkedHashSet;
import java.util.Set;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "nafura.search")
public class GlobalSearchProperties {

    private boolean enabled = true;
    private int minQueryLength = 2;
    private int maxTotalResults = 20;
    private int maxResultsPerType = 5;
    private Set<String> enabledTypes = new LinkedHashSet<>();
}
