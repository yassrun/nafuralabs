package ma.nafura.chantiers.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.*;
import java.util.*;
import ma.nafura.chantiers.api.dto.BudgetArbreDto.NoeudDto;
import ma.nafura.chantiers.domain.activite.*;
import ma.nafura.chantiers.domain.chantier.NatureLigne;
import ma.nafura.chantiers.repository.*;
import ma.nafura.platform.framework.context.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@Service
public class PlanningPublicationService {
    private final PlanningPublicationRepository publications;
    private final ActiviteChantierRepository activities;
    private final ActiviteRattachementRepository attachments;
    private final BudgetArbreService budgets;
    private final ChantierRepository chantiers;
    private final PlanningPolicy policy;
    private final ObjectMapper json;
    public PlanningPublicationService(PlanningPublicationRepository publications,ActiviteChantierRepository activities,
            ActiviteRattachementRepository attachments,BudgetArbreService budgets,ChantierRepository chantiers,PlanningPolicy policy,ObjectMapper json) {
        this.publications=publications;this.activities=activities;this.attachments=attachments;this.budgets=budgets;this.chantiers=chantiers;this.policy=policy;this.json=json;
    }
    public record Options(boolean technical,boolean execution) {}
    // Explicit allowlist: never serialize a budget, activity entity, cost or personal allocation.
    public record Row(String id,String parentId,String kind,String label,LocalDate start,LocalDate finish,BigDecimal progress) {}
    public record Content(String chantierCode,String chantierName,String client,Options options,List<Row> rows) {}
    public record Preview(String token,Content content,boolean canPublish) {}
    public record Version(String id,Long version,int numero,String title,Instant publishedAt,String publishedBy,Content content,List<PlanningPublication.Acknowledgement> acknowledgements) {}
    public record Publish(String title,String token,Options options) {}
    public record Acknowledge(Long version,String outcome,LocalDate date,String clientName,String evidence,String note) {}

