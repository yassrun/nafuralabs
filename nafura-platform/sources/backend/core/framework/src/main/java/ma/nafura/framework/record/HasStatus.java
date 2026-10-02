package ma.nafura.platform.framework.record;

/** A record whose status is driven by a {@link Lifecycle}: only transitions change it. */
public interface HasStatus {

    String getStatus();

    void setStatus(String status);
}
