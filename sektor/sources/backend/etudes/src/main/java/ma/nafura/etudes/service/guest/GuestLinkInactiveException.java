package ma.nafura.etudes.service.guest;

public class GuestLinkInactiveException extends RuntimeException {

    public GuestLinkInactiveException() {
        super("etudes.guest.lien_inactif");
    }
}
