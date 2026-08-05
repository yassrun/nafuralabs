package ma.nafura.ventes.print;

import static ma.nafura.platform.collaboration.docmanager.template.TemplateVariableCatalogService.desc;

import java.util.List;
import java.util.Set;
import ma.nafura.platform.collaboration.docmanager.api.response.TemplateVariableDescriptor;
import ma.nafura.platform.collaboration.docmanager.template.PrintEntityTypeDescriptor;
import ma.nafura.platform.collaboration.docmanager.template.TemplateVariableCatalogContributor;
import org.springframework.stereotype.Component;

@Component
public class VentesTemplateVariableCatalogContributor implements TemplateVariableCatalogContributor {

    @Override
    public Set<String> supportedEntityTypes() {
        return Set.of(VentesPrintEntityTypes.FACTURE_CLIENT);
    }

    @Override
    public String moduleName() {
        return "ventes";
    }

    @Override
    public List<PrintEntityTypeDescriptor> entityTypeDescriptors() {
        return List.of(new PrintEntityTypeDescriptor(
                VentesPrintEntityTypes.FACTURE_CLIENT,
                "administration.templates.entityTypes.facture_client",
                "ventes",
                true));
    }

    @Override
    public List<TemplateVariableDescriptor> entityVariables(String entityType) {
        if (!VentesPrintEntityTypes.FACTURE_CLIENT.equals(entityType)) {
            return List.of();
        }
        return List.of(
                desc("entity.numero", "N° facture", "string", "FAC-2026-001"),
                desc("entity.type", "Type", "string", "SITUATION"),
                desc("entity.dateEmission", "Date d'émission", "date", null),
                desc("entity.dateEcheance", "Échéance", "date", null),
                desc("entity.modePaiement", "Mode de paiement", "string", null),
                desc("entity.chantierCode", "Chantier", "string", "CH-2026-004"),
                desc("entity.client.name", "Client", "string", null),
                desc("entity.totalHt", "Total HT", "number", null),
                desc("entity.tvaTaux", "Taux TVA", "number", "20"),
                desc("entity.totalTva", "Total TVA", "number", null),
                desc("entity.retenueGarantieTaux", "Taux retenue de garantie", "number", "7"),
                desc("entity.retenueGarantieMontant", "Retenue de garantie", "number", null),
                desc("entity.resorptionAvanceMontant", "Résorption d'avance", "number", null),
                desc("entity.rasTaux", "Taux retenue à la source", "number", null),
                desc("entity.rasMontant", "Retenue à la source", "number", null),
                desc("entity.netAPayerHt", "Net à payer HT", "number", null),
                desc("entity.netAPayerTtc", "Net à payer TTC", "number", null),
                desc("entity.marchePublic", "Marché public", "boolean", null),
                desc("entity.lignes", "Lignes de facture (liste)", "list", null));
    }
}
