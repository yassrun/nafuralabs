package ma.nafura.hse.service;

import java.util.List;
import ma.nafura.hse.api.dto.AuditTemplateDto;
import ma.nafura.hse.api.dto.AuditTemplateItemDto;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuditTemplateService {

    @Transactional(readOnly = true)
    public List<AuditTemplateDto> listTemplates() {
        return List.of(
                AuditTemplateDto.builder()
                        .code("ECHAFAUDAGES")
                        .label("Audit échafaudages")
                        .description("Checklist prévention chutes — montage, ancrage, garde-corps, accès.")
                        .items(List.of(
                                item("ECH-01", "Platelages complets sans trou", "Structure", 0),
                                item("ECH-02", "Garde-corps conformes (1,00 m)", "Protection collective", 1),
                                item("ECH-03", "Ancrage au bâtiment vérifié", "Fixation", 2),
                                item("ECH-04", "Accès sécurisé (échelle/escalier)", "Accès", 3),
                                item("ECH-05", "Harnais portés en hauteur", "EPI", 4)))
                        .build(),
                AuditTemplateDto.builder()
                        .code("EPI")
                        .label("Audit EPI")
                        .description("Dotation, port et conformité des équipements de protection individuelle.")
                        .items(List.of(
                                item("EPI-01", "Casques portés en zone obligatoire", "Tête", 0),
                                item("EPI-02", "Chaussures de sécurité adaptées", "Pieds", 1),
                                item("EPI-03", "Gants adaptés à l'activité", "Mains", 2),
                                item("EPI-04", "Lunettes / visière si risque projection", "Yeux", 3),
                                item("EPI-05", "Registre de dotation à jour", "Traçabilité", 4)))
                        .build(),
                AuditTemplateDto.builder()
                        .code("INCENDIE")
                        .label("Audit incendie & évacuation")
                        .description("Extincteurs, issues de secours, consignes et exercices.")
                        .items(List.of(
                                item("INC-01", "Extincteurs en bon état et accessibles", "Matériel", 0),
                                item("INC-02", "Issues de secours dégagées", "Évacuation", 1),
                                item("INC-03", "Plan d'évacuation affiché", "Signalisation", 2),
                                item("INC-04", "Exercice évacuation planifié (< 6 mois)", "Organisation", 3)))
                        .build());
    }

    private static AuditTemplateItemDto item(String code, String libelle, String categorie, int ordre) {
        return AuditTemplateItemDto.builder()
                .code(code)
                .libelle(libelle)
                .categorie(categorie)
                .ordre(ordre)
                .build();
    }
}
