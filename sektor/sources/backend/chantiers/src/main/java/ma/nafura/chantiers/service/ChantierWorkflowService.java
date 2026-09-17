package ma.nafura.chantiers.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.math.BigDecimal;
import java.util.*;
import ma.nafura.chantiers.domain.chantier.Chantier;
import ma.nafura.chantiers.repository.ChantierRepository;
import ma.nafura.chantiers.repository.DocumentChantierRepository;
import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.platform.framework.context.UserContext;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/** One transactional lifecycle per chantier; navigation never changes business state. */
@Service
@Transactional
public class ChantierWorkflowService {

    /** Étiquette du CPS du chantier — pièce du cadrage. */
    public static final String PIECE_CPS = "CPS";
    /** Étiquette du BDP du chantier — pièce du cadrage. */
    public static final String PIECE_BDP = "BDP";
    /** Étiquette du marché signé — pièce de la préparation. */
    public static final String PIECE_MARCHE_SIGNE = "MARCHE_SIGNE";
    /** Étiquette de l'ordre de service — pièce de la préparation. */
    public static final String PIECE_OS = "ORDRE_SERVICE";

    public record Command(long revision, String action, String reference, LocalDate date,
            String documentId, String motif, String itemId, String label, String responsable,
            LocalDate echeance, String kind, BigDecimal montant, String status,
            Boolean sansReserves, String ville, String adresse, LocalDate dateFinPrevue,
            Integer dureeMois, String marcheNumero, String description, String chantierType,
            BigDecimal latitude, BigDecimal longitude) {}
    public record Event(String action, String from, String to, String reference, LocalDate date,
            String documentId, String motif, String actor, OffsetDateTime recordedAt) {}
    public record Reserve(String id, String label, String responsable, LocalDate echeance,
            String status, String preuve) {}
    public record Garantie(String id, String label, String kind, String responsable,
            BigDecimal montant, LocalDate debut, LocalDate echeance, String status, String documentId,
            String conditions) {}
    /** Vérification explicite du BDP chiffré : empreinte retenue, acteur et horodatage. */
    public record BdpValidation(String empreinte, String acteur, OffsetDateTime at) {}
    public static class Data {
        public LocalDate dateDebutPrevue;
        public BdpValidation bdp;
        public List<Event> history = new ArrayList<>();
        public List<Reserve> reserves = new ArrayList<>();
        public List<Garantie> garanties = new ArrayList<>();
    }
    public record View(Chantier chantier, long revision, Data data, List<String> blockers,
            List<String> bdpManques, List<String> availableActions, boolean canEdit) {}
    private final ChantierRepository repository;
    private final ChantierService chantiers;
    private final DocumentChantierRepository documents;
    private final ChantierBdpService bdpService;
    private final ObjectMapper json;
    public ChantierWorkflowService(ChantierRepository repository, ChantierService chantiers,
            DocumentChantierRepository documents, ChantierBdpService bdpService, ObjectMapper json) {
        this.repository = repository; this.chantiers = chantiers; this.documents = documents;
        this.bdpService = bdpService; this.json = json;
    }
    @Transactional(readOnly = true)
    public View get(String id) { return view(chantiers.getById(id)); }

