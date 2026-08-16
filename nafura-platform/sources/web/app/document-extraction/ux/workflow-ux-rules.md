# Document Workflow UX Rules

## Primary Action: Import Document

### Naming
- **Primary action label**: "Import Document" (not "Add Document" or "Upload Document")
- **Icon**: `upload_file` or `file_upload`
- **Tooltip**: "Import a document from file, scanner, or external source"

### Scope
The "Import Document" action covers:
- File upload (drag & drop or file picker)
- Scanner input (future)
- Email connectors (future)
- Cloud drive connectors (future)

### Rule
- **No document exists without an actual file**
- Empty document creation is not supported
- All documents must originate from an import/scan action

---

## Review/Edit Popup Rules

### Auto-Save Behavior
- **NO "Save" button exists**
- All changes are automatically saved as DRAFT
- Auto-save occurs:
  - On field blur
  - After debounce delay (e.g., 500ms after last keystroke)
  - On popup close (if dirty)

### Primary Action: Validate

#### Button Rules
- **Button label**: "Validate"
- **Button position**: Primary action (right side, prominent)
- **Button state**:
  - **Enabled**: When `ValidationState = VALID`
  - **Disabled**: When `ValidationState = INVALID`
  - **Disabled tooltip**: "Fix validation errors before validating"

#### Validation State = INVALID
- Button is **disabled**
- Display error indicators:
  - Error count badge: "Errors (n)"
  - Field-level error messages
  - Summary of blocking errors
- User must fix errors before validation

#### Validation State = VALID
- Button is **enabled**
- Clicking validates the document (DRAFT → VALIDATED)
- Optional fields do NOT block validation
- If a field blocks validation, it is NOT optional

### Secondary Actions

#### Cancel/Close
- **Label**: "Close" or "Cancel"
- **Behavior**: Closes popup, auto-saves any changes
- **No confirmation needed** (auto-save ensures no data loss)

#### Reject (Optional)
- **Label**: "Reject"
- **Position**: Secondary action (left side)
- **Behavior**: Opens rejection dialog requiring reason
- **Transition**: DRAFT → REJECTED

---

## List View Display Rules

### Primary Badge (Status)
Display the workflow status:
- **Draft** (when status = DRAFT)
- **Validated** (when status = VALIDATED)
- **Rejected** (when status = REJECTED)

### Secondary Badge (Draft Only)
Only show secondary badge when status = DRAFT:
- **"Draft · Partial"** (when completenessState = PARTIAL)
- **"Draft · Complete"** (when completenessState = COMPLETE)
- **"Draft · Errors (n)"** (when validationState = INVALID and errorCount > 0)

### Examples
```
Status Column Display:
- "Draft · Partial"
- "Draft · Complete"
- "Draft · Errors (3)"
- "Validated"
- "Rejected"
```

### Badge Styling
- **Primary badge**: Status color (Draft = gray, Validated = green, Rejected = red)
- **Secondary badge**: Muted color, smaller font
- **Error badge**: Warning/error color (orange/red)

---

## Field Validation Rules

### Required Fields
- Must be filled and valid to allow validation
- Show error state when empty or invalid
- Block validation transition

### Optional Fields
- Can be empty
- Do NOT block validation
- If a field blocks validation, it must be marked as required

### Validation Feedback
- **Real-time validation**: Validate on blur
- **Error display**: Show inline error messages
- **Error summary**: Show error count in popup header
- **Error highlighting**: Highlight invalid fields

---

## Auto-Save Indicators

### Visual Feedback
- **Saving state**: Show spinner or "Saving..." text
- **Saved state**: Brief "Saved" confirmation (1-2 seconds)
- **Error state**: Show error message if auto-save fails

### Timing
- **Debounce delay**: 500ms after last change
- **Save frequency**: Maximum once per 2 seconds
- **On close**: Always save if dirty

---

## Workflow Transition UX

### DRAFT → VALIDATED
- **Action**: Click "Validate" button
- **Requirement**: ValidationState must be VALID
- **Feedback**: Success message, status badge updates
- **Result**: Document becomes exploitable

### DRAFT → REJECTED
- **Action**: Click "Reject" button
- **Requirement**: Rejection reason must be provided
- **Feedback**: Confirmation dialog, status badge updates
- **Result**: Document marked as invalid

### DRAFT → DRAFT (Auto-save)
- **Action**: Automatic (no user action)
- **Trigger**: Field changes, popup close
- **Feedback**: Subtle "Saved" indicator
- **Result**: State updated with new validation/completeness

---

## Error Handling

### Validation Errors
- **Display**: Inline field errors + summary
- **Count**: Show total error count
- **Grouping**: Group by field or error type
- **Navigation**: Allow clicking errors to focus fields

### Save Errors
- **Display**: Toast/notification
- **Retry**: Automatic retry with exponential backoff
- **Fallback**: Show manual retry option if auto-retry fails

### Transition Errors
- **Display**: Error message explaining why transition failed
- **Recovery**: User must fix issues and retry

---

## Accessibility

### Keyboard Navigation
- **Tab order**: Logical flow through fields
- **Validate action**: Accessible via keyboard (Enter/Space)
- **Error focus**: Auto-focus first error field when validation fails

### Screen Readers
- **Status announcements**: Announce status changes
- **Error announcements**: Announce validation errors
- **Save feedback**: Announce save success/failure

### ARIA Labels
- **Validate button**: `aria-label="Validate document"`
- **Error count**: `aria-live="polite"` for dynamic updates
- **Status badges**: `aria-label="Document status: {status}"`
