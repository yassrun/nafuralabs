package ma.nafura.platform.framework.record;

import java.time.ZoneId;

import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.stereotype.Component;

/** Used when the organisation has not declared a time zone. */
@Component
@ConditionalOnMissingBean(OrganizationZone.class)
public class UtcOrganizationZone implements OrganizationZone {

    @Override
    public ZoneId zone() {
        return ZoneId.of("UTC");
    }
}
