package ma.nafura.catalogue.api.dto;

/**
 * Preuve SEKTOR-106 : lier une ref fournisseur à l'identité existante,
 * sans créer d'Item parallèle.
 */
public record ItemFournisseurBindDto(
        String itemId, String cleStable, String refFournisseur, boolean createdItem) {}
