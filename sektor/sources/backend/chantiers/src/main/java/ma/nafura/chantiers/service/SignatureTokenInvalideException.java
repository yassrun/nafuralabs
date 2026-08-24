package ma.nafura.chantiers.service;

/**
 * AC-19 — un jeton inconnu, expiré ou déjà consommé rend **le même refus**, sans révéler si
 * l'attachement existe. Ne jamais faire porter à cette exception le pourquoi (inconnu / expiré /
 * consommé) : c'est justement ce qu'elle doit cacher.
 */
public class SignatureTokenInvalideException extends RuntimeException {

    public SignatureTokenInvalideException() {
        super("chantiers.signature.jeton_invalide");
    }
}
