package ma.nafura.chantiers.service;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import ma.nafura.chantiers.api.request.LigneBdpCreateDto;
import ma.nafura.chantiers.api.request.LigneBdpUpdateDto;
import ma.nafura.chantiers.api.request.PosteBudgetaireCreateDto;
import ma.nafura.chantiers.domain.budget.PosteBudgetaire;
import ma.nafura.chantiers.domain.chantier.Chantier;
import ma.nafura.chantiers.domain.chantier.ChantierLot;
import ma.nafura.chantiers.domain.chantier.NatureLigne;
import ma.nafura.chantiers.repository.ChantierLotRepository;
import ma.nafura.chantiers.repository.ChantierRepository;
import ma.nafura.chantiers.repository.PosteBudgetaireRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * BDP chiffré du chantier — le bordereau qui l'engage réellement.
 *
 * <p>Il est propre au chantier : repris de l'étude quand il y en a une, construit depuis le BDP
 * importé ou saisi à la main sinon. Les lignes viennent de l'arbre lots/postes existant ; seules
 * les lignes vendues portent une quantité et un prix, et ce sont elles qui constituent le montant
 * du bordereau.
 *
 * <p>La validation du BDP retient une empreinte : dès qu'une ligne, une quantité ou un prix change,
 * l'empreinte ne correspond plus et le BDP doit être revérifié. Choisir une étude, importer un
 * bordereau ou ouvrir l'écran ne valide donc jamais le BDP à la place de l'utilisateur.
 */
@Service
public class ChantierBdpService {

    /** Aucune ligne : il n'y a pas de bordereau. */
    public static final String MANQUE_VIDE = "bdp_vide";
    /** Une ligne vendue sans quantité chiffrée. */
    public static final String MANQUE_QUANTITE = "bdp_quantite";
    /** Une ligne vendue sans prix unitaire. */
    public static final String MANQUE_PRIX = "bdp_prix";
    /** Bordereau sans montant : aucune ligne vendue, ou un total nul. */
    public static final String MANQUE_TOTAL = "bdp_total";

    public record Ligne(
            String id,
            String lotId,
            String code,
            String designation,
            String unite,
            NatureLigne nature,
            BigDecimal quantite,
            BigDecimal prixUnitaireHt,
            BigDecimal montantHt) {

        public boolean vendue() {
            return nature == NatureLigne.VENDU;
        }

        /** Montant retenu : celui porté par la ligne, sinon quantité × prix. */
        public BigDecimal montantRetenu() {
            if (montantHt != null) {
                return montantHt;
            }
            if (quantite != null && prixUnitaireHt != null) {
                return quantite.multiply(prixUnitaireHt);
            }
            return null;
        }
    }

    public record Bdp(List<Ligne> lignes, List<String> manques) {

        public boolean complet() {
            return manques.isEmpty() && !lignes.isEmpty();
        }

        public BigDecimal totalHt() {
            BigDecimal total = BigDecimal.ZERO;
            for (Ligne ligne : lignes) {
                if (!ligne.vendue()) {
                    continue;
                }
                BigDecimal montant = ligne.montantRetenu();
                if (montant != null) {
                    total = total.add(montant);
                }
            }
            return total;
        }
    }

    private final ChantierLotRepository lots;
    private final PosteBudgetaireRepository postes;
    private final PosteBudgetaireService posteService;
    private final ChantierRepository chantiers;

    public ChantierBdpService(ChantierLotRepository lots, PosteBudgetaireRepository postes,
            PosteBudgetaireService posteService, ChantierRepository chantiers) {
        this.lots = lots;
        this.postes = postes;
        this.posteService = posteService;
        this.chantiers = chantiers;
    }

    /**
     * Le BDP se construit et se corrige pendant la préparation. Après le démarrage, le bordereau
     * est le contrat en cours : il ne se réécrit plus par cet écran.
     */
    private void exigerPreparationModifiable(String chantierId) {
        Chantier chantier = chantiers.findByIdAndTenantId(chantierId, TenantContext.getTenantId())
                .orElseThrow(() -> new IllegalArgumentException("chantiers.bdp.chantier_introuvable"));
        if (!Set.of(Chantier.STATUS_BROUILLON, Chantier.STATUS_EN_PREPARATION, "PRET_A_DEMARRER")
                .contains(chantier.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "chantiers.bdp.hors_preparation");
        }
    }

    private void requireLotDuChantier(String chantierId, String lotId) {
        ChantierLot lot = lots.findByIdAndTenantId(lotId, TenantContext.getTenantId())
                .orElseThrow(() -> new IllegalArgumentException("chantiers.bdp.lot_introuvable"));
        if (!chantierId.equals(lot.getChantierId())) {
            throw new IllegalArgumentException("chantiers.bdp.lot_etranger");
        }
    }

    private void requireLigneDuChantier(String chantierId, String posteId) {
        PosteBudgetaire poste = postes.findByIdAndTenantId(posteId, TenantContext.getTenantId())
                .orElseThrow(() -> new IllegalArgumentException("chantiers.bdp.ligne_introuvable"));
        requireLotDuChantier(chantierId, poste.getLotId());
    }

