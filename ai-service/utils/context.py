from contextvars import ContextVar

# Global ContextVar for Token Forwarding pattern.
# This allows the API Gateway (FastAPI) to securely pass the authenticated user's
# JWT token deeply into any LangGraph or async agent node without polluting function signatures.
auth_token: ContextVar[str | None] = ContextVar("auth_token", default=None)
