package ma.nafura.platform.framework.record;

import java.time.ZoneId;

/** Time zone of the current organisation. Relative dates in a filter are resolved in it. */
public interface OrganizationZone {

    ZoneId zone();
}
