export const AUDIT_EVENTS = {
  USER_REGISTERED: { name: "auth.user_registered", level: "info" },
  LOGIN_SUCCEEDED: { name: "auth.login_succeeded", level: "info" },
  LOGIN_FAILED: { name: "auth.login_failed", level: "warn" },
  TOKEN_REFRESHED: { name: "auth.token_refreshed", level: "info" },
  USER_LOGGED_OUT: { name: "auth.user_logged_out", level: "info" },
} as const;

export type AuditEventKey = keyof typeof AUDIT_EVENTS;

/** Request-derived context threaded through service calls for audit trails. */
export interface AuditContext {
  ip?: string;
}

export interface AuditEvent extends AuditContext {
  event: AuditEventKey;
  userId?: string;
  /** Non-sensitive context only — never passwords, tokens, or raw payloads. */
  metadata?: Record<string, unknown>;
}
