package ma.nafura.etudes.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import ma.nafura.etudes.api.dto.AOClientChecklistItemDto;
import ma.nafura.etudes.api.dto.AOClientDocumentDto;
import ma.nafura.etudes.domain.model.AppelOffreClient;
import org.springframework.stereotype.Component;

@Component
public class AppelOffreClientEmbeddedBuilder {

    private static final Set<String> SUBMITTED_STATUSES = Set.of(
            AppelOffreClient.STATUS_SOUMIS,
            AppelOffreClient.STATUS_ATTRIBUE,
            AppelOffreClient.STATUS_PERDU,
            AppelOffreClient.STATUS_INFRUCTUEUX);

    private static final Set<String> PREPARATION_STATUSES = Set.of(
            AppelOffreClient.STATUS_EN_PREPARATION,
            AppelOffreClient.STATUS_SOUMIS,
            AppelOffreClient.STATUS_ATTRIBUE,
            AppelOffreClient.STATUS_PERDU,
            AppelOffreClient.STATUS_INFRUCTUEUX);

    public List<AOClientDocumentDto> buildDocuments(AppelOffreClient entity) {
        String aocId = entity.getId().toString();
        String prefix = aocId + "-doc-";
        String status = entity.getStatus();
        boolean notAEtudier = !AppelOffreClient.STATUS_A_ETUDIER.equals(status);
        boolean submitted = SUBMITTED_STATUSES.contains(status);
        List<AOClientDocumentDto> docs = new ArrayList<>();
        docs.add(document(prefix + "dce", aocId, "DCE", "DCE — Dossier consultation entreprises", true, true));
        docs.add(document(prefix + "ccap", aocId, "CCAP", "CCAP", true, true));
        docs.add(document(prefix + "cctp", aocId, "CCTP", "CCTP", true, true));
        docs.add(document(prefix + "bpu", aocId, "BPU", "BPU — Bordereau prix unitaires", true, notAEtudier));
        docs.add(document(prefix + "plans", aocId, "PLAN", "Plans architecte", true, notAEtudier));
        docs.add(document(prefix + "reponse", aocId, "REPONSE", "Mémoire technique", true, submitted));
        docs.add(document(prefix + "caution", aocId, "CAUTION", "Caution provisoire", true, submitted));
        return docs;
    }

    public List<AOClientChecklistItemDto> buildChecklist(AppelOffreClient entity) {
        String aocId = entity.getId().toString();
        String prefix = aocId + "-chk-";
        String status = entity.getStatus();
        boolean submitted = SUBMITTED_STATUSES.contains(status);
        boolean preparation = PREPARATION_STATUSES.contains(status);
        List<AOClientChecklistItemDto> items = new ArrayList<>();
        items.add(checklist(prefix + "1", aocId, "Caution provisoire émise (banque)", submitted));
        items.add(checklist(prefix + "2", aocId, "Mémoire technique rédigé", submitted));
        items.add(checklist(prefix + "3", aocId, "Références chantiers compilées", preparation));
        items.add(checklist(prefix + "4", aocId, "Attestations CNSS, IGR, RC à jour", preparation));
        items.add(checklist(prefix + "5", aocId, "PV de signature responsables", submitted));
        items.add(checklist(prefix + "6", aocId, "Plis cachetés et déposés", submitted));
        return items;
    }

    public void syncEmbeddedIds(AppelOffreClient entity) {
        if (entity.getId() == null) {
            return;
        }
        String aocId = entity.getId().toString();
        if (entity.getDocuments() != null) {
            for (AOClientDocumentDto doc : entity.getDocuments()) {
                doc.setAocId(aocId);
            }
        }
        if (entity.getChecklist() != null) {
            for (AOClientChecklistItemDto item : entity.getChecklist()) {
                item.setAocId(aocId);
            }
        }
    }

    private AOClientDocumentDto document(
            String id, String aocId, String category, String name, boolean obligatoire, boolean fourni) {
        return AOClientDocumentDto.builder()
                .id(id)
                .aocId(aocId)
                .category(category)
                .name(name)
                .url("#")
                .obligatoire(obligatoire)
                .fourni(fourni)
                .build();
    }

    private AOClientChecklistItemDto checklist(String id, String aocId, String label, boolean done) {
        return AOClientChecklistItemDto.builder()
                .id(id)
                .aocId(aocId)
                .label(label)
                .done(done)
                .build();
    }
}
