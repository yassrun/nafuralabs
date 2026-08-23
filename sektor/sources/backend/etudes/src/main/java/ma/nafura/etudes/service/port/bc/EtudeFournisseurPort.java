package ma.nafura.etudes.service.port.bc;

import java.util.UUID;

/**
 * Pont vers les fiches achats (rôle FOURNISSEUR). Inviter ≠ consulté.
 */
public interface EtudeFournisseurPort {

    record FournisseurSnapshot(UUID id, String code, String raisonSociale) {}

    FournisseurSnapshot requireFournisseur(UUID partenaireId);
}
