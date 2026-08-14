package ma.nafura.etudes.print;

import static ma.nafura.platform.collaboration.docmanager.template.TemplateVariableCatalogService.desc;

import java.util.List;
import java.util.Set;
import ma.nafura.platform.collaboration.docmanager.api.response.TemplateVariableDescriptor;
import ma.nafura.platform.collaboration.docmanager.template.PrintEntityTypeDescriptor;
import ma.nafura.platform.collaboration.docmanager.template.TemplateVariableCatalogContributor;
import org.springframework.stereotype.Component;

@Component
public class EtudesTemplateVariableCatalogContributor implements TemplateVariableCatalogContributor {

    @Override
    public Set<String> supportedEntityTypes() {
        return Set.of(
                EtudesPrintEntityTypes.DEVIS,
                EtudesPrintEntityTypes.DOSSIER_BORDEREAU,
                EtudesPrintEntityTypes.DOSSIER_SYNTHESE);
    }

    @Override
    public String moduleName() {
        return "etudes";
    }

    @Override
    public List<PrintEntityTypeDescriptor> entityTypeDescriptors() {
        return List.of(
                new PrintEntityTypeDescriptor(
                        EtudesPrintEntityTypes.DEVIS,
                        "administration.templates.entityTypes.devis",
                        "etudes",
                        true),
                new PrintEntityTypeDescriptor(
                        EtudesPrintEntityTypes.DOSSIER_BORDEREAU,
                        "administration.templates.entityTypes.dossier_etude_bordereau",
                        "etudes",
                        true),
                new PrintEntityTypeDescriptor(
                        EtudesPrintEntityTypes.DOSSIER_SYNTHESE,
                        "administration.templates.entityTypes.dossier_etude_synthese",
                        "etudes",
                        true));
    }

    @Override
    public List<TemplateVariableDescriptor> entityVariables(String entityType) {
        if (entityType == null) {
            return List.of();
        }
        return switch (entityType) {
            case EtudesPrintEntityTypes.DEVIS -> List.of(
                    desc("entity.numero", "N° devis", "string", "DEV-2026-001"),
                    desc("entity.version", "Version", "number", "1"),
                    desc("entity.objet", "Objet", "string", null),
                    desc("entity.dateEmission", "Date émission", "date", null),
                    desc("entity.dateValidite", "Date validité", "date", null),
                    desc("entity.client.name", "Client", "string", null),
                    desc("entity.totalHt", "Total HT", "number", null),
                    desc("entity.tvaTaux", "Taux TVA", "number", "20"),
                    desc("entity.totalTva", "Total TVA", "number", null),
                    desc("entity.totalTtc", "Total TTC", "number", null),
                    desc("entity.lignes", "Lignes devis (liste)", "list", null));
            case EtudesPrintEntityTypes.DOSSIER_BORDEREAU -> List.of(
                    desc("entity.numero", "N° dossier", "string", "ETU-2026-001"),
                    desc("entity.objet", "Objet", "string", null),
                    desc("entity.client.name", "Client", "string", null),
                    desc("entity.bordereauRevision", "Révision bordereau", "number", "1"),
                    desc("entity.totalHt", "Total HT", "number", null),
                    desc("entity.totalTtc", "Total TTC", "number", null),
                    desc("entity.lignes", "Lignes BDP aplaties (liste)", "list", null));
            case EtudesPrintEntityTypes.DOSSIER_SYNTHESE -> List.of(
                    desc("entity.numero", "N° dossier", "string", "ETU-2026-001"),
                    desc("entity.objet", "Objet", "string", null),
                    desc("entity.client.name", "Client", "string", null),
                    desc("entity.phase", "Phase", "string", "CHIFFRAGE"),
                    desc("entity.totalHt", "Total HT", "number", null),
                    desc("entity.nombreArticles", "Nb articles", "number", null),
                    desc("entity.anomaliesBloquantes", "Anomalies bloquantes", "number", "0"),
                    desc("entity.lots", "Totaux par lot (liste)", "list", null),
                    desc("entity.gates", "Gates (liste)", "list", null));
            default -> List.of();
        };
    }
}