    /** Ajoute une ligne au bordereau du chantier — vendue si elle est chiffrée, interne sinon. */
    @Transactional
    public PosteBudgetaire creerLigne(String chantierId, LigneBdpCreateDto request) {
        exigerPreparationModifiable(chantierId);
        requireLotDuChantier(chantierId, request.getLotId());
        PosteBudgetaireCreateDto dto = new PosteBudgetaireCreateDto();
        dto.setCode(request.getCode());
        dto.setDesignation(request.getDesignation());
        dto.setNature(request.getNature());
        dto.setUnite(request.getUnite());
        dto.setQuantite(request.getQuantite());
        dto.setPrixUnitaireHt(request.getPrixUnitaireHt());
        dto.setMontantHt(request.getMontantHt());
        dto.setOrdre(request.getOrdre());
        return posteService.creerLigneBdp(request.getLotId(), dto);
    }

    /** Corrige une ligne du bordereau : quantité, prix, unité, désignation et nature. */
    @Transactional
    public PosteBudgetaire majLigne(String chantierId, String posteId, LigneBdpUpdateDto request) {
        exigerPreparationModifiable(chantierId);
        requireLigneDuChantier(chantierId, posteId);
        return posteService.majLigneBdp(posteId, request);
    }

    /** Retire une ligne du bordereau. */
    @Transactional
    public void supprimerLigne(String chantierId, String posteId) {
        exigerPreparationModifiable(chantierId);
        requireLigneDuChantier(chantierId, posteId);
        posteService.delete(posteId);
    }

    @Transactional(readOnly = true)
    public Bdp lire(String chantierId) {
        UUID tenantId = TenantContext.getTenantId();
        List<ChantierLot> arbre = lots.findByTenantIdAndChantierIdOrderByOrdreAscCodeAsc(tenantId, chantierId);
        Set<String> parents = new HashSet<>();
        for (ChantierLot lot : arbre) {
            if (lot.getParentLotId() != null) {
                parents.add(lot.getParentLotId());
            }
        }
        List<Ligne> lignes = new ArrayList<>();
        for (ChantierLot lot : arbre) {
            List<PosteBudgetaire> enfants =
                    postes.findByTenantIdAndLotIdOrderByOrdreAscCodeAsc(tenantId, lot.getId());
            for (PosteBudgetaire poste : enfants) {
                lignes.add(new Ligne(poste.getId(), poste.getLotId(), poste.getCode(),
                        poste.getDesignation(), poste.getUnite(), poste.getNature(),
                        poste.getQuantite(), poste.getPrixUnitaireHt(), poste.getMontantHt()));
            }
            // Un lot sans poste ni sous-lot est une ligne du bordereau à part entière dès qu'il
            // est vendu ; un lot de regroupement ne porte pas de montant qui lui soit propre.
            if (enfants.isEmpty() && !parents.contains(lot.getId()) && lot.getNature() == NatureLigne.VENDU) {
                lignes.add(new Ligne(lot.getId(), lot.getId(), lot.getCode(), lot.getDesignation(),
                        lot.getUnite(), lot.getNature(), lot.getQuantite(), lot.getPrixUnitaireHt(),
                        lot.getMontantHt()));
            }
        }
        lignes.sort(Comparator.comparing(Ligne::code, Comparator.nullsLast(Comparator.naturalOrder())));
        return new Bdp(lignes, manques(lignes));
    }

    private static List<String> manques(List<Ligne> lignes) {
        List<String> manques = new ArrayList<>();
        if (lignes.isEmpty()) {
            manques.add(MANQUE_VIDE);
            return manques;
        }
        BigDecimal total = BigDecimal.ZERO;
        boolean quantiteManquante = false;
        boolean prixManquant = false;
        for (Ligne ligne : lignes) {
            if (!ligne.vendue()) {
                continue;
            }
            if (ligne.quantite() == null || ligne.quantite().signum() <= 0) {
                quantiteManquante = true;
            }
            if (ligne.prixUnitaireHt() == null) {
                prixManquant = true;
            }
            BigDecimal montant = ligne.montantRetenu();
            if (montant != null) {
                total = total.add(montant);
            }
        }
        if (quantiteManquante) {
            manques.add(MANQUE_QUANTITE);
        }
        if (prixManquant) {
            manques.add(MANQUE_PRIX);
        }
        if (total.signum() <= 0) {
            manques.add(MANQUE_TOTAL);
        }
        return List.copyOf(manques);
    }

    /**
     * Empreinte stable du bordereau : toute ligne, quantité ou prix qui change la fait changer.
     * Les lignes internes n'en font pas partie — elles ne sont pas facturées au client.
     */
    public static String empreinte(Bdp bdp) {
        StringBuilder canonique = new StringBuilder();
        for (Ligne ligne : bdp.lignes()) {
            if (!ligne.vendue()) {
                continue;
            }
            BigDecimal montant = ligne.montantRetenu();
            canonique.append(ligne.id()).append('|')
                    .append(ligne.quantite() == null ? "" : ligne.quantite().stripTrailingZeros().toPlainString()).append('|')
                    .append(ligne.prixUnitaireHt() == null ? "" : ligne.prixUnitaireHt().stripTrailingZeros().toPlainString()).append('|')
                    .append(montant == null ? "" : montant.stripTrailingZeros().toPlainString()).append('\n');
        }
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(canonique.toString().getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder();
            for (int i = 0; i < 12; i++) {
                hex.append(String.format(Locale.ROOT, "%02x", hash[i]));
            }
            return hex.toString();
        } catch (Exception ex) {
            throw new IllegalStateException("Empreinte du BDP indisponible.", ex);
        }
    }
}
