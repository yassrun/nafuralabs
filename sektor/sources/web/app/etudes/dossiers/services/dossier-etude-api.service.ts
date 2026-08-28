import { Injectable } from '@angular/core';
import { HttpErrorResponse, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { FeatureApiService } from '@platform/lib/anatomy';
import type {
  DossierDocument,
  DossierEtude,
  DossierEtudeCreate,
  DossierEtudeUpdate,
  DossierPieceAttendue,
  MarchePropose,
  ResultatGate,
  TypeDossierDocument,
} from '@app/etudes/models';
import type { ImportNoeudPreview } from '../utils/bordereau-tree.util';
import type { GuestLinkCreate, GuestLinkCreated } from './guest-access-api.service';

/** AC-12 — un poste du devis sans lot parent, nommé par le serveur pour que l'humain le place. */
export interface PosteOrphelin {
  posteId: string;
  code: string;
  designation: string;
}

/** AC-12 — la décision de l'humain pour un poste orphelin : un lot existant, ou un lot à créer. */
export interface PlacementPosteOrphelin {
  posteId: string;
  lotCode?: string;
  nouveauLotCode?: string;
  nouveauLotDesignation?: string;
}

/** AC-12 — un lot du devis, offert comme destination. L'humain peut aussi créer le lot d'accueil. */
export interface LotDaccueilPossible {
  code: string;
  designation: string;
}

/** AC-13 — ce que l'écran de conversion demande. Aucun champ ne suppose un planning. */
export interface ConversionRequest {
  chantierLabel?: string;
  chantierCode?: string;
  chantierVille?: string;
  dateDemarrage?: string;
  dureeMois?: number;
  marcheReference?: string;
  montantHt?: number;
  tauxTva?: number;
  placementsPostesOrphelins?: PlacementPosteOrphelin[];
}

/** AC-10 — la conversion ne rend qu'un chantier. Aucun marché n'en sort. */
export interface ConversionResult {
  dossierId: string;
  chantierId: string;
  status: string;
}

/**
 * AC-12 — la conversion s'est arrêtée avant de rien créer : des postes doivent être placés.
 * Portée telle quelle jusqu'à l'écran, qui les nomme.
 */
export class PostesOrphelinsError extends Error {
  constructor(
    readonly postes: PosteOrphelin[],
    readonly lotsDisponibles: LotDaccueilPossible[],
  ) {
    super('etudes.dossier.postes_orphelins');
    this.name = 'PostesOrphelinsError';
  }
}

export interface ExtractionJobDto {
  id: string;
  dossierEtudeId: string;
  dossierDocumentId: string;
  jobType: 'BORDEREAU_EXTRACT' | 'CPS_INDEX' | string;
  status: 'QUEUED' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'CANCELLED' | string;
  progressPercent: number;
  progressStep?: string | null;
  result?: {
    arbre?: ImportNoeudPreview[];
    articleCount?: number;
    pieceId?: string;
    fileName?: string;
    outcome?: string;
    cpsDocumentId?: string;
    statutExtraction?: string;
    nbSections?: number;
  } | null;
  errorCode?: string | null;
  errorMessage?: string | null;
  attemptCount: number;
  maxAttempts: number;
  createdAt?: string;
  startedAt?: string | null;
  finishedAt?: string | null;
}

export interface ValiderBordereauResult {
  dpgfId: string;
  numero: string;
  articlesAcceptes: number;
  articlesIgnores: number;
}

/** Suggestion Gemini depuis les sections CPS (jamais persistée automatiquement). */
export interface DescriptifPropose {
  texte: string;
  sectionSourceId?: string | null;
  confiance: number;
}

export interface DecompositionComposantMatched {
  type: string;
  /** Vide / absent pour un composant manuel (hors catalogue). */
  itemId?: string;
  cleStable?: string;
  code?: string;
  name: string;
  unite: string;
  rendement: number;
  prixUnitaire?: number | null;
  sourcePrix?: string;
  prixSourceRefId?: string | null;
  prixDateSource?: string | null;
  prixCurrencyId?: string | null;
  prixLibelleSource?: string | null;
  confiance?: number;
  suggereParIa?: boolean;
}

export interface DecompositionComposantMissing {
  type: string;
  designation: string;
  cleStable?: string;
  unite: string;
  rendement: number;
  confiance?: number;
  raison?: string;
}

export interface DecompositionComposantIncertain {
  type: string;
  designation: string;
  unite: string;
  rendement: number;
  confiance?: number;
  identitesCandidates?: string[];
}

/** Suggestion Extraire : déjà tenant / à créer / incertain (2+ identités, pas de décision). */
export interface DecompositionPropose {
  matched: DecompositionComposantMatched[];
  missing: DecompositionComposantMissing[];
  uncertain?: DecompositionComposantIncertain[];
  confiance?: number;
}

/** Synthèse des coûts d'affaire (L1/L6) — projection. */
export interface SyntheseCoutAffaire {
  montantTotalHt: number;
  coutTotalEtabli: number;
  margeSurCoutsEtablis: number;
  margePercentSurCoutsEtablis: number;
  montantCoutsDeduits: number;
  partCoutsNonEtablisPercent: number;
  repartitionMontantParOrigine: Record<string, number>;
  repartitionPercentParOrigine: Record<string, number>;
}

/** L8 — avis d'exécution. */
export type NiveauAvisExecution = 'REALISABLE' | 'DIFFICILE' | 'IRREALISABLE';
export type StatutAvisExecution = 'OUVERT' | 'PRIS_EN_COMPTE' | 'ECARTE';

export interface AvisExecution {
  id: string;
  dossierEtudeId: string;
  dpgfNoeudId: string;
  niveau: NiveauAvisExecution;
  commentaire?: string | null;
  ecartPropose?: number | null;
  auteurUserId: string;
  auteurNom?: string | null;
  statut: StatutAvisExecution;
  motifTraitement?: string | null;
  traitePar?: string | null;
  traiteLe?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface AvisExecutionResume {
  ouverts: number;
  ecartes: number;
  prisEnCompte: number;
  total: number;
}

/** L9 — rattrapage LIBRE. */
export interface RattrapageGroupe {
  libelle: string;
  libelleNormalise: string;
  count: number;
  composantIds: string[];
  noeudIds?: string[];
}

export interface DemandeCreationArticle {
  id: string;
  libelle: string;
  nature: string;
  uomCode?: string | null;
  statut: string;
}

export interface RattrapageResume {
  totalLibres: number;
  groupes: number;
  creationArticleMode: 'LIBRE' | 'CONTROLEE' | string;
  groupesDetail: RattrapageGroupe[];
  demandesOuvertes: DemandeCreationArticle[];
}

/** SEKTOR-218 — agent contextuel du dossier ouvert (AC-16). */
export interface DossierAgentProvenanceEtape {
  etape: string;
  libelle: string;
  reference?: string | null;
  source?: string | null;
}

export interface DossierAgentSuggestion {
  id: string;
  actionType: string;
  libelle: string;
  etat: 'EN_ATTENTE' | 'ACCEPTEE' | 'REFUSEE' | 'CORRIGEE' | string;
  acteur?: string | null;
  date?: string | null;
  correctionNote?: string | null;
  provenanceJson?: string | null;
}

export interface DossierAgentContext {
  dossierId: string;
  numero: string;
  objet: string;
  provenance: DossierAgentProvenanceEtape[];
  journal: DossierAgentSuggestion[];
  chatGenerique: boolean;
}

/** L12 — versement bibliothèque après VALIDEE. */
export interface CapitalisationRendementLigne {
  libelle: string;
  unite: string;
  rendementBiblio?: number | null;
  rendementEtude?: number | null;
}

export interface CapitalisationArticle {
  noeudId: string;
  prixDpuId: string;
  codePropose: string;
  designation: string;
  unite: string;
  codeLot: string;
  codeFamille: string;
  deboursSec?: number | null;
  nbComposants: number;
  statut: 'NOUVEAU' | 'COLLISION' | 'DEJA_VERSE' | string;
  ouvrageExistantId?: string | null;
  ouvrageExistantCode?: string | null;
  comparaisonRendements?: CapitalisationRendementLigne[];
}

export interface CapitalisationResume {
  totalCandidats: number;
  nouveaux: number;
  collisions: number;
  dejaVerses: number;
  dossierValide: boolean;
  articles: CapitalisationArticle[];
}

export interface CapitalisationVersementResult {
  crees: number;
  remplaces: number;
  ignores: number;
  ouvrageIds: string[];
}

export type RattrapageCreerResult =
  | {
      itemId: string;
      name: string;
      aCompleter?: boolean;
      composantsLies: number;
      idempotent?: boolean;
    }
  | DemandeCreationArticle;

/** Trace décision Catalogue sur composant autrefois LIBRE (SEKTOR-215). */
export interface DecisionCatalogueTrace {
  composantId: string;
  libelle: string;
  decision: 'POSTE_SEULEMENT' | 'CREE_ET_LIE' | 'RATTACHE_EXISTANT' | 'IGNORE_MOTIF' | string;
  itemId?: string | null;
  itemCode?: string | null;
  itemName?: string | null;
  acteur?: string | null;
  date?: string | null;
  motif?: string | null;
}

/** Synthèse agrégée pour l'entête du dossier. */
export interface DossierEtudeSynthese {
  id: string;
  numero: string;
  objet: string;
  clientId?: string | null;
  clientNom?: string | null;
  chargeEtudeUserId?: string | null;
  chargeEtudeNom?: string | null;
  appelOffreClientId?: string | null;
  status: string;
  currentStep: number;
  phase: string;
  validationEtape?: string | null;
  bordereauRevision: number;
  structureVerrouillee: boolean;
  modifiable: boolean;
  nombreArticles: number;
  anomaliesBloquantes: number;
  totalHt: number;
  devisGenereId?: string | null;
  devisNumero?: string | null;
  chantierGenereId?: string | null;
  marcheGenereId?: string | null;
  approvalRequestId?: string | null;
  prochainApprobateurRole?: string | null;
  prochainApprobateurNom?: string | null;
  motifRefus?: string | null;
  createdBy?: string | null;
  updatedBy?: string | null;
  updatedAt?: string | null;
  gates: ResultatGate[];
  actionPrincipale: string;
  decisionsCatalogue?: DecisionCatalogueTrace[];
}

export interface ChargeEtudeCandidat {
  userId: string;
  email: string;
  displayName: string;
}

export interface ConsultationEtudeLigne {
  id?: string;
  cleStable: string;
  designation?: string | null;
  quantite?: number | null;
  unite?: string | null;
  prixUnitaire: number;
  itemId?: string | null;
}

export interface ConsultationEtudeDevis {
  id: string;
  partenaireId: string;
  documentId?: string | null;
  recuAt?: string | null;
  hasLignes: boolean;
  lignes: ConsultationEtudeLigne[];
}

export interface ConsultationIdentiteCouverte {
  cleStable: string;
  devisConsultationId?: string | null;
  prixUnitaire: number;
}

export interface ConsultationEtude {
  id: string;
  dossierEtudeId: string;
  statut: string;
  paquetCleStables: string[];
  partenaireIds: string[];
  devis: ConsultationEtudeDevis[];
  identitesCouvertes: ConsultationIdentiteCouverte[];
  devisRecus: number;
  fournisseursDistincts: number;
}

@Injectable({ providedIn: 'root' })
export class DossierEtudeApiService extends FeatureApiService<
  DossierEtude,
  DossierEtudeCreate,
  DossierEtudeUpdate
> {
  protected override basePath = '/api/v1/etudes/dossiers';
  protected override searchFields = ['numero', 'objet', 'clientNom'];

  /**
   * État des cinq gates, sans transition.
   *
   * Le front ne rejoue jamais les règles : il les lit ici. C'est ce qui empêche la logique de
   * gate de diverger entre les deux côtés, comme c'était le cas dans le module supprimé.
   */
  gates(id: string): Promise<ResultatGate[]> {
    return this.get<ResultatGate[]>(`${this.basePath}/${id}/gates`);
  }

  allerAEtape(id: string, etape: number): Promise<DossierEtude> {
    return this.put<DossierEtude>(`${this.basePath}/${id}/etape`, { etape });
  }

  soumettre(id: string): Promise<DossierEtude> {
    return this.executeTransition(id, 'soumettre');
  }

  valider(id: string): Promise<DossierEtude> {
    return this.executeTransition(id, 'valider');
  }

  refuser(id: string, motif: string): Promise<DossierEtude> {
    return this.executeTransition(id, 'refuser', { motif });
  }

  annuler(id: string): Promise<DossierEtude> {
    return this.executeTransition(id, 'annuler');
  }

  synthese(id: string): Promise<DossierEtudeSynthese> {
    return this.get<DossierEtudeSynthese>(`${this.basePath}/${id}/synthese`);
  }

  /** Users tenant avec rôle BTP_INGENIEUR — candidats chargé d'étude. */
  listIngenieurs(): Promise<ChargeEtudeCandidat[]> {
    return this.get<ChargeEtudeCandidat[]>('/api/v1/etudes/ingenieurs');
  }

  reouvrirBordereau(id: string): Promise<DossierEtude> {
    return this.executeTransition(id, 'reouvrir-bordereau');
  }

  genererDevis(id: string, body?: { clientId?: string }): Promise<DossierEtude> {
    return this.executeTransition(id, 'generer-devis', body);
  }

  /** L13/AC-1..AC-6 — affaire gagnée (DEVIS_GENERE → GAGNE), approbation atomique du devis. */
  marquerGagne(
    id: string,
    body: {
      dateAttribution: string;
      referenceMarche?: string | null;
      devisId?: string | null;
      montantAttribue?: number | null;
      motifDerogation?: string | null;
    },
  ): Promise<DossierEtude> {
    return this.executeTransition(id, 'gagne', body);
  }

  /** L13 — affaire perdue (DEVIS_GENERE → PERDU). */
  marquerPerdu(
    id: string,
    body: {
      motif: string;
      concurrentRetenu?: string | null;
      ecartPrixEstime?: number | null;
    },
  ): Promise<DossierEtude> {
    return this.executeTransition(id, 'perdu', body);
  }

  /**
   * L13 — conversion de l'étude gagnée : chantier `EN_PREPARATION`, son arbre, son budget.
   * Aucun marché n'en sort (AC-10) : le marché naît à la notification.
   */
  async convertir(id: string, body: ConversionRequest = {}): Promise<ConversionResult> {
    try {
      return await this.executeTransition<ConversionResult>(
        id,
        'convertir',
        body as unknown as Record<string, unknown>,
      );
    } catch (err) {
      // AC-12 — 422 nommant les postes sans lot d'accueil : rien n'a été créé côté serveur.
      if (
        err instanceof HttpErrorResponse &&
        err.status === 422 &&
        err.error?.code === 'etudes.dossier.postes_orphelins'
      ) {
        throw new PostesOrphelinsError(
          (err.error.postesOrphelins ?? []) as PosteOrphelin[],
          (err.error.lotsDisponibles ?? []) as LotDaccueilPossible[],
        );
      }
      throw err;
    }
  }

  listerDocuments(dossierId: string): Promise<DossierDocument[]> {
    return this.get<DossierDocument[]>(`${this.basePath}/${dossierId}/documents`);
  }

  deposerDocument(
    dossierId: string,
    file: File,
    type: TypeDossierDocument,
  ): Promise<DossierDocument> {
    const form = new FormData();
    form.append('file', file, file.name);
    form.append('type', type);
    return firstValueFrom(
      this.http.post<DossierDocument>(
        this.resolveUrl(`${this.basePath}/${dossierId}/documents`),
        form,
      ),
    );
  }

  /** Démarre l'extraction bordereau en job asynchrone (202 Accepted). */
  demarrerExtractionBordereau(
    dossierId: string,
    pieceId: string,
  ): Promise<ExtractionJobDto> {
    return firstValueFrom(
      this.http.post<ExtractionJobDto>(
        this.resolveUrl(
          `${this.basePath}/${dossierId}/documents/${pieceId}/extraire-bordereau-async`,
        ),
        {},
      ),
    );
  }

  statutExtractionJob(dossierId: string, jobId: string): Promise<ExtractionJobDto> {
    return this.get<ExtractionJobDto>(
      `${this.basePath}/${dossierId}/documents/extraction-jobs/${jobId}`,
    );
  }

  listExtractionJobs(dossierId: string): Promise<ExtractionJobDto[]> {
    return this.get<ExtractionJobDto[]>(
      `${this.basePath}/${dossierId}/documents/extraction-jobs`,
    );
  }

  relancerExtractionJob(dossierId: string, jobId: string): Promise<ExtractionJobDto> {
    return firstValueFrom(
      this.http.post<ExtractionJobDto>(
        this.resolveUrl(
          `${this.basePath}/${dossierId}/documents/extraction-jobs/${jobId}/relancer`,
        ),
        {},
      ),
    );
  }

  /** Prévisualisation LLM synchrone (compat). Préférer demarrerExtractionBordereau. */
  previsualiserBordereau(
    dossierId: string,
    pieceId: string,
  ): Promise<{ arbre: ImportNoeudPreview[]; articleCount: number; pieceId: string }> {
    return firstValueFrom(
      this.http.post<{ arbre: ImportNoeudPreview[]; articleCount: number; pieceId: string }>(
        this.resolveUrl(
          `${this.basePath}/${dossierId}/documents/${pieceId}/previsualiser-bordereau`,
        ),
        {},
      ),
    );
  }

  /** Persiste l'arbre revu inline (remplace le DPGF existant si confirmReplace). */
  validerBordereau(
    dossierId: string,
    arbre: ImportNoeudPreview[],
    pieceId?: string,
    confirmReplace = false,
  ): Promise<ValiderBordereauResult> {
    let params = new HttpParams().set('confirmReplace', String(confirmReplace));
    if (pieceId) {
      params = params.set('pieceId', pieceId);
    }
    return firstValueFrom(
      this.http.post<ValiderBordereauResult>(
        this.resolveUrl(`${this.basePath}/${dossierId}/documents/valider-bordereau`),
        { arbre },
        { params },
      ),
    );
  }

  /** Étape 2 mode auto — extraction + persistance immédiate (compat). */
  extraireBordereau(dossierId: string, pieceId?: string): Promise<{ dpgfId: string; numero: string }> {
    const path = pieceId
      ? `${this.basePath}/${dossierId}/documents/${pieceId}/extraire-bordereau`
      : `${this.basePath}/${dossierId}/documents/extraire-bordereau`;
    return firstValueFrom(
      this.http.post<{ dpgfId: string; numero: string }>(this.resolveUrl(path), {}),
    );
  }

  /** Étape 2 mode manuel — DPGF vide rattaché au dossier. */
  initBordereauManuel(dossierId: string): Promise<{ dpgfId: string; numero: string }> {
    return firstValueFrom(
      this.http.post<{ dpgfId: string; numero: string }>(
        this.resolveUrl(`${this.basePath}/${dossierId}/documents/init-bordereau-manuel`),
        {},
      ),
    );
  }

  supprimerDocument(dossierId: string, documentId: string): Promise<void> {
    return this.deleteRequest(`${this.basePath}/${dossierId}/documents/${documentId}`);
  }

  /**
   * Propose un descriptif technique pour un article à partir du CPS indexé (Gemini).
   * Retourne `null` si aucune section pertinente (HTTP 204).
   */
  proposerDescriptif(
    dossierId: string,
    cpsDocumentId: string,
    articleId: string,
  ): Promise<DescriptifPropose | null> {
    const params = new HttpParams().set('articleId', articleId);
    return firstValueFrom(
      this.http.post<DescriptifPropose | null>(
        this.resolveUrl(
          `${this.basePath}/${dossierId}/documents/cps/${cpsDocumentId}/descriptif-propose`,
        ),
        {},
        { params },
      ),
    );
  }

  /** Bookmark legacy AOC → dossier lié (404 → null). */
  async findByAppelOffreClientId(appelOffreClientId: string): Promise<DossierEtude | null> {
    try {
      return await this.get<DossierEtude>(
        this.basePath,
        new HttpParams().set('appelOffreClientId', appelOffreClientId),
      );
    } catch (e) {
      const err = e as { status?: number };
      if (err?.status === 404) return null;
      throw e;
    }
  }

  listerPiecesAttendues(dossierId: string): Promise<DossierPieceAttendue[]> {
    return this.get<DossierPieceAttendue[]>(`${this.basePath}/${dossierId}/pieces-attendues`);
  }

  creerPieceAttendue(
    dossierId: string,
    body: { type: string; libelle: string; obligatoire?: boolean },
  ): Promise<DossierPieceAttendue> {
    return this.post<DossierPieceAttendue>(`${this.basePath}/${dossierId}/pieces-attendues`, body);
  }

  updatePieceAttendue(
    dossierId: string,
    pieceId: string,
    body: { libelle?: string; obligatoire?: boolean },
  ): Promise<DossierPieceAttendue> {
    return firstValueFrom(
      this.http.patch<DossierPieceAttendue>(
        this.resolveUrl(`${this.basePath}/${dossierId}/pieces-attendues/${pieceId}`),
        body,
      ),
    );
  }

  supprimerPieceAttendue(dossierId: string, pieceId: string): Promise<void> {
    return this.deleteRequest(`${this.basePath}/${dossierId}/pieces-attendues/${pieceId}`);
  }

  lierPieceAttendue(
    dossierId: string,
    pieceId: string,
    dossierDocumentId: string,
  ): Promise<DossierPieceAttendue> {
    return this.post<DossierPieceAttendue>(
      `${this.basePath}/${dossierId}/pieces-attendues/${pieceId}/lier`,
      { dossierDocumentId },
    );
  }

  /**
   * Métadonnées + checklist depuis CPS indexé. `null` si 204 (fallback manuel).
   * `cpsDocumentId` = id de la pièce DossierDocument CPS.
   */
  async proposerMarche(
    dossierId: string,
    cpsDocumentId: string,
  ): Promise<MarchePropose | null> {
    try {
      return await firstValueFrom(
        this.http.post<MarchePropose>(
          this.resolveUrl(
            `${this.basePath}/${dossierId}/documents/cps/${cpsDocumentId}/proposer-marche`,
          ),
          {},
        ),
      );
    } catch (e) {
      const err = e as { status?: number };
      if (err?.status === 204) return null;
      throw e;
    }
  }

  appliquerPropositionMarche(
    dossierId: string,
    body: {
      metadonnees?: MarchePropose['metadonnees'];
      piecesAttendues?: MarchePropose['piecesAttendues'];
    },
  ): Promise<DossierEtude> {
    return this.post<DossierEtude>(
      `${this.basePath}/${dossierId}/pieces-attendues/appliquer-proposition`,
      body,
    );
  }

  /**
   * Propose une décomposition brouillon (catalogue + absents). Jamais persistée.
   * Retourne `null` si aucun besoin exploitable (HTTP 204).
   */
  proposerDecomposition(
    dossierId: string,
    articleId: string,
    cpsDocumentId?: string | null,
  ): Promise<DecompositionPropose | null> {
    let params = new HttpParams();
    if (cpsDocumentId) {
      params = params.set('cpsDocumentId', cpsDocumentId);
    }
    return firstValueFrom(
      this.http.post<DecompositionPropose | null>(
        this.resolveUrl(
          `${this.basePath}/${dossierId}/articles/${articleId}/decomposition-propose`,
        ),
        {},
        { params },
      ),
    );
  }

  /** L5 — rafraîchit les prix gelés ITEM du dossier (étude non validée). */
  async refreshPrices(dossierId: string): Promise<{ dpuRefreshed: number }> {
    return firstValueFrom(
      this.http.post<{ dpuRefreshed: number }>(
        this.resolveUrl(`${this.basePath}/${dossierId}/refresh-prices`),
        {},
      ),
    );
  }

  /** L6 — synthèse coûts / origines (étape 5). */
  async getSyntheseCout(dossierId: string): Promise<SyntheseCoutAffaire> {
    return firstValueFrom(
      this.http.get<SyntheseCoutAffaire>(
        this.resolveUrl(`${this.basePath}/${dossierId}/synthese-cout`),
      ),
    );
  }

  /** L8 — liste des avis (optionnellement filtrée par nœud). */
  async listAvis(dossierId: string, noeudId?: string | null): Promise<AvisExecution[]> {
    let params = new HttpParams();
    if (noeudId) params = params.set('noeudId', noeudId);
    return firstValueFrom(
      this.http.get<AvisExecution[]>(this.resolveUrl(`${this.basePath}/${dossierId}/avis`), {
        params,
      }),
    );
  }

  async getAvisResume(dossierId: string): Promise<AvisExecutionResume> {
    return firstValueFrom(
      this.http.get<AvisExecutionResume>(
        this.resolveUrl(`${this.basePath}/${dossierId}/avis/resume`),
      ),
    );
  }

  async createAvis(
    dossierId: string,
    body: {
      dpgfNoeudId: string;
      niveau: NiveauAvisExecution;
      commentaire?: string | null;
      ecartPropose?: number | null;
    },
  ): Promise<AvisExecution> {
    return firstValueFrom(
      this.http.post<AvisExecution>(this.resolveUrl(`${this.basePath}/${dossierId}/avis`), body),
    );
  }

  async traiterAvis(
    dossierId: string,
    avisId: string,
    body: { statut: 'PRIS_EN_COMPTE' | 'ECARTE'; motifTraitement?: string | null },
  ): Promise<AvisExecution> {
    return firstValueFrom(
      this.http.post<AvisExecution>(
        this.resolveUrl(`${this.basePath}/${dossierId}/avis/${avisId}/traiter`),
        body,
      ),
    );
  }

  /** L9 — rattrapage composants LIBRE. */
  async getRattrapage(dossierId: string): Promise<RattrapageResume> {
    return firstValueFrom(
      this.http.get<RattrapageResume>(
        this.resolveUrl(`${this.basePath}/${dossierId}/rattrapage`),
      ),
    );
  }

  async rattrapageIgnorer(
    dossierId: string,
    composantIds: string[],
    motif: string,
  ): Promise<{ updated: number }> {
    return firstValueFrom(
      this.http.post<{ updated: number }>(
        this.resolveUrl(`${this.basePath}/${dossierId}/rattrapage/ignorer`),
        { composantIds, motif },
      ),
    );
  }

  async rattrapageRapprocher(
    dossierId: string,
    composantIds: string[],
    itemId: string,
  ): Promise<{ updated: number }> {
    return firstValueFrom(
      this.http.post<{ updated: number }>(
        this.resolveUrl(`${this.basePath}/${dossierId}/rattrapage/rapprocher`),
        { composantIds, itemId },
      ),
    );
  }

  async rattrapageCreer(
    dossierId: string,
    body: {
      composantIds: string[];
      libelle: string;
      nature: string;
      uomCode?: string | null;
    },
  ): Promise<RattrapageCreerResult> {
    return firstValueFrom(
      this.http.post<RattrapageCreerResult>(
        this.resolveUrl(`${this.basePath}/${dossierId}/rattrapage/creer`),
        body,
      ),
    );
  }

  /** SEKTOR-218 — contexte agent du dossier ouvert. */
  getAgentContext(dossierId: string): Promise<DossierAgentContext> {
    return firstValueFrom(
      this.http.get<DossierAgentContext>(
        this.resolveUrl(`${this.basePath}/${dossierId}/agent`),
      ),
    );
  }

  agentChiffrage(dossierId: string): Promise<DossierAgentSuggestion[]> {
    return firstValueFrom(
      this.http.post<DossierAgentSuggestion[]>(
        this.resolveUrl(`${this.basePath}/${dossierId}/agent/actions/chiffrage`),
        {},
      ),
    );
  }

  agentIncoherences(dossierId: string): Promise<DossierAgentSuggestion[]> {
    return firstValueFrom(
      this.http.post<DossierAgentSuggestion[]>(
        this.resolveUrl(`${this.basePath}/${dossierId}/agent/actions/incoherences`),
        {},
      ),
    );
  }

  agentRattachements(dossierId: string): Promise<DossierAgentSuggestion[]> {
    return firstValueFrom(
      this.http.post<DossierAgentSuggestion[]>(
        this.resolveUrl(`${this.basePath}/${dossierId}/agent/actions/rattachements-catalogue`),
        {},
      ),
    );
  }

  agentAccepter(dossierId: string, suggestionId: string): Promise<DossierAgentSuggestion> {
    return firstValueFrom(
      this.http.post<DossierAgentSuggestion>(
        this.resolveUrl(
          `${this.basePath}/${dossierId}/agent/suggestions/${suggestionId}/accepter`,
        ),
        {},
      ),
    );
  }

  agentRefuser(dossierId: string, suggestionId: string): Promise<DossierAgentSuggestion> {
    return firstValueFrom(
      this.http.post<DossierAgentSuggestion>(
        this.resolveUrl(
          `${this.basePath}/${dossierId}/agent/suggestions/${suggestionId}/refuser`,
        ),
        {},
      ),
    );
  }

  agentCorriger(
    dossierId: string,
    suggestionId: string,
    note: string,
  ): Promise<DossierAgentSuggestion> {
    return firstValueFrom(
      this.http.post<DossierAgentSuggestion>(
        this.resolveUrl(
          `${this.basePath}/${dossierId}/agent/suggestions/${suggestionId}/corriger`,
        ),
        { note },
      ),
    );
  }

  /** L12 — capitalisation bibliothèque (après VALIDEE). */
  async getCapitalisation(dossierId: string): Promise<CapitalisationResume> {
    return firstValueFrom(
      this.http.get<CapitalisationResume>(
        this.resolveUrl(`${this.basePath}/${dossierId}/capitalisation`),
      ),
    );
  }

  createGuestLink(id: string, body: GuestLinkCreate): Promise<GuestLinkCreated> {
    return this.post<GuestLinkCreated>(`${this.basePath}/${id}/guest-links`, body);
  }

  async capitalisationVerser(
    dossierId: string,
    selections: Array<{
      noeudId: string;
      decision?: string;
      codeOverride?: string;
    }>,
  ): Promise<CapitalisationVersementResult> {
    return firstValueFrom(
      this.http.post<CapitalisationVersementResult>(
        this.resolveUrl(`${this.basePath}/${dossierId}/capitalisation/verser`),
        { selections },
      ),
    );
  }

  async getConsultation(dossierId: string): Promise<ConsultationEtude | null> {
    try {
      return await firstValueFrom(
        this.http.get<ConsultationEtude>(
          this.resolveUrl(`${this.basePath}/${dossierId}/consultation`),
        ),
      );
    } catch (err) {
      if (err instanceof HttpErrorResponse && err.status === 404) {
        return null;
      }
      throw err;
    }
  }

  openConsultation(
    dossierId: string,
    body?: { cleStables?: string[]; partenaireIds?: string[] },
  ): Promise<ConsultationEtude> {
    return this.post<ConsultationEtude>(`${this.basePath}/${dossierId}/consultation`, body ?? {});
  }

  replacePaquet(dossierId: string, cleStables: string[]): Promise<ConsultationEtude> {
    return this.put<ConsultationEtude>(`${this.basePath}/${dossierId}/consultation/paquet`, {
      cleStables,
    });
  }

  inviteFournisseur(dossierId: string, partenaireId: string): Promise<ConsultationEtude> {
    return this.post<ConsultationEtude>(`${this.basePath}/${dossierId}/consultation/fournisseurs`, {
      partenaireId,
    });
  }

  recevoirDevis(
    dossierId: string,
    body: {
      partenaireId: string;
      documentId?: string;
      lignes?: Array<{ cleStable: string; designation?: string; prixUnitaire: number; unite?: string; quantite?: number }>;
    },
  ): Promise<ConsultationEtude> {
    return this.post<ConsultationEtude>(`${this.basePath}/${dossierId}/consultation/devis`, body);
  }

  identifierConsultation(dossierId: string, cleStables: string[]): Promise<ConsultationEtude> {
    return this.post<ConsultationEtude>(`${this.basePath}/${dossierId}/consultation/identifier`, {
      cleStables,
    });
  }
}
