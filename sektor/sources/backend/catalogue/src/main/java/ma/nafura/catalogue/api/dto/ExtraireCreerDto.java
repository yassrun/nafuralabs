package ma.nafura.catalogue.api.dto;

public record ExtraireCreerDto(
        String itemId,
        String cleStable,
        String libelle,
        boolean createdSektor,
        boolean createdItem) {}