    @Transactional(readOnly=true)
    public List<Version> list(String chantierId) {check(chantierId);return publications.findByTenantIdAndChantierIdOrderByNumeroDesc(TenantContext.getTenantId(),chantierId).stream().map(this::view).toList();}
    @Transactional(readOnly=true)
    public Preview preview(String chantierId,Options options) {
        check(chantierId);if(options==null)throw bad("Précisez le contenu de la version.");
        var tree=budgets.lireArbre(chantierId);
        var all=activities.findByTenantIdAndChantierIdOrderByOrdreAscLibelleAsc(TenantContext.getTenantId(),chantierId).stream().filter(a->a.getForme()!=ActiviteForme.PHASE).toList();
        Map<String,Set<String>> nodesByActivity=new HashMap<>();
        for(var a:all) nodesByActivity.put(a.getId(),new HashSet<>(attachments.findByTenantIdAndActiviteId(TenantContext.getTenantId(),a.getId()).stream().map(ActiviteRattachement::noeudId).toList()));
        List<Row> rows=new ArrayList<>();
        for(var node:safe(tree.getLots())) append(node,null,all,nodesByActivity,rows);
        for(var a:all) if("JALON_CONTRACTUEL".equals(a.getNatureCode()) || (options.technical() && "JALON_TECHNIQUE".equals(a.getNatureCode())) || (options.execution() && a.getForme()==ActiviteForme.ACTIVITE))
            rows.add(new Row("activity:"+a.getId(),null,"ACTIVITE",a.getLibelle(),a.getDateDebut(),a.getDateFin(),null));
        var content=new Content(tree.getCode(),tree.getName(),tree.getClient(),options,List.copyOf(rows));
        return new Preview(hash(encode(content)),content,policy.canPublishClient(chantierId));
    }
    @Transactional(isolation=Isolation.SERIALIZABLE)
    public Version publish(String chantierId,Publish command) {
        check(chantierId);policy.assertCanPublishClient(chantierId);String actor=actor();
        text(command.title(),200,"Intitulé");var preview=preview(chantierId,command.options());
        if(!preview.token().equals(command.token()))throw conflict("La prévision a changé. Vérifiez le nouvel aperçu avant publication.");
        if(preview.content().rows().isEmpty())throw bad("Aucun lot vendu ni jalon à publier.");
        var previous=publications.findByTenantIdAndChantierIdOrderByNumeroDesc(TenantContext.getTenantId(),chantierId);
        var publication=new PlanningPublication();publication.setId(UUID.randomUUID().toString());publication.setTenantId(TenantContext.getTenantId());publication.setChantierId(chantierId);
        publication.setNumero(previous.isEmpty()?1:previous.getFirst().getNumero()+1);publication.setTitle(command.title().trim());
        publication.setPublishedAt(Instant.now());publication.setPublishedBy(actor);publication.setSnapshot(encode(preview.content()));
        return view(publications.saveAndFlush(publication));
    }
    @Transactional(isolation=Isolation.SERIALIZABLE)
    public Version acknowledge(String chantierId,String id,Acknowledge command) {
        check(chantierId);policy.assertCanPublishClient(chantierId);String actor=actor();
        var publication=publications.findByIdAndTenantIdAndChantierId(id,TenantContext.getTenantId(),chantierId).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"Version introuvable."));
        if(!Objects.equals(publication.getVersion(),command.version()))throw conflict("L’historique a changé. Actualisez la version.");
        if(command.outcome()==null || !Set.of("ACCORD","RESERVES","REFUS").contains(command.outcome()))throw bad("Choisissez le retour du client.");
        text(command.clientName(),200,"Interlocuteur client");text(command.evidence(),1000,"Référence de la preuve");
        if(command.note()!=null && command.note().length()>4000)throw bad("La note est limitée à 4 000 caractères.");
        if(command.date()==null || command.date().isAfter(LocalDate.now()) || command.date().isBefore(publication.getPublishedAt().atZone(ZoneId.of("Africa/Casablanca")).toLocalDate()))throw bad("La date du retour doit être comprise entre la publication et aujourd’hui.");
        var history=new ArrayList<>(publication.getAcknowledgements());history.add(new PlanningPublication.Acknowledgement(command.outcome(),command.date(),command.clientName().trim(),command.evidence().trim(),command.note(),actor,Instant.now()));
        publication.setAcknowledgements(history);return view(publications.saveAndFlush(publication));
    }
    private void append(NoeudDto node,String parent,List<ActiviteChantier> all,Map<String,Set<String>> mapping,List<Row> rows) {
        String next=parent;
        if(node.getNature()==NatureLigne.VENDU) {
            Set<String> ids=new HashSet<>();soldIds(node,ids);
            var linked=all.stream().filter(a->!Collections.disjoint(mapping.get(a.getId()),ids)).toList();
            next="market:"+node.getId();
            rows.add(new Row(next,parent,node.getType(),(node.getCode()==null?"":node.getCode()+" · ")+node.getDesignation(),
                    linked.stream().map(ActiviteChantier::getDateDebut).min(LocalDate::compareTo).orElse(null),linked.stream().map(ActiviteChantier::getDateFin).max(LocalDate::compareTo).orElse(null),
                    node.getTotaux()==null?null:node.getTotaux().getAvancementPercent()));
        }
        for(var child:safe(node.getEnfants()))append(child,next,all,mapping,rows);
    }
    private static void soldIds(NoeudDto node,Set<String> ids){if(node.getNature()==NatureLigne.VENDU)ids.add(node.getId());for(var child:safe(node.getEnfants()))soldIds(child,ids);}
    private static <T> List<T> safe(List<T> list){return list==null?List.of():list;}
    private void check(String id){policy.assertCanRead(id);if(chantiers.findByIdAndTenantId(id,TenantContext.getTenantId()).isEmpty())throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Chantier introuvable.");}
    private Version view(PlanningPublication p){try{return new Version(p.getId(),p.getVersion(),p.getNumero(),p.getTitle(),p.getPublishedAt(),p.getPublishedBy(),json.readValue(p.getSnapshot(),Content.class),List.copyOf(p.getAcknowledgements()));}catch(Exception e){throw new IllegalStateException(e);}}
    private String encode(Object value){try{return json.writeValueAsString(value);}catch(Exception e){throw new IllegalStateException(e);}}
    private static String hash(String value){try{return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8)));}catch(Exception e){throw new IllegalStateException(e);}}
    private static String actor(){var id=UserContext.getUserIdOrNull();if(id==null)throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);return id.toString();}
    private static void text(String value,int max,String name){if(value==null||value.isBlank()||value.length()>max)throw bad(name+" obligatoire, limité à "+max+" caractères.");}
    private static ResponseStatusException bad(String reason){return new ResponseStatusException(HttpStatus.BAD_REQUEST,reason);}
    private static ResponseStatusException conflict(String reason){return new ResponseStatusException(HttpStatus.CONFLICT,reason);}
}
