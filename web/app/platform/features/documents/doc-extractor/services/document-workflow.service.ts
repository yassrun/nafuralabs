/**
 * Document Workflow Service
 * 
 * Handles workflow transitions and state management.
 * Enforces business rules for document status changes.
 */

import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import {
  DocumentWorkflowStatus,
  DocumentWorkflowState,
  isTransitionAllowed,
} from '../models/document-workflow.model';
import { DocumentValidationService, ValidationResult } from './document-validation.service';

export interface WorkflowTransitionRequest {
  documentId: string;
  targetStatus: DocumentWorkflowStatus;
  rejectionReason?: string;
}

export interface WorkflowTransitionResult {
  success: boolean;
  previousState: DocumentWorkflowState;
  newState: DocumentWorkflowState;
  error?: string;
}

/**
 * Document Workflow Service
 */
@Injectable({ providedIn: 'root' })
export class DocumentWorkflowService {
  constructor(
    private validationService: DocumentValidationService
  ) {}

  /**
   * Execute workflow transition.
   * Validates transition rules before applying.
   */
  transition(
    request: WorkflowTransitionRequest,
    currentState: DocumentWorkflowState,
    validationResult?: ValidationResult
  ): Observable<WorkflowTransitionResult> {
    // Validate transition is allowed
    if (!isTransitionAllowed(currentState.status, request.targetStatus)) {
      return throwError(() => new Error(
        `Transition from ${currentState.status} to ${request.targetStatus} is not allowed`
      ));
    }

    // Special validation for DRAFT → VALIDATED transition
    if (request.targetStatus === DocumentWorkflowStatus.VALIDATED) {
      if (!validationResult) {
        return throwError(() => new Error('Validation result required for validation transition'));
      }

      if (!this.validationService.canValidate(currentState)) {
        return throwError(() => new Error(
          'Cannot validate document: validation state is INVALID'
        ));
      }
    }

    // Special validation for DRAFT → REJECTED transition
    if (request.targetStatus === DocumentWorkflowStatus.REJECTED) {
      if (!request.rejectionReason || request.rejectionReason.trim().length === 0) {
        return throwError(() => new Error('Rejection reason is required'));
      }
    }

    // Build new state
    const newState: DocumentWorkflowState = {
      status: request.targetStatus,
      rejectionReason: request.targetStatus === DocumentWorkflowStatus.REJECTED
        ? request.rejectionReason
        : undefined,
      // Clear secondary states when leaving DRAFT
      validationState: request.targetStatus === DocumentWorkflowStatus.DRAFT
        ? currentState.validationState
        : undefined,
      completenessState: request.targetStatus === DocumentWorkflowStatus.DRAFT
        ? currentState.completenessState
        : undefined,
      errorCount: request.targetStatus === DocumentWorkflowStatus.DRAFT
        ? currentState.errorCount
        : undefined,
    };

    return of({
      success: true,
      previousState: currentState,
      newState,
    });
  }

  /**
   * Auto-save draft (DRAFT → DRAFT transition).
   * This is the only "save" action allowed - it's automatic.
   */
  autoSaveDraft(
    documentId: string,
    currentState: DocumentWorkflowState,
    validationResult: ValidationResult
  ): Observable<WorkflowTransitionResult> {
    if (currentState.status !== DocumentWorkflowStatus.DRAFT) {
      return throwError(() => new Error('Auto-save only applies to DRAFT documents'));
    }

    const newState = this.validationService.buildWorkflowState(
      validationResult,
      DocumentWorkflowStatus.DRAFT
    );

    return of({
      success: true,
      previousState: currentState,
      newState,
    });
  }

  /**
   * Validate document (DRAFT → VALIDATED transition).
   */
  validateDocument(
    documentId: string,
    currentState: DocumentWorkflowState,
    validationResult: ValidationResult
  ): Observable<WorkflowTransitionResult> {
    return this.transition(
      {
        documentId,
        targetStatus: DocumentWorkflowStatus.VALIDATED,
      },
      currentState,
      validationResult
    );
  }

  /**
   * Reject document (DRAFT → REJECTED transition).
   */
  rejectDocument(
    documentId: string,
    currentState: DocumentWorkflowState,
    rejectionReason: string
  ): Observable<WorkflowTransitionResult> {
    return this.transition(
      {
        documentId,
        targetStatus: DocumentWorkflowStatus.REJECTED,
        rejectionReason,
      },
      currentState
    );
  }
}
