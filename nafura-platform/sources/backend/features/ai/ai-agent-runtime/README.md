# AI Agent Runtime Module

Owns action-oriented AI execution over platform tools.

## Responsibilities (v1)
- AGENT conversation action proposal pipeline.
- Persisted agent runs/actions/approvals/execution logs.
- Approval workflow: approve/reject per proposed action.
- Execution policy gate (permission + optional entitlement).
- Tool registry contract for action execution adapters.

## Endpoints (v1)
- `POST /api/ai/conversations/{conversationId}/agent/propose`
- `GET /api/ai/conversations/{conversationId}/agent/actions`
- `POST /api/ai/conversations/{conversationId}/agent/actions/{actionId}/approve`
- `POST /api/ai/conversations/{conversationId}/agent/actions/{actionId}/reject`
- `POST /api/ai/conversations/{conversationId}/agent/actions/{actionId}/execute`

## Feature Flags
- `nafura.ai.agent-runtime.enabled` (default: `true` when module is present)

## Notes
- Requires AGENT-mode conversation session (`LlmMode.AGENT`).
- Uses `llm-provider` for proposal generation and cost/audit linkage.
- Current execution ships with a baseline `noop` tool; business tools are added incrementally.