    public View execute(String id, Command cmd) {
        if (!canEdit()) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Modification du chantier non autorisée.");
        Chantier c = repository.lockWorkflow(id, TenantContext.getTenantId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Chantier introuvable."));
        if (cmd.revision() != c.getWorkflowRevision())
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Le dossier a changé. Actualisez avant de poursuivre.");
        Data d = read(c);
        if (!actions(c).contains(cmd.action())) fail("Action indisponible pour ce statut.");
        String before = c.getStatus();
        String bdpEmpreinte = null;
        switch (cmd.action()) {
            case "SAVE_PREPARATION" -> {
                required(cmd.label(), "Nom du chantier requis.");
                c.setLabel(cmd.label().trim());
                // Chaque étape n'envoie que ses champs : une valeur absente ne les efface pas.
                if (cmd.ville() != null) c.setVille(trim(cmd.ville()));
                if (cmd.adresse() != null) c.setAdresse(trim(cmd.adresse()));
                if (cmd.description() != null) c.setDescription(trim(cmd.description()));
                if (cmd.chantierType() != null && !cmd.chantierType().isBlank()) {
                    c.setChantierType(cmd.chantierType().trim().toUpperCase(Locale.ROOT));
                }
                if (cmd.latitude() != null) c.setLatitude(cmd.latitude());
                if (cmd.longitude() != null) c.setLongitude(cmd.longitude());
                if (cmd.dureeMois() != null) {
                    if (cmd.dureeMois() <= 0) fail("Le délai d'exécution doit être positif.");
                    c.setDureeMois(cmd.dureeMois());
                }
                if (cmd.marcheNumero() != null) c.setMarcheNumero(trim(cmd.marcheNumero()));
                if (cmd.date() != null) { c.setDateDemarrage(cmd.date()); d.dateDebutPrevue = cmd.date(); }
                if (cmd.dateFinPrevue() != null) c.setDateFinPrevue(cmd.dateFinPrevue());
                // A chantier created without conversion has no immutable commercial snapshot.
                if (cmd.montant() != null) {
                    if (cmd.montant().signum() < 0) fail("Le déboursé initial ne peut pas être négatif.");
                    if (c.getDossierEtudeId() != null || c.getSourceVente() != null) {
                        if (c.getDebourseInitialHt() == null || cmd.montant().compareTo(c.getDebourseInitialHt()) != 0)
                            fail("Le budget initial issu d'une conversion ne peut pas être modifié.");
                    } else c.setDebourseInitialHt(cmd.montant());
                }
            }
            case "VALIDATE_BDP" -> {
                ChantierBdpService.Bdp bdp = bdpService.lire(id);
                if (!bdp.complet()) fail("BDP chiffré incomplet : " + String.join(", ", bdp.manques()));
                bdpEmpreinte = ChantierBdpService.empreinte(bdp);
                d.bdp = new BdpValidation(bdpEmpreinte, acteur(), OffsetDateTime.now());
            }
            case "VALIDATE_PREPARATION" -> {
                List<String> manquants = blockers(c, d, bdpService.lire(id));
                if (!manquants.isEmpty()) fail("Préparation incomplète : " + String.join(", ", manquants));
                c.setStatus("PRET_A_DEMARRER");
            }
            case "RETURN_PREPARATION" -> { required(cmd.motif(), "Motif requis."); c.setStatus("EN_PREPARATION"); }
            case "SAVE_OS" -> {
                required(cmd.reference(), "Référence OS requise."); requireDate(cmd.date());
                checkDocument(id, cmd.documentId(), true);
                c.setOsReference(cmd.reference().trim()); c.setOsDateEffet(cmd.date());
            }
            case "START" -> {
                required(c.getOsReference(), "Enregistrez l'OS avant le démarrage."); requireDate(c.getOsDateEffet());
                if (c.getOsDateEffet().isAfter(LocalDate.now())) fail("La date d'effet de l'OS n'est pas encore atteinte.");
                if (!blockers(c, d, bdpService.lire(id)).isEmpty()) fail("La préparation doit être complétée avant le démarrage.");
                int validation = -1, os = -1;
                for (int i = 0; i < d.history.size(); i++) {
                    if (d.history.get(i).action().equals("VALIDATE_PREPARATION")) validation = i;
                    if (d.history.get(i).action().equals("SAVE_OS")) os = i;
                }
                if (os < validation) fail("Revérifiez et enregistrez l'OS après la nouvelle validation de préparation.");
                if (c.getOsDateEffet().isBefore(LocalDate.now())) required(cmd.motif(), "Motif de saisie tardive requis.");
                c.setDateDemarrage(c.getOsDateEffet()); c.setStatus("EN_COURS");
            }
            case "SUSPEND", "RESUME", "RESUME_WORK" -> {
                required(cmd.motif(), "Motif requis."); pastDate(cmd.date()); checkDocument(id, cmd.documentId(), false);
                after(cmd.date(), c.getOsDateEffet(), "La date précède le démarrage.");
                LocalDate dernierArret = d.history.stream().filter(e -> e.action().equals("SUSPEND"))
                        .map(Event::date).filter(Objects::nonNull).reduce((a,b) -> b).orElse(null);
                if (cmd.action().equals("RESUME")) after(cmd.date(), dernierArret, "La reprise précède la suspension.");
                c.setStatus(cmd.action().equals("SUSPEND") ? "SUSPENDU" : "EN_COURS");
                if (cmd.action().equals("RESUME_WORK")) c.setDateFinReelle(null);
            }
            case "FINISH_WORK" -> {
                pastDate(cmd.date()); after(cmd.date(), c.getOsDateEffet(), "La fin précède le démarrage.");
                c.setDateFinReelle(cmd.date()); c.setStatus("EN_ATTENTE_RECEPTION_PROVISOIRE");
            }
            case "PROVISIONAL_RECEPTION" -> {
                reception(id, cmd); after(cmd.date(), c.getDateFinReelle(), "La réception précède la fin des travaux.");
                if (cmd.sansReserves() == null) fail("Indiquez si la réception comporte des réserves.");
                boolean ouvertes = d.reserves.stream().anyMatch(r -> !r.status().equals("LEVEE"));
                if (cmd.sansReserves() == ouvertes) fail("Le choix avec/sans réserves ne correspond pas au registre.");
                c.setStatus("RECEPTIONNE_PROVISOIRE");
            }
            case "FINAL_RECEPTION" -> {
                reception(id, cmd);
                if (d.reserves.stream().anyMatch(r -> !r.status().equals("LEVEE"))) fail("Des réserves restent à lever.");
                LocalDate provisoire = d.history.stream().filter(e -> e.action().equals("PROVISIONAL_RECEPTION"))
                        .map(Event::date).reduce((a,b) -> b).orElse(null);
                if (provisoire == null) fail("Le PV de réception provisoire doit être enregistré.");
                after(cmd.date(), provisoire, "La réception définitive précède la réception provisoire.");
                c.setStatus("RECEPTIONNE_DEFINITIF");
            }
            case "CLOSE" -> {
                required(cmd.motif(), "Confirmez le bilan administratif et financier dans une note de clôture.");
                if (d.reserves.stream().anyMatch(r -> !r.status().equals("LEVEE"))) fail("Des réserves restent à lever.");
                c.setStatus("CLOS"); c.setActive(false);
            }
            case "CANCEL" -> { required(cmd.motif(), "Motif d'annulation requis."); c.setStatus("ANNULE"); c.setActive(false); }
            case "ADD_RESERVE" -> {
                required(cmd.label(), "Description requise."); required(cmd.responsable(), "Responsable requis."); requireDate(cmd.echeance());
                d.reserves.add(new Reserve(UUID.randomUUID().toString(), cmd.label().trim(), cmd.responsable().trim(), cmd.echeance(), "OUVERTE", null));
            }
            case "UPDATE_RESERVE" -> {
                Reserve r = d.reserves.stream().filter(x -> x.id().equals(cmd.itemId())).findFirst().orElseThrow(() -> invalid("Réserve introuvable."));
                Set<String> next = switch(r.status()) { case "OUVERTE" -> Set.of("A_VERIFIER"); case "A_VERIFIER" -> Set.of("LEVEE", "OUVERTE"); default -> Set.of("OUVERTE"); };
                if (!next.contains(cmd.status())) fail("Transition de réserve invalide.");
                required(cmd.motif(), "Preuve ou motif de traitement requis.");
                d.reserves.set(d.reserves.indexOf(r), new Reserve(r.id(), r.label(), r.responsable(), r.echeance(), cmd.status(), cmd.motif()));
            }
            case "ADD_GARANTIE" -> {
                required(cmd.label(), "Libellé requis."); required(cmd.responsable(), "Organisme / responsable requis.");
                if (cmd.kind() == null || !Set.of("CAUTION", "COUVERTURE").contains(cmd.kind())) fail("Type de garantie invalide.");
                requireDate(cmd.date()); requireDate(cmd.echeance()); after(cmd.echeance(), cmd.date(), "Échéance antérieure au début.");
                required(cmd.motif(), "Conditions de garantie requises."); checkDocument(id, cmd.documentId(), false);
                if (cmd.montant() != null && cmd.montant().signum() < 0) fail("Montant négatif interdit.");
                d.garanties.add(new Garantie(UUID.randomUUID().toString(), cmd.label().trim(), cmd.kind(), cmd.responsable().trim(), cmd.montant(), cmd.date(), cmd.echeance(), "A_CONSTITUER", cmd.documentId(), cmd.motif()));
            }
            case "UPDATE_GARANTIE" -> {
                Garantie g = d.garanties.stream().filter(x -> x.id().equals(cmd.itemId())).findFirst().orElseThrow(() -> invalid("Garantie introuvable."));
                String next = switch(g.status()) {
                    case "A_CONSTITUER" -> "ACTIVE";
                    case "ACTIVE" -> g.kind().equals("CAUTION") ? "LIBERATION_A_DEMANDER" : "EXPIREE";
                    case "LIBERATION_A_DEMANDER" -> "LIBERATION_DEMANDEE";
                    case "LIBERATION_DEMANDEE" -> "LIBEREE";
                    default -> "";
                };
                if (!next.equals(cmd.status()) || next.isEmpty()) fail("Transition de garantie invalide.");
                if (next.equals("EXPIREE") && g.echeance().isAfter(LocalDate.now())) fail("L'échéance n'est pas atteinte.");
                required(cmd.motif(), "Justificatif requis.");
                String piece = cmd.documentId() == null || cmd.documentId().isBlank() ? g.documentId() : cmd.documentId();
                checkDocument(id, piece, next.equals("LIBEREE"));
                d.garanties.set(d.garanties.indexOf(g), new Garantie(g.id(), g.label(), g.kind(), g.responsable(), g.montant(), g.debut(), g.echeance(), next, piece, g.conditions()));
            }
            default -> fail("Action inconnue.");
        }
        d.history.add(new Event(cmd.action(), before, c.getStatus(), cmd.action().equals("START") ? c.getOsReference() : cmd.reference(),
                cmd.action().equals("START") ? c.getOsDateEffet() : cmd.date(), cmd.documentId(),
                bdpEmpreinte != null ? "BDP vérifié · empreinte " + bdpEmpreinte
                        : String.join(" · ", Arrays.asList(cmd.itemId(), cmd.label(), cmd.status(), cmd.motif()).stream().filter(Objects::nonNull).toList()),
                acteur(), OffsetDateTime.now()));
        try { c.setWorkflowData(json.writeValueAsString(d)); }
        catch (Exception ex) { throw new IllegalStateException("Impossible d'enregistrer le workflow.", ex); }
        c.setWorkflowRevision(c.getWorkflowRevision() + 1);
        repository.save(c);
        return view(c);
    }
    private View view(Chantier c) {
        Data d = read(c);
        ChantierBdpService.Bdp bdp = bdpService.lire(c.getId());
        return new View(c, c.getWorkflowRevision(), d, blockers(c, d, bdp), bdp.manques(),
                canEdit() ? actions(c) : List.of(), canEdit());
    }

    /**
     * Ce qui manque pour valider la préparation, hors OS. Le BDP chiffré en fait partie : un
     * bordereau modifié après vérification redevient à vérifier (empreinte différente).
     */
    private List<String> blockers(Chantier c, Data d, ChantierBdpService.Bdp bdp) {
        List<String> b = new ArrayList<>(chantiers.bloqueursDePreparation(c));
        if (c.getLabel() == null || c.getLabel().isBlank() || c.getVille() == null || c.getVille().isBlank()) b.add("identite_chantier");
        Set<String> pieces = pieces(c);
        if (!pieces.contains(PIECE_CPS)) b.add("cps");
        if (!pieces.contains(PIECE_BDP)) b.add("bdp");
        if (!pieces.contains(PIECE_MARCHE_SIGNE)) b.add("marche_signe");
        if (c.getMarcheNumero() == null || c.getMarcheNumero().isBlank()) b.add("marche_reference");
        if (!bdp.complet() || d.bdp == null || !ChantierBdpService.empreinte(bdp).equals(d.bdp.empreinte())) {
            b.add("bdp_chiffre");
        }
        return b;
    }

    /** Étiquettes des pièces réellement déposées — un tag sans fichier ne vaut pas un dépôt. */
    private Set<String> pieces(Chantier c) {
        Set<String> pieces = new HashSet<>();
        for (var doc : documents.findByTenantIdAndChantierIdOrderByUploadedAtDescCreatedAtDesc(c.getTenantId(), c.getId())) {
            if (doc.getStorageKey() == null || doc.getStorageKey().isBlank() || doc.getTags() == null) continue;
            try {
                var tags = json.readTree(doc.getTags());
                if (tags.isArray()) tags.forEach(tag -> pieces.add(tag.asText()));
            } catch (Exception ignored) { /* An unreadable tag cannot satisfy a required document. */ }
        }
        return pieces;
    }

    static List<String> actions(Chantier c) {
        List<String> a = new ArrayList<>(switch(c.getStatus()) {
            case "EN_PREPARATION", "BROUILLON" -> List.of("SAVE_PREPARATION", "VALIDATE_BDP", "VALIDATE_PREPARATION", "CANCEL");
            case "PRET_A_DEMARRER" -> List.of("VALIDATE_BDP", "SAVE_OS", "START", "RETURN_PREPARATION", "CANCEL");
            case "EN_COURS" -> List.of("SUSPEND", "FINISH_WORK");
            case "SUSPENDU" -> List.of("RESUME");
            case "EN_ATTENTE_RECEPTION_PROVISOIRE" -> List.of("ADD_RESERVE", "UPDATE_RESERVE", "PROVISIONAL_RECEPTION", "RESUME_WORK");
            case "RECEPTIONNE_PROVISOIRE" -> List.of("ADD_RESERVE", "UPDATE_RESERVE", "FINAL_RECEPTION");
            case "RECEPTIONNE_DEFINITIF" -> List.of("CLOSE");
            default -> List.of();
        });
        if (c.getOsDateEffet() == null || c.getOsDateEffet().isAfter(LocalDate.now()) || c.getOsReference() == null) a.remove("START");
        a.addAll(List.of("ADD_GARANTIE", "UPDATE_GARANTIE"));
        return a;
    }
    private static boolean canEdit() {
        return UserContext.hasPermission("chantiers.chantiers.chantier.update") || UserContext.hasPermission("chantiers.update")
                || Set.of("OWNER", "SUPER_ADMIN").contains(Objects.toString(UserContext.getUserRole(), ""));
    }
    private static String acteur() {
        return Objects.toString(UserContext.getUserIdOrNull(), "system");
    }
    private Data read(Chantier c) {
        if (c.getWorkflowData() == null) return new Data();
        try { return json.readValue(c.getWorkflowData(), Data.class); }
        catch (Exception ex) { throw new IllegalStateException("Données de workflow illisibles.", ex); }
    }
    private void reception(String id, Command cmd) { required(cmd.reference(), "Référence du PV requise."); pastDate(cmd.date()); checkDocument(id, cmd.documentId(), true); }
    private void checkDocument(String id, String documentId, boolean required) {
        if (documentId == null || documentId.isBlank()) { if (required) fail("Sélectionnez le document justificatif."); return; }
        if (documents.findByIdAndTenantId(documentId, TenantContext.getTenantId()).filter(d -> id.equals(d.getChantierId())).isEmpty()) fail("Document étranger au chantier ou introuvable.");
    }
    private static String trim(String s) { return s == null ? null : s.trim(); }
    private static void required(String s, String message) { if (s == null || s.isBlank()) fail(message); }
    private static void requireDate(LocalDate date) { if (date == null) fail("Date requise."); }
    private static void pastDate(LocalDate date) { requireDate(date); if (date.isAfter(LocalDate.now())) fail("La date effective ne peut pas être future."); }
    private static void after(LocalDate date, LocalDate min, String message) { if (min != null && date.isBefore(min)) fail(message); }
    private static ResponseStatusException invalid(String message) { return new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, message); }
    private static void fail(String message) { throw invalid(message); }
}
