package ma.nafura.etudes.service.port.bc;

import java.util.Optional;
import java.util.UUID;

/**
 * Pont vers le référentiel Partner (rôle CLIENT) sans coupler le module études.
 *
 * <p>Le No-Op accepte des UUID opaques pour les tests isolés. L'adaptateur produit
 * valide l'existence du partner et le rôle CLIENT dans le tenant courant.
 */
public interface EtudeClientPort {

    record ClientSnapshot(UUID id, String code, String raisonSociale) {}

    /**
     * Résout un client.
     *
     * <ul>
     *   <li>blank → empty
     *   <li>non-blank invalide → {@link IllegalArgumentException}
     * </ul>
     */
    Optional<ClientSnapshot> resolve(String clientId);

    /** Blank ou invalide → exception (génération devis / écritures dures). */
    ClientSnapshot requireClient(String clientId);

    /** Comme {@link #requireClient} + rôle CLIENT obligatoire. */
    ClientSnapshot requireClientRole(String clientId);
}
